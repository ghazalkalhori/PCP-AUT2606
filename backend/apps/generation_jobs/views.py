from rest_framework import viewsets

from .models import GenerationJob
from .serializers import GenerationJobSerializer


class GenerationJobViewSet(viewsets.ModelViewSet):
    queryset = GenerationJob.objects.all()
    serializer_class = GenerationJobSerializer
