from django.db import models
from django.conf import settings

class Story(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    genre = models.CharField(max_length=100, blank=True, default='')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='stories'
    )
    cover_image = models.ImageField(
        upload_to='story_covers/',  
        null=True,    
        blank=True    
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'"{self.title}" by {self.author.nickname}'

class Character(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    story = models.ForeignKey(
        Story,
        on_delete=models.CASCADE,
        related_name='characters'
    )
    illustration = models.ImageField(
        upload_to='chapter_illustrations/',  
        null=True,
        blank=True
    )

    def __str__(self):
        return f'{self.name} ({self.story.title})'

class Chapter(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True, default='')
    story = models.ForeignKey(
        Story,
        on_delete=models.CASCADE,
        related_name='chapters'
    )

    def __str__(self):
        return f'{self.title} (Story: {self.story.id})'

class Action(models.Model):
    text = models.CharField(max_length=255)
    source_chapter = models.ForeignKey(
        Chapter,
        on_delete=models.CASCADE,
        related_name='outgoing_actions'
    )
    target_chapter = models.ForeignKey(
        Chapter,
        on_delete=models.SET_NULL,
        related_name='incoming_actions',
        null=True,
        blank=True
    )

    def __str__(self):
        target_title = self.target_chapter.title if self.target_chapter else "[Конец]"
        return f'"{self.text}" (From: {self.source_chapter.title} -> To: {target_title})'
