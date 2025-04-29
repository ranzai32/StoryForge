from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StoryViewSet, ChapterViewSet, CharacterViewSet, ActionViewSet, PublicStoryViewSet
 
router = DefaultRouter()
router.register(r'stories', StoryViewSet, basename='story')
router.register(r'chapters', ChapterViewSet, basename='chapter')
router.register(r'browse-stories', PublicStoryViewSet, basename='public-story')
router.register(r'characters', CharacterViewSet, basename='character')
router.register(r'actions', ActionViewSet, basename='action')
urlpatterns = [
    path('', include(router.urls)),
]