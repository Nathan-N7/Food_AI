from django.contrib import admin

from .models import Friendship, Generation, Profile

admin.site.register(Profile)
admin.site.register(Generation)
admin.site.register(Friendship)



