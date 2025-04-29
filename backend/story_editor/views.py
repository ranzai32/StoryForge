from rest_framework import viewsets, permissions
from .models import Story, Chapter  
from .models import Story, Character, Chapter, Action
from rest_framework.filters import SearchFilter
from .serializers import StorySerializer, CharacterSerializer, ChapterSerializer, ActionSerializer

class StoryViewSet(viewsets.ModelViewSet):
    
    serializer_class = StorySerializer
 
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        
        user = self.request.user
 
        return Story.objects.filter(author=user).order_by('-updated_at')

    def perform_create(self, serializer):
 
        serializer.save(author=self.request.user)

class ChapterViewSet(viewsets.ModelViewSet):
    serializer_class = ChapterSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]  

    def get_queryset(self):
         
        queryset = Chapter.objects.all()
        story_id = self.request.query_params.get('story_id', None)  
        if story_id is not None:
            
            queryset = queryset.filter(story_id=story_id)
       
        return queryset

    def perform_create(self, serializer):
        serializer.save() 

class CharacterViewSet(viewsets.ModelViewSet):
     
    serializer_class = CharacterSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
         
        queryset = Character.objects.all()
        story_id = self.request.query_params.get('story_id', None)
        if story_id is not None:
            queryset = queryset.filter(story_id=story_id)
         
        return queryset

    def perform_create(self, serializer):
        serializer.save()
        
class ActionViewSet(viewsets.ModelViewSet):
    """
    API endpoint для Действий (Actions).
    """
    serializer_class = ActionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
       
        queryset = Action.objects.all()
        source_chapter_id = self.request.query_params.get('source_chapter_id', None)
        if source_chapter_id is not None:
            queryset = queryset.filter(source_chapter_id=source_chapter_id)
         
        return queryset

    def perform_create(self, serializer):
         
        serializer.save()
        
class PublicStoryViewSet(viewsets.ReadOnlyModelViewSet):
   
    serializer_class = StorySerializer
    permission_classes = [permissions.AllowAny]

    
    filter_backends = [SearchFilter] 
    search_fields = ['title', 'description', 'genre', 'author__nickname'] 
   

    def get_queryset(self):
         
        queryset = Story.objects.all()  

        
        genre_param = self.request.query_params.get('genre', None)
        if genre_param:
            queryset = queryset.filter(genre__iexact=genre_param)

        

        return queryset.order_by('-updated_at') 