from django.db import models
from django.conf import settings 
from story_editor.models import Story  

class Passage(models.Model):

    story = models.ForeignKey(
        Story,
        on_delete=models.CASCADE, 
        related_name='passages'   
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE, 
    )
    path = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        user_identifier = self.user.nickname if hasattr(self.user, 'nickname') else self.user.email
        return f'Passage for "{self.story.title}" by {user_identifier}'
