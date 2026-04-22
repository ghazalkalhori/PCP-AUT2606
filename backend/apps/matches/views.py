from rest_framework import viewsets

from .models import Match, MatchStats
from .serializers import MatchSerializer, MatchStatsSerializer


class MatchViewSet(viewsets.ModelViewSet):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer


class MatchStatsViewSet(viewsets.ModelViewSet):
    queryset = MatchStats.objects.all()
    serializer_class = MatchStatsSerializer
