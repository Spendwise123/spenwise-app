from django.contrib import admin
from .models import Loan

@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'amount', 'remaining_balance', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('user__email', 'purpose')
