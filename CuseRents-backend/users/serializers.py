from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
from rewards.models import Wallet

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True, 
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password_confirm', 'first_name', 'last_name', 'phone']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True}
        }
    
    def validate(self, attrs):
        """Validate that passwords match"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def validate_email(self, value):
        """Ensure email is unique"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def create(self, validated_data):
        """Create user and associated wallet"""
        validated_data.pop('password_confirm')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
        )
        
        # Create wallet for user
        Wallet.objects.create(user=user)
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Authenticate user"""
        username = attrs.get('username')
        password = attrs.get('password')
        
        # Try to authenticate with username
        user = authenticate(username=username, password=password)
        
        # If username auth fails, try email
        if not user:
            try:
                user_obj = User.objects.get(email=username)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass
        
        if not user:
            raise serializers.ValidationError('Invalid credentials')
        
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled')
        
        attrs['user'] = user
        return attrs

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile
    """
    wallet_balance = serializers.SerializerMethodField()
    wallet_points = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'lat', 'lng', 'address_text',
            'rating_avg', 'total_ratings', 'co2_saved_kg',
            'profile_photo', 'bio', 'verification_level',
            'wallet_balance', 'wallet_points', 'created_at'
        ]
        read_only_fields = ['rating_avg', 'total_ratings', 'co2_saved_kg', 'verification_level']
    
    def get_wallet_balance(self, obj):
        """Get user's wallet balance"""
        try:
            return str(obj.wallet.balance)
        except:
            return "0.00"
    
    def get_wallet_points(self, obj):
        """Get user's reward points"""
        try:
            return obj.wallet.reward_points
        except:
            return 0


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile
    """
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'address_text', 'lat', 'lng', 'bio', 'profile_photo']