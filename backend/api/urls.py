from django.urls import path

from .views import (
    validationFoodView,
    RegenerateImageView,
    RegisterView,
    LoginView,
    TwoFactorVerifyLoginView,
    TwoFactorSetupView,
    TwoFactorConfirmView,
    TwoFactorDisableView,
    GenerationListView,
    GenerationDeleteView,
    ProfileDetailView,
    UserProfileView,
    UserSearchView,
    FriendListView,
    FriendRequestsView,
    FriendRequestSendView,
    FriendRespondView,
    FriendDeleteView,
)

urlpatterns = [
    # Auth
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/2fa/verify/", TwoFactorVerifyLoginView.as_view(), name="two-factor-verify"),
    path("auth/2fa/setup/", TwoFactorSetupView.as_view(), name="two-factor-setup"),
    path("auth/2fa/confirm/", TwoFactorConfirmView.as_view(), name="two-factor-confirm"),
    path("auth/2fa/disable/", TwoFactorDisableView.as_view(), name="two-factor-disable"),

    # Profile & Users
    path("users/profile/", ProfileDetailView.as_view(), name="user-profile-detail"),
    path("users/search/", UserSearchView.as_view(), name="user-search"),
    path("users/<int:pk>/", UserProfileView.as_view(), name="user-public-profile"),

    # Friends
    path("friends/", FriendListView.as_view(), name="friends-list"),
    path("friends/requests/", FriendRequestsView.as_view(), name="friends-requests"),
    path("friends/request/<int:user_id>/", FriendRequestSendView.as_view(), name="friends-request-send"),
    path("friends/respond/<int:request_id>/", FriendRespondView.as_view(), name="friends-request-respond"),
    path("friends/<int:friend_id>/", FriendDeleteView.as_view(), name="friends-delete"),

    # AI Generation
    path("generate/", validationFoodView.as_view(), name="generate"),
    path("regenerate/", RegenerateImageView.as_view(), name="regenerate"),
    path("generations/", GenerationListView.as_view(), name="generations-list"),
    path("generations/<int:pk>/", GenerationDeleteView.as_view(), name="generation-delete"),
]
