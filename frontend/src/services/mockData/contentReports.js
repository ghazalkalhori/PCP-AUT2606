/**
 * Mock content reports for the upcoming Content Library / Report Detail pages.
 *
 * Field shape is intentionally backend-ready: when the real `/reports` endpoint
 * exists, the service can return data in this same shape without page changes.
 */
export const mockContentReports = [
  {
    id: 'CONT-001',
    reportId: 'RPT-001',
    fixtureId: 'FIX-001',
    jobId: 'JOB-001',
    title: 'Hills United edge Sydney Olympic in tense Round 8 clash',
    reportType: 'Post-match',
    status: 'Generated',
    tone: 'Professional',
    language: 'English',
    wordCount: 650,
    competition: 'NPL NSW Men',
    aiModel: 'Llama 3',
    createdAt: '2026-05-12T10:30:00Z',
    updatedAt: '2026-05-12T10:30:00Z',
    content:
      'Hills United held off a determined Sydney Olympic side to claim a 2-1 win at Lily Homes Stadium on Saturday afternoon, extending their unbeaten run to five matches.\n\n' +
      'The hosts struck first through Marco Rossi in the 18th minute, capitalising on a defensive miscue at the back. Olympic responded just before the break when Jamal Ahmed found space at the far post to head home the equaliser.\n\n' +
      "The second half was a tactical chess match, with both managers reshuffling their midfields. Hills United's substitute Ben Carter proved decisive, slotting home from close range in the 76th minute after a flowing team move.\n\n" +
      'With this result, Hills United climb to third on the NPL NSW Men ladder while Sydney Olympic remain in mid-table.',
  },
  {
    id: 'CONT-002',
    reportId: 'RPT-002',
    fixtureId: 'FIX-002',
    jobId: 'JOB-002',
    title: 'Marconi Stallions look to bounce back against in-form Wollongong Wolves',
    reportType: 'Pre-match',
    status: 'Approved',
    tone: 'Analytical',
    language: 'English',
    wordCount: 480,
    competition: 'NPL NSW Men',
    aiModel: 'Llama 3',
    createdAt: '2026-05-10T14:05:00Z',
    updatedAt: '2026-05-11T09:20:00Z',
    content:
      'Marconi Stallions head into Sunday\'s clash with Wollongong Wolves under pressure to arrest a three-match winless run.\n\n' +
      "Coach Daniel Mendez is expected to recall striker Luca Petrov to the starting XI after the forward's impressive cameo last weekend. Defensively, however, the Stallions remain a concern — they have conceded the joint-most goals in the competition over the last month.\n\n" +
      "Wollongong arrive at Marconi Stadium full of confidence after back-to-back wins. Their high-press system has caused problems for every opponent this season, and Marconi's build-up play will be tested.",
  },
  {
    id: 'CONT-003',
    reportId: 'RPT-003',
    fixtureId: null,
    jobId: 'JOB-004',
    title: 'NPL NSW Men — Round 7 Summary: Title race tightens at the top',
    reportType: 'Round Summary',
    status: 'Published',
    tone: 'Professional',
    language: 'English',
    wordCount: 820,
    competition: 'NPL NSW Men',
    aiModel: 'Llama 3',
    createdAt: '2026-05-06T18:00:00Z',
    updatedAt: '2026-05-07T08:15:00Z',
    content:
      'Round 7 of the NPL NSW Men competition delivered another set of dramatic results, with three of the top five sides dropping points.\n\n' +
      "League leaders Sutherland Sharks were held to a 1-1 draw by APIA Leichhardt, while second-placed Manly United suffered a surprise 2-0 defeat away at Rockdale Ilinden. The result means the gap at the top has been reduced to just two points heading into Round 8.\n\n" +
      "Elsewhere, Blacktown City continued their resurgence under new coach Aleks Vasilevski, dispatching Mt Druitt Town Rangers 3-0 at Lily Homes Stadium.",
  },
  {
    id: 'CONT-004',
    reportId: 'RPT-004',
    fixtureId: 'FIX-005',
    jobId: 'JOB-005',
    title: 'Blacktown City humbled at home as Penrith FC claim shock win',
    reportType: 'Post-match',
    status: 'Draft',
    tone: 'Dramatic',
    language: 'English',
    wordCount: 540,
    competition: 'NPL NSW Men',
    aiModel: 'Llama 3',
    createdAt: '2026-05-08T20:45:00Z',
    updatedAt: '2026-05-09T07:10:00Z',
    content:
      'It was a night to forget for Blacktown City as Penrith FC pulled off a stunning 3-1 victory at Lily Homes Stadium on Saturday evening.\n\n' +
      "The visitors started brightly and were rewarded in the 12th minute when winger Sione Tupou rifled home from the edge of the box. Blacktown levelled through a Marko Jovanovic penalty just before half-time, but the second half belonged to Penrith.\n\n" +
      "Two quick-fire goals in the space of seven minutes from Tom Williams and Ethan Park left the home side shell-shocked, and Penrith comfortably saw out the closing stages.",
  },
  {
    id: 'CONT-005',
    reportId: 'RPT-005',
    fixtureId: 'FIX-006',
    jobId: 'JOB-006',
    title: 'Sydney Olympic vs APIA Leichhardt — Saturday\'s heavyweight derby preview',
    reportType: 'Pre-match',
    status: 'Generated',
    tone: 'Casual',
    language: 'English',
    wordCount: 410,
    competition: 'NPL NSW Men',
    aiModel: 'Llama 3',
    createdAt: '2026-05-13T09:00:00Z',
    updatedAt: '2026-05-13T09:00:00Z',
    content:
      "Two of Sydney's most storied clubs go head-to-head on Saturday evening when Sydney Olympic host APIA Leichhardt at Belmore Sports Ground.\n\n" +
      "Both teams sit within four points of the top six, and a win for either would significantly boost their finals push. Olympic's home record has been excellent this season, with just one defeat at Belmore in 2026.\n\n" +
      "APIA, meanwhile, travel with momentum after consecutive away wins. Expect a fierce, physical contest with both midfields likely to set the tone.",
  },
];
