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
