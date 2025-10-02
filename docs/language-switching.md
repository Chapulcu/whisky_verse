# Language Switching Guide

WhiskyVerse uses [i18next](https://www.i18next.com/) with the React bindings to drive all multilingual behaviour. This document captures the current, production-ready workflows for changing the application language.

## i18n Configuration
- Entry point: `src/lib/i18n.ts`
- Default language fallback: `tr`
- Fallback language: `en`
- Supported languages: `tr`, `en`, `ru`, `bg`
- Detection order: `localStorage` → browser `navigator.language` → `<html lang>` attribute
- Persistence key: `i18nextLng` in `localStorage`

The first matching source in the detection order selects the language at startup. When a language is chosen, i18next stores it under `localStorage.i18nextLng`, so refreshes preserve the preference.

## Default Language Management
- Global configuration resides in `public.app_settings` (see migration `009_create_app_settings.sql`).
- `DefaultLanguageInitializer` (`src/App.tsx`) loads this setting on boot and synchronises `i18n`, `<html lang>`, and `localStorage.app-default-language`.
- If the visitor has never picked a language (`localStorage.i18nextLng` missing), the initializer applies the global default by calling `i18n.changeLanguage(defaultLanguage)`.

### Admin UI
1. Navigate to **Admin → Translations**.
2. Use the **Default Application Language** card to pick the new default.
3. The change is saved via Supabase and takes effect immediately for new sessions. Returning users continue with their personal preference unless they clear it.

## Manual Overrides
### Force a Language for Local Testing
Open the browser devtools console and set the persistence key before reloading.

```js
localStorage.setItem('i18nextLng', 'en');
window.location.reload();
```

### Clear the Stored Preference

```js
localStorage.removeItem('i18nextLng');
window.location.reload();
```

## Translation Files
Translations live under `public/locales/<language>/translation.json`. Keep keys consistent across languages to avoid missing-string fallbacks to English.
