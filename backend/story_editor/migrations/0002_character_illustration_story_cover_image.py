# Generated by Django 5.1.7 on 2025-04-29 16:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('story_editor', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='character',
            name='illustration',
            field=models.ImageField(blank=True, null=True, upload_to='chapter_illustrations/'),
        ),
        migrations.AddField(
            model_name='story',
            name='cover_image',
            field=models.ImageField(blank=True, null=True, upload_to='story_covers/'),
        ),
    ]
