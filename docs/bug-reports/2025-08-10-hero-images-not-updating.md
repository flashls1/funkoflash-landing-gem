# Bug Report: Hero Images Not Updating/Displaying Across Pages

Date: 2025-08-10

Severity: High (user-facing visuals missing on multiple pages)

Affected Areas:
- Home, Shop, Talent Directory, Events, About, Contact hero sections

Summary
- Users reported hero images not appearing despite new 1920x240 assets and CMS updates.
- The UI showed gradient fallbacks instead of the expected page-specific hero banners.

Root Cause
1) Incomplete DB settings overshadowed defaults:
   - getCurrentPageSettings returned the stored page settings if they existed, without merging with defaults.
   - When a row existed in site_design_settings but hero.backgroundMedia was empty/undefined, the function still returned that object.
   - UnifiedHeroSection then received an empty heroMedia and rendered the gradient fallback, ignoring local v2 defaults.

2) Seeding not guaranteed on public views:
   - Auto-seeding logic requires an authenticated user (correct for security).
   - Thus, public routes might rely on DB entries that are incomplete, amplifying issue (see #1).

Fix Implemented
- Robust default merge in useSiteDesign.getCurrentPageSettings:
  - Added defaults mapping to local 1920x240 v2 assets for all primary pages.
  - Merged saved settings with defaults and explicitly prefer the default image when saved hero.backgroundMedia is missing/empty.
  - This guarantees a valid hero image is always present, regardless of partial DB rows.

Files Changed
- src/hooks/useSiteDesign.tsx
  - Updated getCurrentPageSettings to merge with defaults and fallback when hero media is falsy.

Verification Steps
1) Load each public page: /, /shop, /talent-directory, /events, /about, /contact.
2) Confirm hero section renders a 1920x240 image (topic-specific) instead of gradient.
3) In the Site Design Module, upload a valid 1920x240 hero image and save; verify it replaces the default on reload.
4) Remove hero.backgroundMedia from a page’s setting in DB (if applicable) and reload; the page should still display the default image (no empty state).

Recommendations (Next)
- Add a DB-side guard in the admin UI to prevent saving empty/whitespace hero.backgroundMedia.
- Add a small diagnostics banner in the admin Site Design Module when a page’s saved hero media is empty (optional).

Status: Resolved
