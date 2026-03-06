from django.urls import path
from . import views

urlpatterns = [
    # path('api/users/', views.get_users, name='get_users'),
    # path('api/users/<uuid:user_id>/', views.get_user_by_id, name='get_user_by_id'),
    # 
    path('api/disputes/', views.list_disputes, name='list_disputes'), #GET

    path('api/disputes/status/open/', views.list_disputes_by_status, {'status': 'open'}, name='list_disputes_open'), #GET
    path('api/disputes/status/under-review/', views.list_disputes_by_status, {'status': 'under_review'}, name='list_disputes_under_review'), #GET
    path('api/disputes/status/escalated/', views.list_disputes_by_status, {'status': 'escalated'}, name='list_disputes_escalated'), #GET
    path('api/disputes/status/resolved-buyer/', views.list_disputes_by_status, {'status': 'resolved_buyer'}, name='list_disputes_resolved_buyer'), #GET
    path('api/disputes/status/resolved-seller/', views.list_disputes_by_status, {'status': 'resolved_seller'}, name='list_disputes_resolved_seller'), #GET
    path('api/disputes/status/closed/', views.list_disputes_by_status, {'status': 'closed'}, name='list_disputes_closed'), #GET

    path('api/disputes/<uuid:dispute_id>/internal-notes/', views.dispute_internal_notes, name='dispute_internal_notes'), #POST
    path('api/disputes/<uuid:dispute_id>/', views.dispute_detail, name='dispute_detail'), #GET

    path('api/disputes/<uuid:dispute_id>/decisions/release-to-seller/', views.dispute_decision_release_to_seller, name='dispute_decision_release_to_seller'), #POST
    path('api/disputes/<uuid:dispute_id>/decisions/refund-buyer/', views.dispute_decision_refund_buyer, name='dispute_decision_refund_buyer'), #POST
    path('api/disputes/<uuid:dispute_id>/decisions/split/', views.dispute_decision_split, name='dispute_decision_split'), #POST

    path('api/disputes/<uuid:dispute_id>/decision-logs/', views.dispute_decision_logs, name='dispute_decision_logs'), #POST
    path('api/disputes/<uuid:dispute_id>/sla/', views.dispute_sla, name='dispute_sla'), #POST
]
