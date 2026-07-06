from django.contrib import admin;
from django.urls import path;
from .views import validationFoodView, RegenerateImageView;

urlpatterns = [
    path("generate/", validationFoodView.as_view(), name = "generate"),
    path("regenerate/", RegenerateImageView.as_view())
]