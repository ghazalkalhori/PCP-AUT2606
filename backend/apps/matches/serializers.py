from rest_framework import serializers

from .models import Match, MatchStats


class MatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = ["id", "league", "home_team", "away_team", "kickoff_at", "status"]


class MatchStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchStats
        fields = ["id", "match", "home_score", "away_score", "possession_summary"]
