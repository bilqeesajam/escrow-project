from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Transaction
from .serializers.dashboard import DashboardTransactionSerializer

class DashboardTransactionListView(ListAPIView):
    serializer_class = DashboardTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Transaction.objects.filter(
            Q(buyer=user) | Q(seller=user)
        ).order_by("-created_at")

        status = self.request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(transaction_id__icontains=search)
                | Q(buyer__username__icontains=search)
                | Q(seller__username__icontains=search)
            )

        return queryset
    
