from django.db import models

from apps.common.models import TimeStampedModel
from apps.leagues.models import League, Team


class Match(TimeStampedModel):
    STATUS_SCHEDULED = "scheduled"
    STATUS_FINISHED = "finished"

    STATUS_CHOICES = [
        (STATUS_SCHEDULED, "Scheduled"),
        (STATUS_FINISHED, "Finished"),
    ]

    league = models.ForeignKey(League, on_delete=models.SET_NULL, null=True, blank=True, related_name="matches")
    home_team = models.ForeignKey(Team, on_delete=models.PROTECT, related_name="home_matches")
    away_team = models.ForeignKey(Team, on_delete=models.PROTECT, related_name="away_matches")
    kickoff_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=STATUS_SCHEDULED)

    def __str__(self):
        return f"{self.home_team} vs {self.away_team}"


class MatchStats(TimeStampedModel):
    match = models.OneToOneField(Match, on_delete=models.CASCADE, related_name="stats")
    home_score = models.PositiveSmallIntegerField(default=0)
    away_score = models.PositiveSmallIntegerField(default=0)
    possession_summary = models.CharField(max_length=120, blank=True)

    def __str__(self):
        return f"Stats for {self.match}"
