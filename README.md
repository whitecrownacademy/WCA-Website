# White Crown Academy — homepage milestone

New Next.js / TypeScript / Tailwind / Framer Motion app. Previous website-v1 is preserved.

Run: npm install, then npm run dev. Local preview: http://localhost:4174.
Validation: npm run build; npm run check.

Architecture
- app/page.tsx: homepage composition in the requested section order.
- app/globals.css: shared logo-derived tokens and responsive design system.
- components/site-layout.tsx: shared navigation, contact controls, footer.
- components/home-sections.tsx: individually exported homepage sections.
- components/gallery.tsx: filters and native accessible dialog lightbox.
- components/enquiry-form.tsx: validation and loading/success/error states.
- components/reveal.tsx: restrained animation, respects reduced motion.
- data/content.ts: programmes, navigation, FAQ, missing business settings, future page list.
- data/assets.ts: central replaceable images and gallery entries.

Confirmed: school name and exactly Day Care, Junior KG, Senior KG, After School.
Missing: phone, WhatsApp, address, map, enquiry endpoint, programme details, curriculum, facility verification, founder copy, testimonials. No invented values.
Phone, WhatsApp and map activate when configured in data/content.ts. Enquiry delivery remains disconnected; current form prepares a local note and does not persist information. A real endpoint must include appropriate privacy and consent wording before connection.
Homepage links target existing sections. No other pages implemented pending user review.

Palette from logo: charcoal #282d39, blue #147fa9, orange #ed9151; supporting ivory #fbf8f2.
Reference: Little Millennium information hierarchy only; original design and writing.

Generated image prompts (built-in image_gen)
1. Photorealistic editorial photograph, Indian children and female educator discovering wooden blocks at low oak table, believable modest preschool, cream walls pale blue shelving orange accents, natural daylight, no uniforms/text/logos, fictional illustrative scene.
2. Photorealistic editorial photograph, Indian children and female educator painting paper art at oak table, cream walls pale blue shelves terracotta details, candid activity, natural daylight, no uniforms/text/logos, fictional illustrative scene.
Images stored as optimized WebP under public/images. They are labeled illustrative in the interface and do not represent actual students or facilities.

Homepage milestone validation
- Production Next.js build passed, homepage statically rendered.
- TypeScript strict check passed.
- Browser inspected at 390px mobile, 711px tablet, 1440px desktop; no horizontal overflow at checked widths.
- All internal hash links resolve to existing elements.
- Mobile navigation opens; programme link navigates and closes menu.
- Gallery Creativity filter leaves one item; lightbox opens and closes.
- FAQ expands and displays answer.
- Empty form blocked for name, phone, programme and consent.
- Valid dummy values prepare a note with explicit not-sent status.
- Whitespace-only name triggers accessible error message.
- Contact delivery, phone/WhatsApp numbers, and map cannot be end-to-end tested until business configuration is provided.
- Remaining pages intentionally deferred for homepage review.

## Current sample scope
Homepage prototype with four confirmed programme names, generated illustrative imagery, section-wise parallax, and an animated SVG logo loader. The loader also incorporates the supplied hand-drawn hero animation; its Rough.js runtime is vendored in public/loader.

This sample is not admissions-ready. Phone, WhatsApp, address, map and enquiry delivery remain unconfigured. The form prepares a local note; no enquiry is sent. Additional pages await review.

Current loader and parallax changes also pass the production build and TypeScript checks.

## Supabase foundation

Installed @supabase/supabase-js and @supabase/ssr. Local configuration is in ignored .env.local. Copy .env.example when setting up another checkout; do not commit local environment values.

In Vercel add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY using the provided project settings, then redeploy. These are public project credentials; never substitute a secret/service-role key.

Helpers:
- utils/supabase/client.ts: createClient() for browser components.
- utils/supabase/server.ts: await createClient() for Server Components, Server Actions, and Route Handlers. An existing awaited cookie store may optionally be passed.
- utils/supabase/middleware.ts: refreshes/validates sessions with getClaims and propagates cookies and cache headers.
- proxy.ts: Next.js 16 session-refresh entry point. Static/image/script/font assets bypass it. The public website stays public, and missing hosting settings do not prevent it loading.

The homepage remains unchanged. No todos page, database schema, authentication screens, policies, or form inserts have been introduced. Before connecting admissions, define the enquiry schema and row-level security policies, decide the submission endpoint and spam controls, and update consent wording. The publishable key does not grant admin database access. Authorization must be enforced by database policies and private-route checks.

## Admissions form database activation
Run supabase/migrations/202611060001_admission_enquiries.sql once in the SQL Editor for the configured Supabase project. The publishable key cannot apply migrations. Until the migration is applied, POST /api/enquiries returns an honest temporary-unavailable error and never shows a false success.
The migration enables RLS, revokes all anonymous/authenticated table access, and grants only a validated SECURITY DEFINER submission function with a fixed empty search_path. Public submissions cannot list, edit, or delete enquiries. The function limits each normalized phone to three enquiries per 15 minutes and makes retries idempotent by request UUID. This is basic abuse prevention, not a substitute for CAPTCHA under active spam.
View submitted enquiries through Supabase Table Editor as an authorised project administrator. No public admin endpoint exists.
The website uses a same-origin POST route, input validation, honeypot, required contact consent, timeout/retry handling, and idempotency keys. No service-role key is required. Test validation with: node --experimental-strip-types --test tests/enquiries.test.mjs.
Activation still requires an actual save/read-access verification after the migration. No database success has been claimed or fabricated before that step.

## Private admissions dashboard — /admin

Features: overview metrics, 14-day trend chart (India time), programme interest, searchable/filterable/sortable enquiry inbox, pagination, detail drawer, status and internal-note updates, filtered CSV export and sign out. Data is loaded on demand (Refresh), not advertised as real-time. Up to the latest 1000 records are loaded with an explicit notice if truncated. Charts do not show fake data.

Activation:
1. Run supabase/migrations/202611060002_admin_dashboard.sql in Supabase SQL Editor. This adds notes/updated_at and a server-only durable login throttle; public enquiry access remains blocked.
2. In Vercel add Secret variables (Production, and Preview if needed):
   - ADMIN_PASSWORD: choose a unique password with at least 12 characters.
   - ADMIN_SESSION_SECRET: a randomly generated signing secret, at least 32 characters. Generate with node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" on your own machine.
   - SUPABASE_SECRET_KEY: your Supabase server secret key (sb_secret_...), from Project Settings → API Keys. Never prefix this or either admin setting with NEXT_PUBLIC_. Do not paste these values into chat or commit them.
3. Redeploy and visit /admin.

Eight-hour HMAC-signed HttpOnly SameSite=Strict cookies, Secure in production. Every read/update checks the session server-side; no public admin data endpoint. Password rotation invalidates existing cookies; secret rotation also invalidates them. Ten login attempts per hashed IP bucket per 15 minutes, persisted in Supabase, with login failing closed if configuration/throttle is missing. Supabase admin client is stateless and server-only. Requests/responses are not cached. Status/note writes use optimistic concurrency to prevent accidental overwrites. CSV export escapes formula cells. Log out clears this browser’s cookie; rotating secrets revokes all active sessions. This is one shared administrator identity, not individual staff accounts or an audit trail.

Tests: node --experimental-strip-types --test tests/admin.test.mjs tests/enquiries.test.mjs.

Admin validation completed with isolated synthetic records (not production data): wrong-password and cross-origin login rejected; anonymous read rejected; successful login returns Secure/HttpOnly/SameSite=Strict cookie; private list not cached; malformed edits rejected; logout clears cookie. Browser-tested search, programme filtering, pagination, status/note editing, insights navigation and sign-out. Mobile 390px and desktop 1440px checked; mobile width overflow corrected. Actual Supabase privileged read/write and durable throttling require the admin migration and secret configuration before production verification.
