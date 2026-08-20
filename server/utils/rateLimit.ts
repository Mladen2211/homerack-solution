import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'

const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_REQUESTS = 5

const hits = new Map<string, number[]>()

// Cheap cleanup so the map doesn't grow unbounded on a long-running process —
// this endpoint gets very little traffic, so a periodic sweep is enough.
setInterval(
  () => {
    const cutoff = Date.now() - WINDOW_MS
    for (const [key, timestamps] of hits) {
      const kept = timestamps.filter((t) => t > cutoff)
      if (kept.length === 0) hits.delete(key)
      else hits.set(key, kept)
    }
  },
  10 * 60 * 1000,
).unref()

// h3's getRequestIP({xForwardedFor:true}) takes the LEFTMOST X-Forwarded-For entry,
// which is whatever the client itself sent — trivially spoofable behind a proxy that
// appends (nginx's default `$proxy_add_x_forwarded_for`, which turns a client-supplied
// header into "<attacker-value>, <real-ip>"). Take the RIGHTMOST entry instead (the one
// our own trusted reverse proxy appended), preferring Cloudflare's own header when
// present since it can't be spoofed past the tunnel.
function resolveClientIp(event: H3Event): string {
  const cfIp = getRequestHeader(event, 'cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  const xff = getRequestHeader(event, 'x-forwarded-for')
  if (xff) {
    const parts = xff
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.length) return parts[parts.length - 1]!
  }

  return getRequestIP(event) || 'unknown'
}

function rateLimitKey(event: H3Event): string {
  const config = useRuntimeConfig()
  const ip = resolveClientIp(event)
  return createHash('sha256').update(config.surveyIpSalt + ip).digest('hex')
}

/** Peek only — does not consume a slot. Call recordSurveyHit() separately once the
 * request is actually going to be processed, so a failure that isn't the visitor's
 * fault (a DB error) doesn't burn their rate-limit budget. */
export function isSurveyRateLimited(event: H3Event): boolean {
  const key = rateLimitKey(event)
  const cutoff = Date.now() - WINDOW_MS
  const timestamps = (hits.get(key) || []).filter((t) => t > cutoff)
  hits.set(key, timestamps)
  return timestamps.length >= MAX_REQUESTS
}

export function recordSurveyHit(event: H3Event): void {
  const key = rateLimitKey(event)
  const cutoff = Date.now() - WINDOW_MS
  const timestamps = (hits.get(key) || []).filter((t) => t > cutoff)
  timestamps.push(Date.now())
  hits.set(key, timestamps)
}
