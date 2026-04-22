from django.db import models

from apps.common.models import TimeStampedModel


class League(TimeStampedModel):
    name = models.CharField(max_length=120)
    country = models.CharField(max_length=80, blank=True)
    season = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.name


class Team(TimeStampedModel):
    league = models.ForeignKey(League, on_delete=models.SET_NULL, null=True, blank=True, related_name="teams")
    name = models.CharField(max_length=120)
    short_name = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.name
