from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PassageViewSet

router = DefaultRouter()
 
router.register(r'passages', PassageViewSet, basename='passage')

urlpatterns = [
    path('', include(router.urls)),
]