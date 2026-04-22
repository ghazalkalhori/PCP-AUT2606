from rest_framework.routers import DefaultRouter

from .views import MatchStatsViewSet, MatchViewSet

router = DefaultRouter()
router.register("stats", MatchStatsViewSet, basename="match-stats")
router.register("", MatchViewSet, basename="matches")

urlpatterns = router.urls
