from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import BudgetViewSet

router = SimpleRouter()
router.register(r'', BudgetViewSet, basename='budget')

urlpatterns = [
    path('', include(router.urls)),
]
