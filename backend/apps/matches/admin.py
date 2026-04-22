from django.contrib import admin

from .models import Match, MatchStats


admin.site.register(Match)
admin.site.register(MatchStats)
