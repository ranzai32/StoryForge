from rest_framework import serializers
from .models import Passage
 

class PassageSerializer(serializers.ModelSerializer):
 
    story_title = serializers.CharField(source='story.title', read_only=True)
 
    user_nickname = serializers.CharField(source='user.nickname', read_only=True)

    class Meta:
        model = Passage
 
        fields = [
            'id',              
            'story',          # ID истории (ожидаем при POST)
            'story_title',    # Название истории (только чтение)
            'user',           # ID пользователя (только чтение, устанавливается во View)
            'user_nickname',  # Никнейм пользователя (только чтение)
            'path',           # Массив пути (ожидаем при POST)
            'created_at'      # Дата создания (только чтение)
        ]
        
        read_only_fields = ['id', 'story_title', 'user', 'user_nickname', 'created_at']