const MAX_COMMENT_LENGTH = 2000
const MAX_BODY_BYTES = 10_000 // survey payload is tiny; generous but bounded

const INTEREST_SET = new Set<string>(INTEREST_OPTIONS)
const SIZE_SET = new Set<string>(SIZE_OPTIONS)

export default defineEventHandler(async (event) => {
  const contentLength = Number(getRequestHeader(event, 'content-length') || 0)
  if (contentLength > MAX_BODY_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Payload too large' })
  }

  // Checked before anything else, including the honeypot — otherwise a bot that
  // always fills the honeypot field would face no cap at all.
  if (isSurveyRateLimited(event)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many submissions — try again later.' })
  }

  const body = await readBody<{
    interest?: unknown
    sizes?: unknown
    comment?: unknown
    honeypot?: unknown
  }>(event)

  // Bots that fill in the hidden field get a fake success — no error to learn from,
  // nothing written, but still rate-limited above so this path can't be used for
  // unbounded spam.
  if (typeof body?.honeypot === 'string' && body.honeypot.trim() !== '') {
    recordSurveyHit(event)
    return { ok: true }
  }

  const interest = typeof body?.interest === 'string' && INTEREST_SET.has(body.interest) ? body.interest : null

  const sizes = Array.isArray(body?.sizes)
    ? body.sizes.filter((s): s is string => typeof s === 'string' && SIZE_SET.has(s))
    : []

  // Array.from + slice truncates by Unicode code point, not UTF-16 code unit, so a
  // surrogate-pair character (emoji, some CJK) sitting exactly at the boundary
  // doesn't get split into an unpaired surrogate.
  const comment =
    typeof body?.comment === 'string'
      ? Array.from(body.comment.trim()).slice(0, MAX_COMMENT_LENGTH).join('')
      : ''

  if (!interest && sizes.length === 0 && !comment) {
    recordSurveyHit(event)
    throw createError({ statusCode: 400, statusMessage: 'Pick at least one answer, or leave a comment.' })
  }

  try {
    insertSurveyResponse({
      interest,
      sizes,
      comment,
      userAgent: getRequestHeader(event, 'user-agent') || null,
    })
  } catch (e) {
    // Don't charge the visitor's rate-limit slot for a failure that isn't their
    // fault (e.g. a transient DB lock) — recordSurveyHit is deliberately skipped here.
    throw createError({ statusCode: 500, statusMessage: 'Could not save your response — please try again.' })
  }

  recordSurveyHit(event)
  return { ok: true }
})
