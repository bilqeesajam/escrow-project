from django.contrib import admin
from django.urls import path, include

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from . import views

urlpatterns = [
    path('admin/users/staff/', views.list_staff_users),
    path('admin/users/<int:pk>/email/', views.update_user_email),
    path('admin/users/<int:pk>/toggle-staff/', views.toggle_staff_status),
    path('admin/users/<int:pk>/deactivate/', views.deactivate_user),
    path('admin/employees/', views.create_employee),
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include('admin_dispute_manager.urls')),
]
