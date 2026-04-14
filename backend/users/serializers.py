from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'first_name', 'last_name', 'date_joined')
        read_only_fields = ('id', 'email', 'date_joined')

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email.split('@')[0]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Match Express response format: id, name, email, role, token
        data['id'] = self.user.id
        data['email'] = self.user.email
        data['name'] = f"{self.user.first_name} {self.user.last_name}".strip() or self.user.email.split('@')[0]
        data['role'] = 'admin' if self.user.is_staff else 'user'
        data['token'] = data.pop('access')
        
        # We don't need 'refresh' for the current frontend if it expects the Express format
        if 'refresh' in data:
            del data['refresh']
            
        return data
