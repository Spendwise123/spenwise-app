from django.db import models
from django.conf import settings
from transactions.models import Transaction

class Feedback(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE)
    suggested_category = models.CharField(max_length=100)
    confirmed_category = models.CharField(max_length=100, null=True, blank=True)
    is_confirmed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for {self.transaction.description} - {self.user.email}"
