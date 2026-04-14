from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import LoanViewSet

router = SimpleRouter()
router.register(r'', LoanViewSet, basename='loan')

urlpatterns = [
    path('', include(router.urls)),
]
