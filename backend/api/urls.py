from django.contrib import admin
from django.urls import path

from .views import (
    validationFoodView,
    RegenerateImageView,
    RegisterView,
    LoginView,
    Login2FAView,
    Setup2FAView,
    Verify2FAView,
    Disable2FAView,
    GenerationListView,
    GenerationDeleteView,
    LogoutView,
    PingView
)

from .social_views import (
    MyProfileView,
    UserProfileView,
    UserSearchView,
    FriendsListView,
    FriendRequestSendView,
    FriendRequestsListView,
    FriendRequestAcceptView,
    FriendRequestRejectView,
    FriendRemoveView,
    ConversationsListView,
    MessagesView,
    MarkMessagesReadView,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/login/2fa/", Login2FAView.as_view(), name="login-2fa"),
    path("auth/2fa/setup/", Setup2FAView.as_view(), name="setup-2fa"),
    path("auth/2fa/verify/", Verify2FAView.as_view(), name="verify-2fa"),
    path("auth/2fa/disable/", Disable2FAView.as_view(), name="disable-2fa"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("ping/", PingView.as_view(), name="ping"),
    path("generate/", validationFoodView.as_view(), name="generate"),
    path("regenerate/", RegenerateImageView.as_view(), name="regenerate"),
    path("generations/", GenerationListView.as_view(), name="generations-list"),
    path("generations/<int:pk>/", GenerationDeleteView.as_view(), name="generation-delete"),
    
    # Profile
    path("profile/", MyProfileView.as_view(), name="my-profile"),
    path("profile/<int:user_id>/", UserProfileView.as_view(), name="user-profile"),

    # User search
    path("users/search/", UserSearchView.as_view(), name="user-search"),

    # Friends
    path("friends/", FriendsListView.as_view(), name="friends-list"),
    path("friends/request/", FriendRequestSendView.as_view(), name="friend-request-send"),
    path("friends/requests/", FriendRequestsListView.as_view(), name="friend-requests-list"),
    path("friends/accept/<int:friendship_id>/", FriendRequestAcceptView.as_view(), name="friend-accept"),
    path("friends/reject/<int:friendship_id>/", FriendRequestRejectView.as_view(), name="friend-reject"),
    path("friends/<int:friendship_id>/", FriendRemoveView.as_view(), name="friend-remove"),

    # Messages
    path("messages/conversations/", ConversationsListView.as_view(), name="conversations-list"),
    path("messages/<int:user_id>/", MessagesView.as_view(), name="messages"),
    path("messages/<int:user_id>/read/", MarkMessagesReadView.as_view(), name="mark-read"),
]
