from django.db import models
from django.conf import settings
import math

class Loan(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('active', 'Active'),
        ('paid', 'Paid'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    term_months = models.IntegerField()
    monthly_payment = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    purpose = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    remaining_balance = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    total_paid = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    approved_date = models.DateTimeField(null=True, blank=True)
    admin_note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Calculates monthly payment before saving
        if not self.id or any(getattr(self, f) != self.__class__.objects.get(pk=self.id).getattr(f) 
                              for f in ['amount', 'interest_rate', 'term_months']):
            
            monthly_rate = float(self.interest_rate) / 100 / 12
            amount = float(self.amount)
            term = self.term_months

            if monthly_rate == 0:
                payment = amount / term
            else:
                payment = (amount * monthly_rate * math.pow(1 + monthly_rate, term)) / (math.pow(1 + monthly_rate, term) - 1)
            
            self.monthly_payment = round(payment, 2)
            if self.remaining_balance is None:
                self.remaining_balance = self.amount
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Loan {self.id} - {self.user.email} (₱{self.amount})"
