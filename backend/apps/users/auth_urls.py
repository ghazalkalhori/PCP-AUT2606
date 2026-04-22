from django.urls import path

from .auth_views import login_placeholder

urlpatterns = [
    path("login/", login_placeholder, name="login-placeholder"),
]
