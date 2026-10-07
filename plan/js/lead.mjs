// Pure lead logic for the campaign landing page. No DOM access — unit-tested in tests/lead.test.mjs.

export const ATTRIBUTION_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'];
const STORAGE_KEY = 'tks_attr';
const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DURATIONS = ['2–4 days', '5–7 days', '1–2 weeks', '2+ weeks'];

export function upcomingMonths(now = new Date(), count = 12) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    out.push({ value: `${d.getFullYear()}-${month}`, label: `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}` });
  }
  return out;
}

export function monthLabel(value) {
  if (!YEAR_MONTH.test(value || '')) return 'dates not decided yet';
  const [year, month] = value.split('-');
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

export function generateLeadId(rand = Math.random) {
  const n = Math.min(0xffff, Math.floor(rand() * 0x10000));
  return `TKS-${n.toString(16).toUpperCase().padStart(4, '0')}`;
}

export function readAttribution(search) {
  const params = new URLSearchParams(search);
  const out = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = params.get(key);
    if (value && value.trim()) out[key] = value.trim().slice(0, 200);
  }
  return out;
}

export function loadAttribution(storage, search) {
  let stored = {};
  try {
    const raw = storage && storage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw) || {};
  } catch { stored = {}; }
  const merged = { ...stored, ...readAttribution(search) };
  try { storage && storage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch { /* storage unavailable */ }
  return merged;
}

export function normalizePhone(countryCode, phone) {
  const raw = String(phone || '').trim();
  const international = raw.startsWith('+') || raw.startsWith('00');
  let digits;
  if (international) {
    // Typed with its own country code: the selector must not be prepended again.
    digits = raw.replace(/\D/g, '').replace(/^00/, '');
  } else if (countryCode === 'other') {
    return null;
  } else {
    digits = String(countryCode).replace(/\D/g, '') + raw.replace(/\D/g, '').replace(/^0+/, '');
  }
  return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
}

export function validateStep(step, data) {
  const errors = {};
  if (step === 1) {
    const people = String(data.people || '').trim();
    if (!/^\d+$/.test(people) || Number(people) < 1 || Number(people) > 99) {
      errors.people = 'Please enter how many travelers (1–99).';
    }
    if (data.month !== 'not-sure' && !YEAR_MONTH.test(data.month || '')) {
      errors.month = "Pick when you're coming, or Not sure.";
    }
    if (data.duration && !DURATIONS.includes(data.duration)) {
      errors.duration = 'Pick how long your trip is.';
    }
  }
  if (step === 2) {
    const name = String(data.name || '').trim();
    if (name.length < 2 || name.length > 80) errors.name = 'Please enter your name.';
    if (!normalizePhone(data.countryCode, data.phone)) {
      errors.phone = 'Please enter a valid WhatsApp number with country code.';
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateAll(data) {
  const one = validateStep(1, data);
  const two = validateStep(2, data);
  const errors = { ...one.errors, ...two.errors };
  return { valid: Object.keys(errors).length === 0, errors };
}

export function buildLeadPayload(data, attribution, leadId, now, landingUrl) {
  return {
    timestamp: now.toISOString(),
    lead_id: leadId,
    name: String(data.name || '').trim(),
    whatsapp: normalizePhone(data.countryCode, data.phone) || '',
    people: Number(data.people),
    month: data.month || '',
    duration: data.duration || '',
    interests: (data.interests || []).join(', '),
    utm_source: attribution.utm_source || '',
    utm_medium: attribution.utm_medium || '',
    utm_campaign: attribution.utm_campaign || '',
    utm_term: attribution.utm_term || '',
    utm_content: attribution.utm_content || '',
    gclid: attribution.gclid || '',
    landing_url: landingUrl,
  };
}

export function buildWhatsAppText(p) {
  const who = `${p.people} ${p.people === 1 ? 'person' : 'people'}`;
  const trip = [who, monthLabel(p.month), p.duration].filter(Boolean).join(', ');
  const lines = [`Hi! I'm ${p.name}. I'd like a quote for my Salvador trip.`, `${trip}.`];
  if (p.interests) lines.push(`I'm interested in: ${p.interests}.`);
  lines.push(`Ref: ${p.lead_id}`);
  return lines.join('\n');
}

export function buildWhatsAppUrl(number, text) {
  // A lone surrogate (e.g. an emoji cut in half by maxlength) makes encodeURIComponent throw.
  const safe = String(text).replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
  return `https://wa.me/${number}?text=${encodeURIComponent(safe)}`;
}
