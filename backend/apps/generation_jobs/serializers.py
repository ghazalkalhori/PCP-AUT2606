from rest_framework import serializers

from .models import GenerationJob


class GenerationJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = GenerationJob
        fields = ["id", "match", "requested_by", "status", "provider"]
