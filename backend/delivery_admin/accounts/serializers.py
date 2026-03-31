from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Restaurant


# ── Restaurant ────────────────────────────────────────────────────

class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Restaurant
        fields = ['id', 'name', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


# ── Register ──────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    password          = serializers.CharField(write_only=True, min_length=6)
    restaurant_name   = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ['id', 'email', 'name', 'password', 'restaurant_name']
        read_only_fields = ['id']

    def create(self, validated_data):
        restaurant_name = validated_data.pop('restaurant_name')
        password        = validated_data.pop('password')

        user = User.objects.create(password=password, **validated_data)

        # Cria o primeiro restaurante junto com o cadastro
        Restaurant.objects.create(owner=user, name=restaurant_name)

        return user

        
# ── Login ─────────────────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('E-mail ou senha inválidos.')
        if not user.is_active:
            raise serializers.ValidationError('Conta desativada.')
        data['user'] = user
        return data


# ── User (leitura) ────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    restaurants = RestaurantSerializer(many=True, read_only=True)

    class Meta:
        model  = User
        fields = ['id', 'email', 'name', 'created_at', 'restaurants']
        read_only_fields = ['id', 'created_at']