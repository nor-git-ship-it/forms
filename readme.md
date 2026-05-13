# Marketing Forms Documentation

## Purpose
This document explains the role of `form.html` and the associated JavaScript files in this repository at a high level. It orients contributors to where behavior lives and how to run and edit the form locally.

## Quick start
Run the project locally and open the form page:

```bash
python3 -m http.server 8080
# open http://localhost:8080/form.html
```

## Key files
- `form.html` — The form used to capture leads.
- `js/form.js` — Form-specific logic: validation, submission handling, event wiring, and any client-side capture logic.
- `js/site.js` — Site-wide JavaScript utilities and behaviors used across pages (non-form-specific helpers).
- `css/` — Styling for the form variants; see the CSS files for visual customization.
- `Documentation/` — Deeper guides and references (validation rules, API details, customization notes).

## How it works (overview)
- `form.html` provides the markup and data attributes that drive client-side behavior.
- `js/form.js` attaches event listeners to inputs and the submit button, performs client-side validation, and prepares payloads for submission (or triggers analytics/capture hooks).
- `js/site.js` provides common helpers (DOM utilities, polyfills, or global event handlers) used by `form.js`.
- Styling in `css/` keeps presentational changes separate from behavior, allowing easy layout/theme tweaks.

## Data flow
1. Page loads with URL parameters and referrer context.
2. `js/site.js` captures attribution data (`mtm_*`, UTM values, campaign hints, language, entry/referrer URLs) and stores a normalized record in `localStorage`.
3. Form lifecycle events trigger `js/form.js`.
4. `js/form.js` reads attribution and browser context, then enriches fields (IP, country, language, campaign/UTM, website-derived metadata).
5. The enriched form is submitted with populated values for downstream systems.

## Key behaviors
- Captures and persists attribution data across sessions using `localStorage` with record expiry.
- Populates MTM and URL context fields, including entry/referrer/submission URL values.
- Auto-derives website from business email domains (skips common free-email providers).
- Fetches website metadata and writes structured summary/insight fields.
- Detects IP metadata and attempts to populate IP, country, and language-related fields.
- Uses retry-based binding to handle forms that render fields asynchronously.

## Editing guidance
- Keep behavior in `js/form.js` limited to the form lifecycle (validation, UX, payload creation). Offload shared utilities to `js/site.js`.
- Avoid coupling CSS classes to internal JS implementation details — use data attributes when JS needs to find elements.
- For deeper changes (new validation rules, capture flows, or API integration), consult the files in the `Documentation/` folder first.

## Dependencies and external services
- `https://api4.ipify.org` and `https://api6.ipify.org` for public IP lookup.
- `https://free.freeipapi.com` for IP metadata (for example country/city).
- `https://api.microlink.io` for website metadata enrichment.
- `i18next` for UI translations when available (fallback translations remain in `js/form.js`).
- `d365mktforms` APIs for Dynamics lookup interactions when available.

## Troubleshooting
- Fields are not populating:
	- Verify field names, titles, or IDs still match selectors/schema in `js/form.js`.
	- Confirm the expected lifecycle events fire (for example `d365mkt-afterformload`).
- Attribution values missing:
	- Check URL query params (`mtm_*`, `utm_*`, `crm_campaign`) on entry page.
	- Check browser storage permissions and current `localStorage` values.
- Metadata calls fail:
	- Inspect network requests to `ipify`, `freeipapi`, and `microlink` for CORS, blocking, or timeout errors.
- Lookup fields not filling in Dynamics:
	- Confirm `window.d365mktforms` is available and lookup field logical names are correct.


## JavaScript

This project exposes two primary frontend scripts. The descriptions below summarize the main functions and responsibilities so contributors can find and modify behavior quickly.

- `js/form.js` ([js/form.js](js/form.js#L1)) — form-focused automation and UX helpers:
	- Logging & diagnostics: `logInfo`, `logWarn`, `logError`, `logDebug`, `updateDebugState` — consistent console output and debug state persistence.
	- Selectors & schema: `APP_CONFIG.selectors` and `getFieldFromSchema` — central place to resolve form fields by name, id, or title.
	- MTM population: `populateMTMFields`, `bindSubmissionUrlCapture`, `runPopulateOnce` — read attribution (mtm_*) and fill matching form fields, with retries and submit-time capture.
	- Language & UI translations: `getPreferredBrowserLanguage`, `getLcidForLanguageTag`, `initializeUiTranslations`, `applyUiFieldTranslations`, `setUiLanguage` — detect browser language and apply label translations (with i18next fallback).
	- Field discovery & helpers: `getFieldByLabelText`, `getEmailField`, `getWebsiteFieldInput` — robust lookup across document and same-origin iframes.
	- Email→Website autofill: `extractDomainFromEmail`, `getWebsiteFromDomain`, `syncWebsiteFromEmail`, plus binding helpers to attach listeners.
	- Website metadata autofill: `fetchAndPopulateWebsiteInfo`, `formatWebsiteInfo`, `bindWebsiteMetadataListeners` — fetch page metadata (via Microlink) and write to form fields.
	- IP lookup & metadata: `getClientIP`, `fetchSafe`, `formatIpData`, `startIpScript`, `runOnce` — orchestrates IP detection, metadata fetch, and writes to the IP field and related country/language fields.
	- Misc utilities: `normalizeText`, `queryFirst`, `dispatchChangeEvents`, `setIpFieldWithRetry` — small helpers used throughout.

- `js/site.js` ([js/site.js](js/site.js#L1)) — site-level attribution capture and storage:
	- Capture/record lifecycle: `capture`, `readStoredRecord`, `writeRecord`, `clearStoredRecord` — build and persist a canonical attribution record into `localStorage`.
	- Param utilities: `normalizeParamMap`, `serializeParamMap`, `getFirstParamValue` — helpers for parsing URL search params and serializing UTMs/MTM keys.
	- Query logic: `hasAnyAttribution`, `shouldReset`, `mergeMissingMtmFields`, `mergeMissingMetaFields` — rules for merging or resetting stored attribution data.
	- Public API: `window.SiteAttribution` with `capture`, `get`, and helpers — consumer-facing interface used by `js/form.js` and page templates.

Together these scripts separate concerns: `js/site.js` focuses on capturing and persisting cross-page attribution, while `js/form.js` consumes that data to enrich forms (autofill, UX, metadata, and diagnostics).


---
Generated on 2026-04-08 — concise README for `form.html` and its JS files.
