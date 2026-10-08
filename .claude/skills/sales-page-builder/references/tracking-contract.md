# Tracking contract

Changing anything here requires updating `plan/js/lead.mjs`, `plan/js/app.mjs`, `integrations/apps-script/Code.gs` and their tests together.

## CONFIG (`plan/js/config.mjs`)

| Key | Example | Empty means |
|---|---|---|
| `whatsappNumber` | `5571993719791` | never empty |
| `ga4Id` | `G-ABC123XYZ` | gtag not loaded; events are no-ops |
| `adsId` | `AW-123456789` | Ads tag not configured — **keep empty**: the lead conversion is the GA4 `generate_lead` imported into Google Ads |
| `adsConversion` | `AW-123456789/AbCdEf` | conversion not sent — **keep empty** (setting it would count every lead twice) |
| `leadEndpoint` | Apps Script `/exec` URL | lead not posted; WhatsApp still opens |
| `clarityId` | Microsoft Clarity project ID | Clarity not loaded |

## GA4 events

| Event | When | Params |
|---|---|---|
| `form_start` | first focus inside the form (once per page view) | — |
| `form_step_2` | step 1 validated, step 2 shown | `people` |
| `generate_lead` | step 2 validated, before redirect | `lead_id` |
| `whatsapp_click` | right before redirect | `lead_id` |

Google Ads lead conversion: "TKS Lead" in Google Ads is the GA4 `generate_lead` event (linked property TKS Plan, G-2RZLNYF4ZG). The tag-based `conversion` event in `app.mjs` only fires if `adsConversion` is set — leave it empty.

## Lead payload / sheet columns (in order)

`timestamp, lead_id, name, whatsapp, people, month, duration, interests, utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, landing_url` (`month` = `YYYY-MM` or `not-sure`; `duration` = one of `DURATIONS` in `lead.mjs` or empty) — the sheet adds `status` (default `novo`), `valor`, `data_venda` and `lucro` (filled by the team).

## Enhanced conversions and offline sales

- On submit, before the conversion events: `gtag('set', 'user_data', userDataFor(payload))` — the E.164 WhatsApp number; Google hashes it on the device and only sends it with `ad_user_data` consent. GA4 must have **"User-provided data collection"** turned on (Admin → Data collection) for it to reach Google Ads.
- Sales go back to Google Ads through the "Google Ads import" tab built by `refreshAdsImport()` in `Code.gs`: `gclid` + SHA-256 of the phone, conversion "TKS Sale", noon of `data_venda` (America/Bahia), `valor` in BRL.

## Phone field

`countryCode` holds an ISO country (`US`, `CA`, `GB`… or `other`). `normalizePhone` uses libphonenumber-js once `setPhoneLibrary` received it (real per-country validation, repeated country code fixed, `+`/`00` input wins over the selector) and falls back to `FALLBACK_COUNTRIES` calling codes before it loads. The sheet always receives E.164 (`+14155550100`).

## Audience parameter

`?audience=family` (set by the Family & group trips ad group's Final URL suffix) shows the `[data-audience="family"]` subtitle in the form card. Allowed values live in `AUDIENCES` in `lead.mjs`.

## Lead reference

`lead_id` = `TKS-` + 6 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (`generateLeadId` in `plan/js/lead.mjs`). Same value in the sheet, the WhatsApp prefill (`Ref:`), the confirmation screen, GA4 `lead_id` and the Ads `transaction_id`.

## Invariants

- Redirect to WhatsApp happens exactly once per submit, within 1 s, whatever happens to gtag or the endpoint.
- Consent defaults: `denied` for `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage` in EEA + GB + CH; `granted` elsewhere; banner updates on choice.
