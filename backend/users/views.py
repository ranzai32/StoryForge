from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from .serializers import UserSerializer
from rest_framework.views import APIView
from rest_framework.response import Response

CustomUser = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer
    
class CurrentUserView(APIView):
    permission_classes = (permissions.IsAuthenticated,) 

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)