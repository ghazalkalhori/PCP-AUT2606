from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel
from apps.matches.models import Match


class GenerationJob(TimeStampedModel):
    STATUS_PENDING = "pending"
    STATUS_RUNNING = "running"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_RUNNING, "Running"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_FAILED, "Failed"),
    ]

    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="generation_jobs")
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=STATUS_PENDING)
    provider = models.CharField(max_length=60, blank=True)

    def __str__(self):
        return f"Generation job {self.pk or 'new'}"
