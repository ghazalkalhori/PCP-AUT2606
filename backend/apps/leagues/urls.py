from rest_framework.routers import DefaultRouter

from .views import LeagueViewSet, TeamViewSet

router = DefaultRouter()
router.register("teams", TeamViewSet, basename="teams")
router.register("", LeagueViewSet, basename="leagues")

urlpatterns = router.urls
