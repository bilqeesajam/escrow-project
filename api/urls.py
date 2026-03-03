from django.urls import path
from .views import DashboardTransactionListView

urlpatterns = [
    path("dashboard/", DashboardTransactionListView.as_view(), name="dashboard"),
]

