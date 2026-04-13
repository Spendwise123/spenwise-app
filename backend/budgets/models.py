from django.db import models
from django.conf import settings

class Budget(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='budgets')
    category = models.CharField(max_length=100)
    limit = models.DecimalField(max_digits=12, decimal_places=2)
    period = models.CharField(max_length=20, default='monthly') # monthly, yearly, etc.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'category', 'period')

    def __str__(self):
        return f"{self.category} Budget: {self.limit}"
