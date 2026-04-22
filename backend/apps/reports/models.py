from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel
from apps.matches.models import Match


class Report(TimeStampedModel):
    STATUS_DRAFT = "draft"
    STATUS_PUBLISHED = "published"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_PUBLISHED, "Published"),
    ]

    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="reports")
    title = models.CharField(max_length=180)
    body = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.title
