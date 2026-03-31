from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    MeView,
    RestaurantListCreateView,
    RestaurantDetailView,
)

urlpatterns = [
    # Auth
    path('auth/register/', RegisterView.as_view(),  name='register'),
    path('auth/login/',    LoginView.as_view(),     name='login'),
    path('auth/logout/',   LogoutView.as_view(),    name='logout'),

    # Usuário logado
    path('auth/me/',       MeView.as_view(),        name='me'),

    # Restaurantes
    path('restaurants/',        RestaurantListCreateView.as_view(), name='restaurant-list'),
    path('restaurants/<uuid:pk>/', RestaurantDetailView.as_view(),  name='restaurant-detail'),
]