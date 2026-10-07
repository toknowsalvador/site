Status: approved
Version: v1
Based on: brief.md @ 2026-10-07, experiments up to (none)

# Landing copy v1 — Salvador Trip Concierge

## Offer

- **Dream outcome:** land in Salvador with everything arranged, and just enjoy it.
- **Specifics:** whatever the traveler approves from: tours and day trips, transfers, hotel, Airbnb/rental, restaurant reservations, cultural shows.
- **Risk reversal:** free custom quote on WhatsApp within 24 hours; nothing to pay until you approve it; 50% deposit to secure bookings, 50% when you arrive; PayPal.
- **Effort removed:** hours of research, Portuguese, guessing fair prices, juggling a dozen vendors. One team, one payment, one contact.
- **Why us:** the local team behind Salvador's 5-star walking tour — 800+ reviews, 4.7–5.0 across TripAdvisor, Google, GetYourGuide and GuruWalk. English and Spanish.

---

## 1. Hero

- **Headline:** Your Salvador trip, planned and booked by locals
- **Subheadline:** Tell us your dates and what you love. We arrange your tours, transfers, stay, restaurants and shows — so you land in Salvador and just enjoy it.
- **CTA button:** Get my free trip quote
- **Microcopy under CTA:** Free custom quote on WhatsApp within 24h. Pay nothing until you approve it.
- **Proof line:** From the team behind Salvador's 5-star walking tour · 800+ reviews

**Hypothesis:** "Salvador trip" + "planned and booked" mirrors the "salvador trip planner" search and promises more than a plan, while the free-quote microcopy removes the fear of committing to an unknown price.

## 2. Problem

- **Title:** Salvador is incredible. Planning it from abroad isn't.
- Hours of research, and you still don't know which tours are worth your time.
- Drivers, hosts and restaurants mostly speak Portuguese.
- Without local prices, every booking feels like a guess.
- A dozen vendors to book and pay, and one missed transfer can cost you a day.

**Hypothesis:** naming the four pains travelers already feel (time, language, price, logistics) makes the service feel necessary without scaring them about safety.

## 3. How it works

- **Title:** Three steps. Then it's vacation.
1. **Tell us about your trip.** Dates, who's coming, what you love. It takes a minute.
2. **Get your plan and quote on WhatsApp.** Within 24 hours, in English or Spanish. We adjust it until it's right.
3. **Arrive and enjoy.** Everything is booked, and you have one local contact for the whole trip.

**Hypothesis:** a short, concrete process with a time promise lowers perceived effort and makes the form feel like the obvious first step.

## 4. What we handle

- **Title:** Everything you need, arranged by one local team
- **Tours & day trips** — Pelourinho, Afro-Bahian heritage, islands and beaches near Salvador.
- **Transfers** — airport pickup if you want it, and every ride in between.
- **Hotels** — in the right neighborhood for the trip you want.
- **Airbnb & rentals** — places we'd send our own friends to.
- **Restaurants** — tables at the local spots worth the trip.
- **Cultural shows** — Afro-Bahian dance, music and capoeira.
- **Note line:** Traveling with a big group? We plan for any size.

**Hypothesis:** listing the six categories proves breadth ("they really handle everything") and lets each visitor find the item they came for.

## 5. Who we are (PROVISIONAL — team will revisit)

- **Title:** Locals who already know everyone
- Adriano moved to Salvador from São Paulo eight years ago and has spent the last five guiding travelers through the city, in English and Spanish. Together with Facundo and David, he runs the walking tour behind 800+ reviews. Now we plan the rest of your trip the same way.

**Hypothesis:** real names and a real track record turn an unknown service into people the traveler has effectively already met through the reviews.

## 6. Proof

- **Ratings strip:** TripAdvisor 5.0 (153) · Google 5.0 (31) · GetYourGuide 4.96 (55) · GuruWalk 4.74 (577)
- **Caption:** 800+ reviews of our walking tour across four platforms.
- **Quote:** "Adriano is very welcoming, he is very knowledgeable about all the places he took us. He answered all our questions. I would recommend him to anyone coming to Salvador who wants to learn about and understand the history." — Sonya · GuruWalk
- PROOF GAP: 2–3 more original English review quotes (TripAdvisor: Sarah W, Ben W) — add when the team pastes them.

**Hypothesis:** four independent platforms with consistent high ratings beat a single testimonial; being explicit that the reviews are for the walking tour keeps the claim honest.

## 7. Offer & risk reversal

- **Title:** No fixed fees. No surprises.
- Every trip is different, so every quote is made for you.
- Your quote is free, and you pay nothing until you approve it.
- Approve it, pay a 50% deposit by PayPal to secure your bookings, and pay the rest when you arrive.
- One payment covers everything. You never deal with a dozen vendors.
- **CTA button:** Get my free trip quote

**Hypothesis:** without a public price, the strongest close is zero risk until approval plus a familiar, protected payment method.

## 8. FAQ

- **How much does it cost?** It depends on what you want: days, group size, the experiences you choose. You get a free custom quote and see the full price before you pay anything.
- **How do I pay?** By PayPal. A 50% deposit after you approve the quote secures your bookings, and you pay the rest when you arrive in Salvador.
- **Do I pay hotels, guides and drivers separately?** No. You pay us once, and we take care of every partner.
- **How fast will I get my quote?** Within 24 hours on WhatsApp.
- **I don't speak Portuguese. Is that a problem?** Not at all. We speak English and Spanish and handle every booking and conversation in Portuguese for you.
- **Is Salvador safe for visitors?** Like any big city, it's about knowing where to go and when. We plan your days around the places and times we'd choose ourselves, and you have our WhatsApp the whole trip.
- **What if my plans change?** Message us and we'll rework your plan. Partners have their own cancellation rules, and we tell you exactly what applies before you approve anything.

**Hypothesis:** answering price, payment, language and safety head-on removes the reasons visitors leave without submitting.

## 9. Form

- **Section title:** Tell us about your trip
- **Section subtitle:** Two quick steps. Your free quote arrives on WhatsApp within 24 hours.
- **Step 1 legend:** Your trip
  - Arrival / Departure
  - Checkbox: Not sure yet
  - Travelers
  - Interests legend: What should we handle? (Tours & day trips · Transfers · Hotel · Airbnb / rental · Restaurants · Cultural shows)
  - Button: Continue
- **Step 2 legend:** Where should we send your quote?
  - Your name
  - Country code / WhatsApp number — helper: "We'll only use it to send your quote."
  - Budget per person (optional)
  - Buttons: Back · Get my quote on WhatsApp
- **Error messages:** as in `plan/js/lead.mjs` (travelers, dates, name, WhatsApp).

**Hypothesis:** easy trip questions first build momentum; asking for WhatsApp only in step 2, with a privacy promise, keeps completion high.

## 10. WhatsApp prefill

```
Hi! I'm {name}. I'd like a quote for my Salvador trip.
{people}, {dates}.
I'm interested in: {interests}.
Budget: {budget}.
Ref: {lead_id}
```

(Interests and budget lines only when filled.)

**Hypothesis:** the message reads as written by the traveler, gives the team everything needed to start the quote, and the Ref ties the chat to the lead row.

---

## Team confirmations (2026-10-07)

- Airport pickup offered when the traveler wants it.
- Islands and beaches near Salvador (e.g. Boipeba, Praia do Forte) are part of the offer.
- WhatsApp support during the whole trip.
