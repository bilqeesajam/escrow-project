from django.db import models
from django.contrib.auth.models import User

# class EscrowTransaction(models.Model):
#     buyer = models.ForeignKey(User, related_name='buyer_transactions', on_delete=models.CASCADE)
#     seller = models.ForeignKey(User, related_name='seller_transactions', on_delete=models.CASCADE)
#     description = models.TextField()
#     amount = models.DecimalField(max_digits=10, decimal_places=2)
#     is_completed = models.BooleanField(default=False)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"Transaction {self.id} - {self.amount}"

class Transaction(models.Model):

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("active", "Active"),
        ("completed", "Completed"),
        ("disputed", "Disputed"),
    ]

    transaction_id = models.CharField(max_length=20, unique=True)

    buyer = models.ForeignKey(
        User,
        related_name="buyer_transactions",
        on_delete=models.PROTECT
    )

    seller = models.ForeignKey(
        User,
        related_name="seller_transactions",
        on_delete=models.PROTECT
    )

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["buyer"]),
            models.Index(fields=["seller"]),
        ]

    def __str__(self):
        return f"{self.transaction_id} - {self.status}"