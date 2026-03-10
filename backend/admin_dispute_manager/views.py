import json

from django.http import JsonResponse
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from supabase import create_client

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

ALLOWED_DISPUTE_STATUSES = {
    'open',
    'resolved',
    'under_review',
}

STATUS_ALIASES = {
    'release_to_seller': 'resolved',
    'refund_buyer': 'resolved',
    'split': 'under_review',
    'under-review': 'under_review',
    'under review': 'under_review',
}

# Joins based on actual schema:
# disputes.transaction_id -> transactions.id
# disputes.opened_by_profile_id -> profiles.id
# disputes.resolved_by_admin_profile_id -> profiles.id
DISPUTE_JOIN = """
    *,
    transaction:transactions(*),
    opened_by:profiles!disputes_opened_by_profile_id_fkey(*),
    resolved_by_admin:profiles!disputes_resolved_by_admin_profile_id_fkey(*)
"""


# ──────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────

def _parse_json_body(request):
    if not request.body:
        return {}
    try:
        return json.loads(request.body)
    except json.JSONDecodeError:
        return {}


def _ensure_admin(request):
    # Temporary bypass to allow testing without JWT/auth integration.
    return True


def _normalize_status(raw_status):
    if raw_status is None:
        return None
    normalized = str(raw_status).strip().lower()
    return STATUS_ALIASES.get(normalized, normalized)


def _serialize_profile(profile):
    if not profile:
        return None
    return {
        'id': profile.get('id'),
        'display_name': profile.get('display_name'),
        'email': profile.get('email'),
    }


def _serialize_transaction(transaction):
    if not transaction:
        return None
    return {
        'id': transaction.get('id'),
        'buyer_id': transaction.get('buyer_id'),
        'seller_id': transaction.get('seller_id'),
        'status': transaction.get('status'),
    }


def _build_timeline(dispute):
    timeline = []
    if dispute.get('created_at'):
        timeline.append({'event': 'created', 'at': dispute['created_at']})
    if dispute.get('resolved_at'):
        timeline.append({
            'event': 'resolved',
            'at': dispute['resolved_at'],
            'by': _serialize_profile(dispute.get('resolved_by_admin')),
        })
    return timeline


def _parse_decision_logs(resolution):
    logs = []
    if not resolution:
        return logs
    for line in resolution.splitlines():
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


def _serialize_dispute(dispute, include_detail=False):
    payload = {
        'id': dispute.get('id'),
        'reason': dispute.get('reason'),
        'description': dispute.get('description'),
        'status': dispute.get('status'),
        'resolution': dispute.get('resolution'),
        'transaction': _serialize_transaction(dispute.get('transaction')),
        'opened_by': _serialize_profile(dispute.get('opened_by')),
        'resolved_by_admin': _serialize_profile(dispute.get('resolved_by_admin')),
        'resolved_at': dispute.get('resolved_at'),
        'created_at': dispute.get('created_at'),
        'updated_at': dispute.get('updated_at'),
    }
    if include_detail:
        payload['timeline'] = _build_timeline(dispute)
    return payload


# ──────────────────────────────────────────
# Dispute views
# ──────────────────────────────────────────

@require_http_methods(["GET"])
def list_disputes(request):
    status = request.GET.get('status')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    query = supabase.table("disputes").select(DISPUTE_JOIN).order("created_at", desc=True)

    if status:
        normalized_status = _normalize_status(status)
        if normalized_status not in ALLOWED_DISPUTE_STATUSES:
            return JsonResponse(
                {'error': f"Invalid status '{status}'. Allowed values: {sorted(ALLOWED_DISPUTE_STATUSES)}"},
                status=400,
            )
        query = query.eq("status", normalized_status)

    if start_date:
        parsed_start = parse_date(start_date)
        if not parsed_start:
            return JsonResponse({'error': 'Invalid start_date. Use YYYY-MM-DD.'}, status=400)
        query = query.gte("created_at", parsed_start.isoformat())

    if end_date:
        parsed_end = parse_date(end_date)
        if not parsed_end:
            return JsonResponse({'error': 'Invalid end_date. Use YYYY-MM-DD.'}, status=400)
        query = query.lte("created_at", parsed_end.isoformat())

    response = query.execute()
    data = [_serialize_dispute(d) for d in response.data]

    return JsonResponse({
        'count': len(data),
        'filters_applied': {
            'status': status,
            'start_date': start_date,
            'end_date': end_date,
        },
        'results': data,
    }, safe=False)


@require_http_methods(["GET"])
def list_disputes_by_status(request, status):
    normalized_status = _normalize_status(status)
    if normalized_status not in ALLOWED_DISPUTE_STATUSES:
        return JsonResponse(
            {'error': f"Invalid status '{status}'. Allowed values: {sorted(ALLOWED_DISPUTE_STATUSES)}"},
            status=400,
        )

    response = supabase.table("disputes") \
        .select(DISPUTE_JOIN) \
        .eq("status", normalized_status) \
        .order("created_at", desc=True) \
        .execute()

    data = [_serialize_dispute(d) for d in response.data]

    return JsonResponse({
        'count': len(data),
        'status_filter': normalized_status,
        'results': data,
    }, safe=False)


@require_http_methods(["GET"])
def dispute_detail(request, dispute_id):
    response = supabase.table("disputes") \
        .select(DISPUTE_JOIN) \
        .eq("id", dispute_id) \
        .execute()

    if not response.data:
        return JsonResponse({'error': 'Dispute not found'}, status=404)

    return JsonResponse(_serialize_dispute(response.data[0], include_detail=True), safe=False)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def dispute_internal_notes(request, dispute_id):
    if not _ensure_admin(request):
        return JsonResponse({'error': 'Admins only'}, status=403)

    response = supabase.table("disputes").select("id").eq("id", dispute_id).execute()
    if not response.data:
        return JsonResponse({'error': 'Dispute not found'}, status=404)

    body = _parse_json_body(request)

    if request.method == 'POST':
        note = body.get('note', '')
        return JsonResponse({
            'message': 'Placeholder only. Persist internal notes table later.',
            'dispute_id': str(dispute_id),
            'note': note,
            'admin_id': getattr(request.user, 'id', None),
            'timestamp': timezone.now(),
            'visible_to_users': False,
        }, status=201)

    return JsonResponse({
        'dispute_id': str(dispute_id),
        'visible_to_users': False,
        'notes': [],
    })


# ──────────────────────────────────────────
# Decision helpers
# ──────────────────────────────────────────

def _apply_decision(dispute, decision, admin_id, note_text='', posted_status=None):
    timestamp = timezone.now().isoformat()
    log_line = f'LOG|{timestamp}|{admin_id}|{decision}|{note_text}'

    existing = dispute.get('resolution') or ''
    resolution = f"{existing}\n{log_line}".strip()

    now = timezone.now().isoformat()
    requested_status = posted_status or decision
    status_applied = _normalize_status(requested_status)

    if status_applied not in ALLOWED_DISPUTE_STATUSES:
        raise ValueError(
            f"Invalid status '{requested_status}'. Allowed values: {sorted(ALLOWED_DISPUTE_STATUSES)}"
        )

    supabase.table("disputes").update({
        'resolution': resolution,
        'resolved_at': now,
        'updated_at': now,
        'status': status_applied,
        'resolved_by_admin_profile_id': str(admin_id) if admin_id else None,
    }).eq("id", dispute['id']).execute()

    return {
        'decision': decision,
        'admin_id': admin_id,
        'timestamp': timestamp,
        'status_applied': status_applied,
        'status_requested': requested_status,
    }


# ──────────────────────────────────────────
# Decision views
# ──────────────────────────────────────────

@csrf_exempt
@require_http_methods(["POST"])
def dispute_decision_release_to_seller(request, dispute_id):
    if not _ensure_admin(request):
        return JsonResponse({'error': 'Admins only'}, status=403)

    response = supabase.table("disputes").select("id, resolution").eq("id", dispute_id).execute()
    if not response.data:
        return JsonResponse({'error': 'Dispute not found'}, status=404)

    body = _parse_json_body(request)
    posted_status = body.get('status_applied') or body.get('decision') or body.get('status')
    try:
        decision_log = _apply_decision(
            response.data[0], 'release_to_seller',
            getattr(request.user, 'id', None),
            body.get('note', ''),
            posted_status=posted_status,
        )
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'dispute_id': str(dispute_id), 'log': decision_log}, status=200)


@csrf_exempt
@require_http_methods(["POST"])
def dispute_decision_refund_buyer(request, dispute_id):
    if not _ensure_admin(request):
        return JsonResponse({'error': 'Admins only'}, status=403)

    response = supabase.table("disputes").select("id, resolution").eq("id", dispute_id).execute()
    if not response.data:
        return JsonResponse({'error': 'Dispute not found'}, status=404)

    body = _parse_json_body(request)
    posted_status = body.get('status_applied') or body.get('decision') or body.get('status')
    try:
        decision_log = _apply_decision(
            response.data[0], 'refund_buyer',
            getattr(request.user, 'id', None),
            body.get('note', ''),
            posted_status=posted_status,
        )
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'dispute_id': str(dispute_id), 'log': decision_log}, status=200)


@csrf_exempt
@require_http_methods(["POST"])
def dispute_decision_split(request, dispute_id):
    if not _ensure_admin(request):
        return JsonResponse({'error': 'Admins only'}, status=403)

    response = supabase.table("disputes").select("id, resolution").eq("id", dispute_id).execute()
    if not response.data:
        return JsonResponse({'error': 'Dispute not found'}, status=404)

    body = _parse_json_body(request)
    split_ratio = body.get('split_ratio', '50:50')
    note = body.get('note', '')
    posted_status = body.get('status_applied') or body.get('decision') or body.get('status')
    try:
        decision_log = _apply_decision(
            response.data[0], 'split',
            getattr(request.user, 'id', None),
            f'split_ratio={split_ratio}; {note}'.strip(),
            posted_status=posted_status,
        )
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=400)

    decision_log['split_ratio'] = split_ratio
    return JsonResponse({'dispute_id': str(dispute_id), 'log': decision_log}, status=200)


# ──────────────────────────────────────────
# SLA & logs
# ──────────────────────────────────────────

@require_http_methods(["GET"])
def dispute_sla(request, dispute_id):
    response = supabase.table("disputes") \
        .select("id, created_at, resolved_at") \
        .eq("id", dispute_id) \
        .execute()

    if not response.data:
        return JsonResponse({'error': 'Dispute not found'}, status=404)

    dispute = response.data[0]
    first_response_at = dispute.get('resolved_at')
    response_time_seconds = None

    if dispute.get('created_at') and first_response_at:
        from datetime import datetime
        created = datetime.fromisoformat(dispute['created_at'])
        first = datetime.fromisoformat(first_response_at)
        response_time_seconds = int((first - created).total_seconds())

    return JsonResponse({
        'dispute_id': str(dispute_id),
        'created_at': dispute.get('created_at'),
        'first_response_at': first_response_at,
        'response_time_seconds': response_time_seconds,
        'sla_status': 'placeholder',
    })


@require_http_methods(["GET"])
def dispute_decision_logs(request, dispute_id):
    response = supabase.table("disputes") \
        .select("id, resolution") \
        .eq("id", dispute_id) \
        .execute()

    if not response.data:
        return JsonResponse({'error': 'Dispute not found'}, status=404)

    logs = _parse_decision_logs(response.data[0].get('resolution'))
    return JsonResponse({'dispute_id': str(dispute_id), 'logs': logs})
