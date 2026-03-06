import json

from django.http import JsonResponse
from django.db import IntegrityError
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Disputes, Users

ALLOWED_DISPUTE_STATUSES = {
    'open',
    'under_review',
    'escalated',
    'resolved_buyer',
    'resolved_seller',
    'closed',
}

STATUS_ALIASES = {
    'release_to_seller': 'resolved_seller',
    'refund_buyer': 'resolved_buyer',
    'split': 'under_review',
}


@require_http_methods(["GET"])
def get_users(request):
    users = Users.objects.all().values(
        'id',
        'email',
        'full_name',
        'phone_number',
        'role',
        'national_id_number',
        'id_document_type',
        'date_of_birth',
        'nationality',
        'gender',
        'is_email_verified',
        'is_2fa_enabled',
        'kyc_status',
        'kyc_verified_at',
        'face_scan_verified',
        'last_login',
        'created_at',
        'updated_at',
    )
    return JsonResponse(list(users), safe=False)


@require_http_methods(["GET"])
def get_user_by_id(request, user_id):
    try:
        user = Users.objects.filter(id=user_id).values(
            'id',
            'email',
            'full_name',
            'phone_number',
            'role',
            'national_id_number',
            'id_document_type',
            'date_of_birth',
            'nationality',
            'gender',
            'is_email_verified',
            'is_2fa_enabled',
            'kyc_status',
            'kyc_verified_at',
            'face_scan_verified',
            'last_login',
            'created_at',
            'updated_at',
        ).first()

        if not user:
            return JsonResponse({'error': 'User not found'}, status=404)

        return JsonResponse(user, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def _parse_json_body(request):
    if not request.body:
        return {}
    try:
        return json.loads(request.body)
    except json.JSONDecodeError:
        return {}


def _parse_evidence_paths(raw_paths):
    if not raw_paths:
        return []
    return [path.strip() for path in raw_paths.split(',') if path.strip()]


def _build_timeline(dispute):
    timeline = []
    if dispute.created_at:
        timeline.append({'event': 'created', 'at': dispute.created_at})
    if dispute.assigned_at:
        timeline.append(
            {
                'event': 'assigned',
                'at': dispute.assigned_at,
                'by': _serialize_user(dispute.assigned_mediator),
            }
        )
    if dispute.resolved_at:
        timeline.append(
            {
                'event': 'resolved',
                'at': dispute.resolved_at,
                'by': _serialize_user(dispute.resolved_by),
            }
        )
    return timeline


def _parse_decision_logs(resolution_notes):
    logs = []
    if not resolution_notes:
        return logs

    for line in resolution_notes.splitlines():
        if line.startswith('LOG|'):
            parts = line.split('|')
            if len(parts) >= 4:
                log = {
                    'timestamp': parts[1],
                    'admin_id': parts[2],
                    'decision': parts[3],
                }
                if len(parts) > 4:
                    log['meta'] = '|'.join(parts[4:])
                logs.append(log)

    return logs


def _ensure_admin(request):
    # Temporary bypass to allow testing without JWT/auth integration.
    return True


def _normalize_status(raw_status):
    if raw_status is None:
        return None
    normalized = str(raw_status).strip().lower()
    return STATUS_ALIASES.get(normalized, normalized)


def _serialize_user(user):
    if not user:
        return None
    return {
        'full_name': user.full_name,
        'email': user.email,
        'role': user.role,
    }


def _serialize_transaction(transaction):
    if not transaction:
        return None
    return {
        'title': transaction.title,
        'amount': transaction.amount,
        'currency': transaction.currency,
        'status': transaction.status,
        'delivery_deadline': transaction.delivery_deadline,
    }


def _serialize_dispute(dispute, include_detail=False):
    payload = {
        'id': dispute.id,
        'reason': dispute.reason,
        'status': dispute.status,
        'priority': None,
        'transaction': _serialize_transaction(dispute.transaction),
        'raised_by': _serialize_user(dispute.raised_by),
        'against': _serialize_user(dispute.against),
        'assigned_mediator': _serialize_user(dispute.assigned_mediator),
        'resolved_by': _serialize_user(dispute.resolved_by),
        'assigned_at': dispute.assigned_at,
        'resolved_at': dispute.resolved_at,
        'created_at': dispute.created_at,
        'updated_at': dispute.updated_at,
    }
    if include_detail:
        payload.update(
            {
                'evidence': _parse_evidence_paths(dispute.evidence_paths),
                'messages': [],
                'timeline': _build_timeline(dispute),
            }
        )
    return payload


@require_http_methods(["GET"])
def list_disputes(request):
    queryset = Disputes.objects.select_related(
        'transaction',
        'raised_by',
        'against',
        'assigned_mediator',
        'resolved_by',
    ).order_by('-created_at')

    status = request.GET.get('status')
    priority = request.GET.get('priority')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    if status:
        queryset = queryset.filter(status__iexact=status)

    if start_date:
        parsed_start = parse_date(start_date)
        if not parsed_start:
            return JsonResponse({'error': 'Invalid start_date. Use YYYY-MM-DD.'}, status=400)
        queryset = queryset.filter(created_at__date__gte=parsed_start)

    if end_date:
        parsed_end = parse_date(end_date)
        if not parsed_end:
            return JsonResponse({'error': 'Invalid end_date. Use YYYY-MM-DD.'}, status=400)
        queryset = queryset.filter(created_at__date__lte=parsed_end)

    data = [_serialize_dispute(dispute) for dispute in queryset]

    return JsonResponse(
        {
            'count': len(data),
            'filters_applied': {
                'status': status,
                'priority': priority,
                'start_date': start_date,
                'end_date': end_date,
            },
            'results': data,
        },
        safe=False,
    )


@require_http_methods(["GET"])
def list_disputes_by_status(request, status):
    if status not in ALLOWED_DISPUTE_STATUSES:
        return JsonResponse(
            {'error': f"Invalid status '{status}'. Allowed values: {sorted(ALLOWED_DISPUTE_STATUSES)}"},
            status=400,
        )

    queryset = Disputes.objects.select_related(
        'transaction',
        'raised_by',
        'against',
        'assigned_mediator',
        'resolved_by',
    ).filter(status__iexact=status).order_by('-created_at')
    data = [_serialize_dispute(dispute) for dispute in queryset]

    return JsonResponse(
        {
            'count': len(data),
            'status_filter': status,
            'results': data,
        },
        safe=False,
    )


@require_http_methods(["GET"])
def dispute_detail(request, dispute_id):
    dispute = Disputes.objects.select_related(
        'transaction',
        'raised_by',
        'against',
        'assigned_mediator',
        'resolved_by',
    ).filter(id=dispute_id).first()
    if not dispute:
        return JsonResponse({'error': 'Dispute not found'}, status=404)

    response = _serialize_dispute(dispute, include_detail=True)

    return JsonResponse(response, safe=False)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def dispute_internal_notes(request, dispute_id):
    if not _ensure_admin(request):
        return JsonResponse({'error': 'Admins only'}, status=403)

    dispute = Disputes.objects.filter(id=dispute_id).first()
    if not dispute:
        return JsonResponse({'error': 'Dispute not found'}, status=404)

    body = _parse_json_body(request)

    if request.method == 'POST':
        note = body.get('note', '')
        return JsonResponse(
            {
                'message': 'Placeholder only. Persist internal notes table later.',
                'dispute_id': str(dispute_id),
                'note': note,
                'admin_id': getattr(request.user, 'id', None),
                'timestamp': timezone.now(),
                'visible_to_users': False,
            },
            status=201,
        )

    return JsonResponse(
        {
            'dispute_id': str(dispute_id),
            'visible_to_users': False,
            'notes': [],
        }
    )


def _apply_decision(dispute, decision, admin_id, note_text='', posted_status=None):
    timestamp = timezone.now().isoformat()
    log_line = f'LOG|{timestamp}|{admin_id}|{decision}|{note_text}'

    existing = dispute.resolution_notes or ''
    resolution_notes = f"{existing}\n{log_line}".strip()
    now = timezone.now()
    requested_status = posted_status or decision
    status_applied = _normalize_status(requested_status)
    if status_applied not in ALLOWED_DISPUTE_STATUSES:
        raise ValueError(
            f"Invalid status '{requested_status}'. Allowed values: {sorted(ALLOWED_DISPUTE_STATUSES)}"
        )

    Disputes.objects.filter(id=dispute.id).update(
        resolution_notes=resolution_notes,
        resolved_at=now,
        updated_at=now,
        status=status_applied,
    )

    return {
        'decision': decision,
        'admin_id': admin_id,
        'timestamp': timestamp,
        'status_applied': status_applied,
        'status_requested': requested_status,
    }


@csrf_exempt
@require_http_methods(["POST"])
def dispute_decision_release_to_seller(request, dispute_id):
    if not _ensure_admin(request):
        return JsonResponse({'error': 'Admins only'}, status=403)

    dispute = Disputes.objects.filter(id=dispute_id).first()
    if not dispute:
        return JsonResponse({'error': 'Dispute not found'}, status=404)

    body = _parse_json_body(request)
    posted_status = body.get('status_applied') or body.get('decision') or body.get('status')
    try:
        decision_log = _apply_decision(
            dispute,
            'release_to_seller',
            getattr(request.user, 'id', None),
            body.get('note', ''),
            posted_status=posted_status,
        )
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=400)
    except IntegrityError as e:
        return JsonResponse({'error': 'Decision could not be applied due to DB constraint', 'details': str(e)}, status=400)
    return JsonResponse({'dispute_id': str(dispute_id), 'log': decision_log}, status=200)


@csrf_exempt
@require_http_methods(["POST"])
def dispute_decision_refund_buyer(request, dispute_id):
    if not _ensure_admin(request):
        return JsonResponse({'error': 'Admins only'}, status=403)

    dispute = Disputes.objects.filter(id=dispute_id).first()
    if not dispute:
        return JsonResponse({'error': 'Dispute not found'}, status=404)

    body = _parse_json_body(request)
    posted_status = body.get('status_applied') or body.get('decision') or body.get('status')
    try:
        decision_log = _apply_decision(
            dispute,
            'refund_buyer',
            getattr(request.user, 'id', None),
            body.get('note', ''),
            posted_status=posted_status,
        )
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=400)
    except IntegrityError as e:
        return JsonResponse({'error': 'Decision could not be applied due to DB constraint', 'details': str(e)}, status=400)
    return JsonResponse({'dispute_id': str(dispute_id), 'log': decision_log}, status=200)


@csrf_exempt
@require_http_methods(["POST"])
def dispute_decision_split(request, dispute_id):
    if not _ensure_admin(request):
        return JsonResponse({'error': 'Admins only'}, status=403)

    dispute = Disputes.objects.filter(id=dispute_id).first()
    if not dispute:
        return JsonResponse({'error': 'Dispute not found'}, status=404)

    body = _parse_json_body(request)
    split_ratio = body.get('split_ratio', '50:50')
    note = body.get('note', '')
    posted_status = body.get('status_applied') or body.get('decision') or body.get('status')
    try:
        decision_log = _apply_decision(
            dispute,
            'split',
            getattr(request.user, 'id', None),
            f'split_ratio={split_ratio}; {note}'.strip(),
            posted_status=posted_status,
        )
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=400)
    except IntegrityError as e:
        return JsonResponse({'error': 'Decision could not be applied due to DB constraint', 'details': str(e)}, status=400)
    decision_log['split_ratio'] = split_ratio

    return JsonResponse({'dispute_id': str(dispute_id), 'log': decision_log}, status=200)


@require_http_methods(["GET"])
def dispute_sla(request, dispute_id):
    dispute = Disputes.objects.filter(id=dispute_id).first()
    if not dispute:
        return JsonResponse({'error': 'Dispute not found'}, status=404)

    first_response_at = dispute.assigned_at or dispute.resolved_at
    response_time_seconds = None

    if dispute.created_at and first_response_at:
        response_time_seconds = int((first_response_at - dispute.created_at).total_seconds())

    return JsonResponse(
        {
            'dispute_id': str(dispute_id),
            'created_at': dispute.created_at,
            'first_response_at': first_response_at,
            'response_time_seconds': response_time_seconds,
            'sla_status': 'placeholder',
        }
    )


@require_http_methods(["GET"])
def dispute_decision_logs(request, dispute_id):
    dispute = Disputes.objects.filter(id=dispute_id).first()
    if not dispute:
        return JsonResponse({'error': 'Dispute not found'}, status=404)

    logs = _parse_decision_logs(dispute.resolution_notes)
    return JsonResponse({'dispute_id': str(dispute_id), 'logs': logs})
