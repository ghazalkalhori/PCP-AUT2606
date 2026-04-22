from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", include("apps.common.urls")),
    path("api/auth/", include("apps.users.auth_urls")),
    path("api/users/", include("apps.users.urls")),
    path("api/leagues/", include("apps.leagues.urls")),
    path("api/matches/", include("apps.matches.urls")),
    path("api/reports/", include("apps.reports.urls")),
    path("api/generation-jobs/", include("apps.generation_jobs.urls")),
]
