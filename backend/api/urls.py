from django.contrib import admin;
from django.urls import path;

from .views import (
    validationFoodView,
    RegenerateImageView,
    RegisterView,
    LoginView,
    GenerationListView,

)


urlpatterns = [
     path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("generate/", validationFoodView.as_view(), name="generate"),
    path("regenerate/", RegenerateImageView.as_view(), name="regenerate"),
    path("generations/", GenerationListView.as_view(), name="generations-list"),
    
]