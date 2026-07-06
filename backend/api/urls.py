from django.contrib import admin;
from django.urls import path;
from .views import validationFoodView;

urlpatterns = [
    path("generate/", validationFoodView.as_view(), name = "generate"),
]