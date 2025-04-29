from django.contrib.auth.models import AbstractUser, BaseUserManager 
from django.db import models
from django.utils.translation import gettext_lazy as _ 

# --- Кастомный Менеджер ---
class CustomUserManager(BaseUserManager):
    """
    Кастомный менеджер для модели User, где email является уникальным идентификатором
    для аутентификации вместо username.
    """
    def create_user(self, email, password, nickname, **extra_fields):
        """
        Создает и сохраняет User с email, паролем и никнеймом.
        """
        if not email:
            raise ValueError(_('The Email must be set'))
        if not nickname:
             raise ValueError(_('The Nickname must be set'))

        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        user = self.model(email=email, nickname=nickname, **extra_fields)
        user.set_password(password) 
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, nickname, **extra_fields):
        """
        Создает и сохраняет SuperUser с email, паролем и никнеймом.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        return self.create_user(email, password, nickname, **extra_fields)

class CustomUser(AbstractUser):
    
    username = models.CharField(
        max_length=150,
        unique=False,
        blank=True,
        null=True
    )
    email = models.EmailField(unique=True) 
    nickname = models.CharField(max_length=30, unique=True, blank=False, null=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nickname'] 
    objects = CustomUserManager()

    def __str__(self):
        return self.email