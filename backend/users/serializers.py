from django.contrib.auth import get_user_model
from rest_framework import serializers

CustomUser = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'nickname', 'password') 

    def create(self, validated_data):
        try:
            user = CustomUser.objects.create_user(
                email=validated_data['email'],
                password=validated_data['password'],
                nickname=validated_data['nickname'] 
            )
        except KeyError as e:
            print(f"!!! KeyError в UserSerializer.create при доступе к ключу: {e}")
            print(f"!!! Содержимое validated_data: {validated_data}")
            raise e 
        return user