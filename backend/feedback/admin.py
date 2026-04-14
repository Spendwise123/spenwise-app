from django.contrib import admin
from .models import Feedback

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('transaction', 'user', 'suggested_category', 'confirmed_category', 'is_confirmed')
    list_filter = ('is_confirmed',)
    search_fields = ('user__email', 'transaction__description')
