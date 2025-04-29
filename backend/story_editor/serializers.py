from rest_framework import serializers
from .models import Story, Character, Chapter, Action

class ActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Action
        fields = ['id', 'text', 'source_chapter', 'target_chapter']

class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ['id', 'title', 'content', 'story', 'illustration'] 

class CharacterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Character
        fields = ['id', 'name', 'description', 'story']

class StorySerializer(serializers.ModelSerializer):
    author_nickname = serializers.ReadOnlyField(source='author.nickname')

    class Meta:
        model = Story
        fields = [
            'id',
            'title',
            'description',
            'genre',
            'author',
            'author_nickname',
            'cover_image',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['author', 'author_nickname', 'created_at', 'updated_at']
