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

## GA4 events

| Event | When | Params |
|---|---|---|
| `form_start` | first focus inside the form (once per page view) | — |
| `form_step_2` | step 1 validated, step 2 shown | `people` |
| `generate_lead` | step 2 validated, before redirect | `lead_id` |
| `whatsapp_click` | right before redirect | `lead_id` |

Google Ads conversion: `gtag('event', 'conversion', { send_to: CONFIG.adsConversion, transaction_id: lead_id, event_callback })`.

## Lead payload / sheet columns (in order)

`timestamp, lead_id, name, whatsapp, people, arrival, departure, dates_unknown, interests, budget, utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, landing_url` — the sheet adds `status` (default `novo`) and `valor`.

## Invariants

- Redirect to WhatsApp happens exactly once per submit, within 1 s, whatever happens to gtag or the endpoint.
- Consent defaults: `denied` for `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage` in EEA + GB + CH; `granted` elsewhere; banner updates on choice.
