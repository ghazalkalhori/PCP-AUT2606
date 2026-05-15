export const POST_MATCH_SAMPLE = `{
  "matchId": "MATCH-001",
  "reportType": "post_match",
  "competition": "Example Premier League",
  "round": "Round 6",
  "venue": "Sydney Football Centre",
  "date": "2026-05-18",
  "homeTeam": {
    "name": "Sydney FC",
    "ladderPosition": 2,
    "recentForm": ["W", "W", "L", "W", "D"]
  },
  "awayTeam": {
    "name": "Western United",
    "ladderPosition": 7,
    "recentForm": ["L", "W", "L", "D", "L"]
  },
  "score": {
    "home": 2,
    "away": 1
  },
  "goals": [
    {
      "team": "Sydney FC",
      "player": "Alex Smith",
      "minute": 22,
      "type": "open play"
    },
    {
      "team": "Sydney FC",
      "player": "Ben Lee",
      "minute": 75,
      "type": "header"
    },
    {
      "team": "Western United",
      "player": "Tom Brown",
      "minute": 88,
      "type": "penalty"
    }
  ],
  "cards": [
    {
      "team": "Western United",
      "player": "John Davis",
      "card": "yellow",
      "minute": 60,
      "reason": "late tackle"
    }
  ],
  "substitutions": [
    {
      "team": "Sydney FC",
      "playerOut": "Michael Tran",
      "playerIn": "Daniel Ho",
      "minute": 68
    },
    {
      "team": "Western United",
      "playerOut": "Ryan Wilson",
      "playerIn": "Chris Evans",
      "minute": 72
    }
  ],
  "keyStats": {
    "possession": {
      "Sydney FC": "56%",
      "Western United": "44%"
    },
    "shots": {
      "Sydney FC": 14,
      "Western United": 9
    },
    "shotsOnTarget": {
      "Sydney FC": 6,
      "Western United": 4
    },
    "corners": {
      "Sydney FC": 7,
      "Western United": 3
    }
  },
  "notes": [
    "Sydney FC moved closer to the top of the ladder.",
    "Western United scored late but could not complete the comeback.",
    "Ben Lee was named player of the match."
  ]
}`;

export const PRE_MATCH_SAMPLE = `{
  "matchId": "MATCH-002",
  "reportType": "pre_match",
  "competition": "Example Premier League",
  "round": "Round 7",
  "venue": "Parramatta Stadium",
  "date": "2026-05-25",
  "homeTeam": {
    "name": "Parramatta Eagles",
    "ladderPosition": 4,
    "recentForm": ["W", "D", "W", "L", "W"],
    "availablePlayers": [
      "Adam Nguyen",
      "Lucas Martin",
      "James Clarke",
      "Ethan Brooks"
    ],
    "returningPlayers": [
      {
        "player": "Adam Nguyen",
        "reason": "returning from suspension"
      }
    ],
    "suspensions": [
      {
        "player": "Mark Ellis",
        "reason": "red card suspension"
      }
    ]
  },
  "awayTeam": {
    "name": "North Shore Rangers",
    "ladderPosition": 1,
    "recentForm": ["W", "W", "W", "D", "W"],
    "availablePlayers": [
      "Oliver Harris",
      "Noah King",
      "Liam Turner",
      "Samuel Wright"
    ],
    "returningPlayers": [],
    "suspensions": [
      {
        "player": "Daniel Cooper",
        "reason": "yellow card accumulation"
      }
    ]
  },
  "previousMeeting": {
    "result": "North Shore Rangers defeated Parramatta Eagles 3-2",
    "date": "2026-04-12"
  },
  "ladderContext": {
    "Parramatta Eagles": "A win could move them into the top three.",
    "North Shore Rangers": "Currently leading the competition and trying to stay unbeaten."
  },
  "matchFocus": [
    "Parramatta Eagles need to control midfield pressure.",
    "North Shore Rangers have the strongest attack in the competition.",
    "Adam Nguyen's return could strengthen the home side."
  ]
}`;

export const ROUND_SUMMARY_SAMPLE = `{
  "reportType": "round_summary",
  "competition": "Example Premier League",
  "round": "Round 6",
  "matches": [
    {
      "matchId": "MATCH-001",
      "homeTeam": "Sydney FC",
      "awayTeam": "Western United",
      "score": {
        "home": 2,
        "away": 1
      },
      "goalScorers": [
        "Alex Smith",
        "Ben Lee",
        "Tom Brown"
      ],
      "keyMoment": "Ben Lee scored the winning goal in the 75th minute."
    },
    {
      "matchId": "MATCH-003",
      "homeTeam": "Parramatta Eagles",
      "awayTeam": "South Coast United",
      "score": {
        "home": 0,
        "away": 0
      },
      "goalScorers": [],
      "keyMoment": "Both teams created chances but neither side found a breakthrough."
    },
    {
      "matchId": "MATCH-004",
      "homeTeam": "North Shore Rangers",
      "awayTeam": "Canterbury City",
      "score": {
        "home": 4,
        "away": 2
      },
      "goalScorers": [
        "Oliver Harris",
        "Noah King",
        "Noah King",
        "Liam Turner",
        "Marcus Young",
        "Peter Adams"
      ],
      "keyMoment": "Noah King scored twice to help North Shore Rangers stay top of the ladder."
    }
  ],
  "ladderAfterRound": [
    {
      "position": 1,
      "team": "North Shore Rangers",
      "points": 18
    },
    {
      "position": 2,
      "team": "Sydney FC",
      "points": 15
    },
    {
      "position": 3,
      "team": "Parramatta Eagles",
      "points": 12
    },
    {
      "position": 4,
      "team": "Western United",
      "points": 9
    }
  ],
  "roundHighlights": [
    "North Shore Rangers remained top after a high-scoring win.",
    "Sydney FC kept pressure on first place with a narrow victory.",
    "Parramatta Eagles and South Coast United played out a goalless draw."
  ],
  "biggestMover": {
    "team": "Sydney FC",
    "movement": "Moved from 3rd to 2nd"
  }
}`;

export const SAMPLE_OPTIONS = [
  { id: '', label: '— Choose a sample —' },
  { id: 'post_match', label: 'Post-match sample', json: POST_MATCH_SAMPLE },
  { id: 'pre_match', label: 'Pre-match sample', json: PRE_MATCH_SAMPLE },
  {
    id: 'round_summary',
    label: 'Round summary sample',
    json: ROUND_SUMMARY_SAMPLE,
  },
];
