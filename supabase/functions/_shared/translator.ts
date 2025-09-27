// Translator abstraction for Edge Functions
// Providers: Google (REST v2). Fallback to Mock if not configured.

export type AppLanguage = 'tr' | 'en' | 'ru' | 'bg'

export interface Translator {
  translate(text: string, from: AppLanguage, to: AppLanguage): Promise<string>
}

export class MockTranslator implements Translator {
  async translate(text: string, _from: AppLanguage, _to: AppLanguage): Promise<string> {
    // Mock passthrough; replace with actual API call
    return text
  }
}

// Google Translate (v2 REST) provider
// Env: GOOGLE_API_KEY
export class GoogleTranslator implements Translator {
  private apiKey: string
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  async translate(text: string, from: AppLanguage, to: AppLanguage): Promise<string> {
    // Google Translate auto-detects if source not supplied; we still pass source where possible
    const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(this.apiKey)}`
    const body = {
      q: text,
      source: from,
      target: to,
      format: 'text'
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Google Translate error ${res.status}: ${errText}`)
    }
    const json = await res.json() as any
    const translated = json?.data?.translations?.[0]?.translatedText
    if (typeof translated !== 'string') {
      throw new Error('Google Translate: invalid response')
    }
    return translated
  }
}

export function getTranslatorFromEnv(): Translator {
  const provider = (Deno.env.get('TRANSLATE_PROVIDER') || '').toLowerCase()
  if (provider === 'google') {
    const key = Deno.env.get('GOOGLE_API_KEY')
    if (key) return new GoogleTranslator(key)
    console.warn('GOOGLE_API_KEY missing; falling back to MockTranslator')
  }
  // Future: azure, deepl
  return new MockTranslator()
}

export async function translateFields(
  fields: Record<string, string | null | undefined>,
  from: AppLanguage,
  to: AppLanguage,
  translator: Translator
): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {}
  for (const [k, v] of Object.entries(fields)) {
    if (!v) {
      out[k] = v ?? null
    } else {
      out[k] = await translator.translate(v, from, to)
    }
  }
  return out
}
