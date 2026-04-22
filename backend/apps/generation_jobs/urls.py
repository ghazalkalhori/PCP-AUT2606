from rest_framework.routers import DefaultRouter

from .views import GenerationJobViewSet

router = DefaultRouter()
router.register("", GenerationJobViewSet, basename="generation-jobs")

urlpatterns = router.urls
