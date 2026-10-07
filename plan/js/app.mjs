// DOM wiring for the landing page: form steps, consent, tracking, lead submit and WhatsApp redirect.
import { CONFIG } from './config.mjs';
import {
  generateLeadId, loadAttribution, validateStep, validateAll, buildLeadPayload, buildWhatsAppText, buildWhatsAppUrl,
  upcomingMonths, userDataFor,
} from './lead.mjs';

const CONSENT_KEY = 'tks_consent';

function safeStorage(kind) {
  try { return window[kind]; } catch { return null; }
}

function track(name, params = {}) {
  try { if (typeof window.gtag === 'function') window.gtag('event', name, params); } catch { /* tracking must never break the page */ }
}

function loadGtag() {
  const tagId = CONFIG.ga4Id || CONFIG.adsId;
  if (!tagId) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${tagId}`;
  document.head.appendChild(s);
  window.gtag('js', new Date());
  if (CONFIG.ga4Id) window.gtag('config', CONFIG.ga4Id);
  if (CONFIG.adsId) window.gtag('config', CONFIG.adsId, { allow_enhanced_conversions: true });
}

function loadClarity() {
  if (!CONFIG.clarityId) return;
  /* Microsoft Clarity loader; runs cookieless until consent is granted (project setting). */
  window.clarity = window.clarity || function clarity(...args) { (window.clarity.q = window.clarity.q || []).push(args); };
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.clarity.ms/tag/${CONFIG.clarityId}`;
  document.head.appendChild(s);
}

function setupConsent() {
  const banner = document.getElementById('consent-banner');
  const local = safeStorage('localStorage');
  let saved = null;
  try { saved = local && local.getItem(CONSENT_KEY); } catch { saved = null; }
  const apply = (choice) => {
    const v = choice === 'accept' ? 'granted' : 'denied';
    try {
      window.gtag('consent', 'update', {
        ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v,
      });
      if (choice === 'accept' && typeof window.clarity === 'function') window.clarity('consent');
    } catch { /* ignore */ }
  };
  if (saved) { apply(saved); return; }
  banner.hidden = false;
  banner.addEventListener('click', (e) => {
    const choice = e.target.closest('[data-consent]')?.dataset.consent;
    if (!choice) return;
    apply(choice);
    try { local && local.setItem(CONSENT_KEY, choice); } catch { /* ignore */ }
    banner.hidden = true;
  });
}

function readForm(form) {
  const fd = new FormData(form);
  return {
    month: fd.get('month') || '',
    duration: fd.get('duration') || '',
    people: fd.get('people') || '',
    interests: fd.getAll('interests'),
    name: fd.get('name') || '',
    countryCode: fd.get('countryCode') || '',
    phone: fd.get('phone') || '',
  };
}

function showErrors(form, errors) {
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  const fields = Object.keys(errors);
  for (const name of fields) {
    const el = form.querySelector(`[name="${name}"]`);
    // Radio groups: mark the whole group so every option shows the error.
    (el?.type === 'radio' ? el.closest('.options') : el)?.setAttribute('aria-invalid', 'true');
  }
  document.getElementById('form-error').textContent = fields.map((f) => errors[f]).join(' ');
  if (fields.length) form.querySelector(`[name="${fields[0]}"]`)?.focus();
}

function sendLead(payload) {
  if (!CONFIG.leadEndpoint) return;
  try {
    const body = new Blob([JSON.stringify(payload)], { type: 'text/plain;charset=UTF-8' });
    const queued = navigator.sendBeacon && navigator.sendBeacon(CONFIG.leadEndpoint, body);
    if (!queued) fetch(CONFIG.leadEndpoint, { method: 'POST', body, mode: 'no-cors', keepalive: true }).catch(() => {});
  } catch { /* the WhatsApp message still carries the lead */ }
}

function setupForm(attribution) {
  const form = document.getElementById('lead-form');
  const step1 = form.querySelector('fieldset[data-step="1"]');
  const step2 = form.querySelector('fieldset[data-step="2"]');
  const submit = form.querySelector('button[type="submit"]');
  let started = false;
  let submitted = false;
  let whatsappUrl = '';

  form.addEventListener('focusin', () => {
    if (!started) { started = true; track('form_start'); }
  });

  const months = form.querySelector('#month-options');
  for (const m of upcomingMonths(new Date())) {
    const label = document.createElement('label');
    label.innerHTML = '<input type="radio" name="month"><span></span>';
    label.querySelector('input').value = m.value;
    label.querySelector('span').textContent = m.label;
    months.appendChild(label);
  }

  const people = form.querySelector('[name="people"]');
  form.querySelectorAll('[data-step-people]').forEach((btn) => btn.addEventListener('click', () => {
    const next = Math.min(99, Math.max(1, (Number(people.value) || 0) + Number(btn.dataset.stepPeople)));
    people.value = String(next);
  }));

  const goToStep2 = () => {
    const data = readForm(form);
    const { valid, errors } = validateStep(1, data);
    showErrors(form, errors);
    if (!valid) return;
    step1.hidden = true;
    step2.hidden = false;
    step2.querySelector('input, select')?.focus();
    track('form_step_2', { people: Number(data.people) });
  };
  form.querySelector('[data-next]').addEventListener('click', goToStep2);

  form.querySelector('[data-back]').addEventListener('click', () => {
    step2.hidden = true;
    step1.hidden = false;
    showErrors(form, {});
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Enter pressed while step 1 is showing: behave like "Continue".
    if (!step1.hidden) { goToStep2(); return; }
    // Already sent (e.g. came back from the wa.me page): reopen WhatsApp, never a second lead.
    if (submitted) { if (whatsappUrl) window.location.href = whatsappUrl; return; }
    const data = readForm(form);
    const { valid, errors } = validateAll(data);
    if (errors.people || errors.month || errors.duration) { step2.hidden = true; step1.hidden = false; }
    showErrors(form, errors);
    if (!valid) return;
    submitted = true;
    submit.disabled = true;

    const leadId = generateLeadId();
    const payload = buildLeadPayload(data, attribution, leadId, new Date(), location.href);
    const url = buildWhatsAppUrl(CONFIG.whatsappNumber, buildWhatsAppText(payload));
    whatsappUrl = url;
    form.hidden = true;
    form.closest('.card').querySelector(':scope > h2').hidden = true;
    const done = document.getElementById('form-done');
    done.querySelector('#done-ref').textContent = leadId;
    done.querySelector('#open-whatsapp').href = url;
    done.hidden = false;
    let navigated = false;
    const go = () => { if (!navigated) { navigated = true; window.location.href = url; } };

    sendLead(payload);
    const userData = userDataFor(payload);
    try { if (userData && typeof window.gtag === 'function') window.gtag('set', 'user_data', userData); } catch { /* never block the redirect */ }
    track('generate_lead', { lead_id: leadId });
    track('whatsapp_click', { lead_id: leadId });
    if (CONFIG.adsConversion) {
      track('conversion', { send_to: CONFIG.adsConversion, transaction_id: leadId, event_callback: go });
    }
    setTimeout(go, 800);
  });

  // Restored from the back/forward cache after the redirect: let the visitor reopen WhatsApp.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && submitted) submit.disabled = false;
  });
}

function setupStickyCta() {
  const cta = document.querySelector('.sticky-cta');
  const hero = document.getElementById('hero');
  const form = document.getElementById('lead-form');
  if (!cta || !hero || !('IntersectionObserver' in window)) return;
  let heroVisible = true;
  let formVisible = false;
  const update = () => { cta.hidden = heroVisible || formVisible; };
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; update(); }).observe(hero);
  new IntersectionObserver(([e]) => { formVisible = e.isIntersecting; update(); }).observe(form);
}

const attribution = loadAttribution(safeStorage('sessionStorage'), location.search);
setupConsent();
loadGtag();
loadClarity();
setupForm(attribution);
setupStickyCta();
