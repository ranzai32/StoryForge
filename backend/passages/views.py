 
from rest_framework import viewsets, mixins, permissions  
from .models import Passage
from .serializers import PassageSerializer
 
class PassageViewSet(mixins.CreateModelMixin,
                       mixins.RetrieveModelMixin,
                       viewsets.GenericViewSet):
 
 
    queryset = Passage.objects.all().select_related('story', 'user') 
    serializer_class = PassageSerializer
    
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]  

    
    def perform_create(self, serializer):
 
        serializer.save(user=self.request.user)