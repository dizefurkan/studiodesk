/**
 * Message templates (client-safe): placeholders, rendering and WhatsApp / SMS links.
 * Placeholders are stored as `{token}` and filled per student when sending.
 */

export const MESSAGE_CATEGORIES = ['payment_reminder', 'event', 'announcement', 'other'] as const
export type MessageCategory = (typeof MESSAGE_CATEGORIES)[number]

export const MESSAGE_CHANNELS = ['whatsapp', 'sms'] as const
export type MessageChannel = (typeof MESSAGE_CHANNELS)[number]

export const MESSAGE_AUDIENCES = ['all', 'course', 'low_credits', 'expiring'] as const
export type MessageAudience = (typeof MESSAGE_AUDIENCES)[number]

export const MESSAGE_TABS = ['send', 'templates', 'history'] as const
export type MessageTab = (typeof MESSAGE_TABS)[number]

/** Placeholders a template can use, in the order they are offered in the editor. */
export const MESSAGE_TOKENS = ['first_name', 'last_name', 'credits', 'package', 'expires', 'studio'] as const
export type MessageToken = (typeof MESSAGE_TOKENS)[number]

export type MessageVars = Partial<Record<MessageToken, string>>

/** Fills `{token}` placeholders; unknown or empty ones become an empty string. */
export function renderTemplate(body: string, vars: MessageVars): string {
  return body
    .replace(/\{(\w+)\}/g, (match, key: string) =>
      (MESSAGE_TOKENS as readonly string[]).includes(key) ? (vars[key as MessageToken] ?? '') : match
    )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

/**
 * International digits for wa.me / sms links. Turkish numbers written locally
 * ("0532 …", "532 …") get the 90 country code; numbers with + or 00 keep theirs.
 * Returns null when the number is too short to be a phone number.
 */
export function normalizePhone(raw: string | null | undefined, countryCode = '90'): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  let digits = trimmed.replace(/\D/g, '')
  if (trimmed.startsWith('+')) {
    // already international
  } else if (digits.startsWith('00')) {
    digits = digits.slice(2)
  } else if (digits.startsWith('0')) {
    digits = countryCode + digits.slice(1)
  } else if (digits.length === 10) {
    digits = countryCode + digits
  }
  return digits.length >= 10 && digits.length <= 15 ? digits : null
}

export function whatsappLink(phoneDigits: string, text: string) {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`
}

export function smsLink(phoneDigits: string, text: string) {
  return `sms:+${phoneDigits}?body=${encodeURIComponent(text)}`
}

export function messageLink(channel: MessageChannel, phoneDigits: string, text: string) {
  return channel === 'whatsapp' ? whatsappLink(phoneDigits, text) : smsLink(phoneDigits, text)
}
