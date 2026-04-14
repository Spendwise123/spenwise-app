from rest_framework import serializers
from .models import Loan

class LoanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Loan
        fields = '__all__'
        read_only_fields = ('user', 'monthly_payment', 'remaining_balance', 'total_paid', 'created_at', 'updated_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
