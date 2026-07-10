# SymptoVet — Master Build Prompt (Vet-Facing v2)

> Copy everything below into your AI coding assistant, or use it as your own spec.
> This version reflects the confirmed direction: **a professional tool for veterinarians**, Android-first.

---

## 0. Role & objective

You are a senior full-stack engineer, security architect, and product designer. Build **SymptoVet**, a **veterinary clinical tool**. The primary customer is the **veterinarian / clinic**, not the pet owner. It records patients, tracks visits, and provides **diagnostic decision support**: a vet enters symptoms and the app suggests likely conditions from a curated, vet-reviewed knowledge base.

Build it **production-quality, professional, secure by default, and accessible**. Security and data integrity are first-class requirements. No placeholder auth, no hardcoded secrets, no client-side trust for authorization.

**Framing rule:** the app provides **decision support**, never a definitive diagnosis. Final clinical judgment always rests with the veterinarian. Label results accordingly and cite sources.

---

## 1. Platform & stack (confirmed)

- **Rollout:** Android first → iOS → web.
- **App:** **React Native + Expo (TypeScript)** — one codebase for all three platforms.
- **Navigation:** Expo Router.
- **Backend + DB + Auth + Storage:** **Supabase** (PostgreSQL, Auth with MFA, file storage, row-level security) for speed — or Node/NestJS + managed Postgres if you outgrow it.
- **Push notifications:** Expo Notifications (FCM).
- **Maps / nearest-vet:** **deferred** (not in this build).

---

## 2. Knowledge base & content (IMPORTANT)

- The veterinary book the owner provides is used as **reference only** — to author **original** symptom→condition content. Do **not** copy text verbatim into the app (copyright).
- Structure the clinical knowledge into a schema (see §6). Every condition entry cites its source.
- **All clinical content must be reviewed by a licensed veterinarian before release.**

---

## 3. Core concept & primary user flow

A veterinarian:
1. Adds a **Client (owner)** and one or more **Patients (pets)** under them.
2. Opens a patient's profile and starts a **visit**.
3. Types in a **symptom** → the app shows the **most relevant symptom suggestions** as they type (autocomplete).
4. Adds multiple symptoms as **chips**, can **remove** any, then presses **Enter**.
5. The app returns a **ranked list of likely conditions (differential)**, filtered by the patient's species/breed/age/sex, each with signs, recommended tests, treatment references, and any red-flag notes.
6. The vet can attach **diagnostic imaging** (X-ray, ultrasound, etc.) and enter **lab results (CBC, LFT, RFT)**; abnormal values help **refine/narrow the differential**.
7. The vet selects a **confirmed diagnosis** → the app suggests **treatment**: medication with **route + frequency in vet notation** (PO, SC, IM, IV; SID/BID/TID, q_h, PRN) and a **dose calculated from the patient's weight, species, and breed**, or — where indicated — the **recommended surgery**.
8. The vet reviews/adjusts, records it in a **SOAP note**, and sets the **next visit**.

---

## 4. Feature set

### MVP (Phase 1 — build this first)
- **Auth & staff roles**: secure login; roles = vet, vet tech, receptionist, admin (least-privilege).
- **Clients (owners)**: name, phone, email, address; can hold **multiple patients**.
- **Patients (pets)**: species, breed, sex, DOB/age, **weight**, microchip ID, spay/neuter, allergies, chronic conditions.
- **Photos**: add via **camera or gallery**; support **multiple photos over time** (track healing/skin changes).
- **Symptom search → differential engine** (the core):
  - Type-ahead symptom suggestions; add/remove symptom chips; Enter to run.
  - **Ranked likely-conditions** list, **filtered by species/breed/age/sex**.
  - Per condition: description, typical signs, recommended tests, treatment references, red-flag/emergency note, **source citation**.
  - Record the vet's **confirmed diagnosis**.
- **Treatment & medication engine**: once a diagnosis is chosen, suggest medication with **route + frequency in vet notation** (PO, SC/SQ, IM, IV; SID/BID/TID, q_h, PRN) and a **weight/species/breed-based dose**, or the **recommended surgery** where indicated. **Every dose shows its formula + source and requires vet confirmation** (see §5a safety).
- **Diagnostic imaging**: attach **X-ray, ultrasound, and other machine images** to a visit (camera/gallery/file), stored securely with signed URLs.
- **Lab records**: structured entry for **CBC, LFT, RFT** (with reference ranges + automatic abnormal-value flags) per patient; results **feed back into refining the differential**.
- **SOAP notes** (Subjective, Objective, Assessment, Plan) per visit — the standard clinical format.
- **Appointments**: next visit / next arrival + calendar (day/week); **automated owner reminders** (SMS/email/push) to cut no-shows.
- **Weight-over-time chart** per patient.
- **Vaccination records** with due-date tracking.
- **Global search** across clients & patients.
- **Audit log**: who created/edited which record.
- **Decision-support labeling** on all results.

### Phase 2 (roadmap)
- Vital signs capture; advanced lab **trending over time**; prescription history (record-only).
- Auto-generated discharge/care instructions to share with the owner.
- Recurring appointment schedules (vaccination courses, follow-ups).
- Analytics (patients seen, common conditions, no-show rate).
- Inventory (vaccines/meds) + low-stock alerts; invoicing/billing.
- **Offline mode with sync** (clinic wifi is unreliable).
- Voice-to-text notes; microchip/QR scan to pull up a patient.
- Maps + nearest-vet/referral.

### Out of scope for v1
- Fully **automatic** prescribing without vet confirmation. Definitive diagnosis. (Dosing is **suggested with formula + source and vet-confirmed** — see §5a; the final call is always the vet's.)

---

## 5. Security requirements (primary emphasis)

Defense-in-depth; target zero critical/high OWASP Top 10 findings.

- **Auth:** vetted provider (Supabase Auth/Clerk). Passwords hashed with **Argon2id/bcrypt** — never plaintext. **MFA/2FA** available. OAuth optional. Strong-password + breached-password check. Rate-limit + lockout on auth; generic errors (no user enumeration).
- **Sessions:** short-lived access + rotating refresh tokens; **httpOnly, Secure, SameSite** cookies (web) / secure device storage (mobile). No tokens in localStorage. Idle + absolute timeouts; "log out everywhere."
- **Authorization:** **deny-by-default**, enforced **server-side** on every request. A clinic/user can only access **their** clients/patients (prevent IDOR/BOLA — validate ownership on every object). Postgres **row-level security**.
- **Data protection:** **TLS 1.2+ everywhere** (HSTS). **Encryption at rest** for DB + file storage; encrypt sensitive fields at app layer where feasible. Secrets in a managed vault — **never in code, git, or the client bundle** (ship `.env.example` only).
- **App hardening (OWASP Top 10):** validate & sanitize all input server-side; parameterized queries/ORM (no SQLi); output-encode (no XSS); strict **CSP** + security headers; **CSRF** protection; **rate limiting** per user/IP; guard against SSRF, path traversal, mass assignment, insecure deserialization. No stack traces/secrets in client errors.
- **Dependencies/CI:** SCA (npm audit/Dependabot/Snyk) + SAST + secret scanning in CI; block deploy on failing security gates. Pin & patch.
- **Privacy/compliance:** GDPR/CCPA posture — consent, data export, deletion ("right to be forgotten"), clear privacy policy. Data minimization. DPAs with third parties.
- **Ops:** **audit logging** of security-relevant events (no sensitive data in logs); monitoring/alerting on auth abuse; encrypted **backups** + tested restore; incident-response plan; separate dev/staging/prod with least-privilege IAM.

---

## 5a. Clinical-safety requirements for dosing & treatment (critical)

Weight-based drug dosing is the **highest-risk feature** — a wrong dose can harm an animal. Build it as decision support, engineered for verification:

- **Show the math, not just a number:** display the formula, e.g. `Amoxicillin 10 mg/kg PO BID × 12 kg = 120 mg/dose`, so the vet can check it.
- **Cite the source** (book/formulary) for every dose and treatment recommendation.
- **Range + max-dose caps:** flag values outside the accepted range; never exceed the maximum.
- **Species/breed contraindication flags:** warn on drugs unsafe for a given species (e.g. cat-toxic agents) or known breed sensitivities.
- **Unit discipline:** weight in **kg**, dose in **mg/kg**, explicit units everywhere; guard against lb↔kg and mg↔mg/kg mix-ups.
- **Vet confirms every suggestion** — the app proposes, the veterinarian approves and can override.
- **All dosing/treatment content vet-reviewed and validated before release.**

---

## 6. Data model (starting point)

```
Clinic
  └─ Staff (role: vet | tech | receptionist | admin)

Client (owner)         → belongs to Clinic
  name, phone, email, address
  └─ Patient (pet)     → belongs to Client
        species, breed, sex, dob, weight_history[],
        microchip_id, neutered, allergies[], chronic_conditions[]
        └─ Photo[]              (url, taken_at, note)
        └─ Visit                (date, reason, next_visit_date)
              └─ SymptomEntry[] (symptom_id)
              └─ Differential[] (condition_id, rank, confidence)
              └─ LabPanel[]     (type: CBC|LFT|RFT, values{}, flagged[], taken_at)
              └─ ImagingStudy[] (type: xray|ultrasound|other, url, taken_at, note)
              └─ confirmed_diagnosis (condition_id, by_staff)
              └─ TreatmentPlan  (medication_id, route, frequency, dose_mg,
                                 dose_formula, surgery_ref, source, vet_confirmed)
              └─ SoapNote        (subjective, objective, assessment, plan)
              └─ Vitals          (temp, hr, rr, weight)   [Phase 2]

Symptom            (name, synonyms[], species_applicable[])
Condition          (name, species[], signs[], tests[], treatment_ref,
                    red_flag: bool, source_citation)
Medication         (name, forms[], source_citation,
                    doses[{species, mg_per_kg, route, frequency,
                    max_dose, contraindications[]}])
Symptom↔Condition    mapping (weight/likelihood) → powers the differential
Condition↔Medication mapping (first-line | alternative | surgery_ref)

AuditLog           (actor, action, entity, timestamp)
Consent            (client/staff, version, timestamp)
```

Enforce ownership foreign keys + row-level security so data never leaks across clinics.

---

## 7. UX & design

- **Professional, calm, efficient** — vets are busy. Fast entry, minimal taps, keyboard-friendly, no dead ends.
- Design-system driven (tokens, reusable components), light + dark mode.
- Every screen handles loading / empty / error / success states with clear microcopy.
- Symptom entry must be genuinely fast (instant type-ahead, easy chip add/remove).
- Red-flag/emergency conditions are visually distinct.
- **Accessibility: WCAG 2.2 AA** — contrast, focus states, keyboard nav, screen-reader labels, ≥44px targets, reduced-motion support.

## 8. Quality & testing
- Unit + integration + end-to-end tests; **especially test the symptom→differential engine and red-flag paths**.
- Security tests: authz/IDOR, injection, XSS/CSRF, rate limits, auth flows.
- Accessibility tests (axe) in CI.
- README with setup, `.env.example`, architecture + security notes, seed/demo data.

## 9. Acceptance criteria
- Running Android app (with iOS/web-capable codebase) covering the MVP set.
- Symptom→differential engine works, filtered by patient attributes, with source citations.
- Treatment engine suggests medication (route/frequency in vet notation) with a **weight/species/breed dose that shows its formula + source and requires vet confirmation**, or a surgery recommendation.
- Imaging attachments and CBC/LFT/RFT lab records supported; abnormal labs help refine the differential.
- No hardcoded secrets, no plaintext passwords, server-enforced per-clinic authorization.
- WCAG 2.2 AA on core flows.
- Decision-support labeling + audit log present.
- All clinical content vet-reviewed before release.
```
```

### Suggested build order
1. Auth + staff roles + Clients→Patients records + photos.
2. Symptom knowledge base + symptom→differential engine.
3. Visits + SOAP notes + confirmed diagnosis.
4. Treatment/medication + dosing engine (with safety scaffolding from §5a).
5. Imaging attachments + CBC/LFT/RFT lab records + differential refinement.
6. Appointments + owner reminders + weight/vaccination tracking.
7. Audit log, polish, accessibility, security hardening pass.
