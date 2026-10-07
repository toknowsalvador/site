# Tracking contract

Changing anything here requires updating `plan/js/lead.mjs`, `plan/js/app.mjs`, `integrations/apps-script/Code.gs` and their tests together.

## CONFIG (`plan/js/config.mjs`)

| Key | Example | Empty means |
|---|---|---|
| `whatsappNumber` | `5571993719791` | never empty |
| `ga4Id` | `G-ABC123XYZ` | gtag not loaded; events are no-ops |
| `adsId` | `AW-123456789` | Ads tag not configured |
| `adsConversion` | `AW-123456789/AbCdEf` | conversion not sent |
| `leadEndpoint` | Apps Script `/exec` URL | lead not posted; WhatsApp still opens |
| `clarityId` | Microsoft Clarity project ID | Clarity not loaded |

## GA4 events

| Event | When | Params |
|---|---|---|
| `form_start` | first focus inside the form (once per page view) | — |
| `form_step_2` | step 1 validated, step 2 shown | `people` |
| `generate_lead` | step 2 validated, before redirect | `lead_id` |
| `whatsapp_click` | right before redirect | `lead_id` |

Google Ads conversion: `gtag('event', 'conversion', { send_to: CONFIG.adsConversion, transaction_id: lead_id, event_callback })`.

## Lead payload / sheet columns (in order)

`timestamp, lead_id, name, whatsapp, people, month, duration, interests, utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, landing_url` (`month` = `YYYY-MM` or `not-sure`; `duration` = one of `DURATIONS` in `lead.mjs` or empty) — the sheet adds `status` (default `novo`), `valor` and `data_venda` (filled by the team).

## Enhanced conversions and offline sales

- On submit, before the conversion events: `gtag('set', 'user_data', userDataFor(payload))` — the E.164 WhatsApp number; Google hashes it on the device and only sends it with `ad_user_data` consent. The Ads tag is configured with `allow_enhanced_conversions: true`.
- Sales go back to Google Ads through the "Google Ads import" tab built by `refreshAdsImport()` in `Code.gs`: `gclid` + SHA-256 of the phone, conversion "TKS Sale", noon of `data_venda` (America/Bahia), `valor` in BRL.

## Lead reference

`lead_id` = `TKS-` + 6 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (`generateLeadId` in `plan/js/lead.mjs`). Same value in the sheet, the WhatsApp prefill (`Ref:`), the confirmation screen, GA4 `lead_id` and the Ads `transaction_id`.

## Invariants

- Redirect to WhatsApp happens exactly once per submit, within 1 s, whatever happens to gtag or the endpoint.
- Consent defaults: `denied` for `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage` in EEA + GB + CH; `granted` elsewhere; banner updates on choice.
