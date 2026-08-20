// Single source of truth for the feedback survey's option pills — imported by both
// the client form (app/components/sections/FeedbackSurvey.vue) and the server's
// validation (server/api/survey.post.ts). If these ever drift into two separately
// maintained copies, a mismatched option is silently dropped by the server's
// whitelist check while the client still reports success.
export const INTEREST_OPTIONS = ['Yes, definitely', 'Maybe, depends on price', 'Just curious', 'Not really'] as const

export const SIZE_OPTIONS = [
  'R1 (500mm / 10U)',
  'R.5 (250mm / 5U)',
  'Something bigger',
  'Something smaller',
] as const

export type InterestOption = (typeof INTEREST_OPTIONS)[number]
export type SizeOption = (typeof SIZE_OPTIONS)[number]
