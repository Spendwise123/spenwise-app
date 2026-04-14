from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import Loan
from .serializers import LoanSerializer

class LoanViewSet(viewsets.ModelViewSet):
    serializer_class = LoanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Loan.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['get'])
    def summary(self, request):
        user = request.user
        loans = Loan.objects.filter(user=user, status__in=['approved', 'active'])
        
        total_remaining = loans.aggregate(total=Sum('remaining_balance'))['total'] or 0
        
        return Response({
            'totalRemaining': total_remaining,
            'activeLoans': loans.count()
        })
