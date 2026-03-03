from rest_framework import serializers
from api.models import Transaction

class DashboardTransactionSerializer(serializers.ModelSerializer):
    counterparty = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            "transaction_id",
            "amount",
            "status",
            "created_at",
            "counterparty",
            "role",
        ]

    def get_counterparty(self, obj):
        user = self.context["request"].user
        if obj.buyer == user:
            return obj.seller.username
        return obj.buyer.username

    def get_role(self, obj):
        user = self.context["request"].user
        if obj.buyer == user:
            return "buyer"
        return "seller"
