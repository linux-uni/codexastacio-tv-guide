# CodeXaStacio TV Guide v111 — Commercial launch readiness

**Status: NOT APPROVED FOR PUBLIC RELEASE.** This document is a release gate, not an authorization to deploy, merge, charge customers, or change production data.

## Product scope
- Sports fixtures and schedules from third-party feeds, with local Dominican Republic date handling.
- Discovery of channels and streaming platforms; a listing is **not** proof of broadcasting rights or availability in a given country.
- Installable progressive web app; offline caching is for the app shell, not guaranteed live schedules.
- Account, role and administrative controls require authenticated end-to-end verification.

## Release gates (all required)
- [x] CI JavaScript syntax, static/PWA checks, deterministic unit tests and live feed smoke checks passed on v111 (GitHub Actions run 41971931117, commit 831def3).
- [ ] Re-run CI successfully on **final release commit** (previous pass does not certify later changes).
- [ ] Complete task 5 modularization and independently review its security implications.
- [ ] Android Chrome, iOS Safari and desktop responsive manual smoke tests: 320/375/390/768/1280 px, navigation, search, scrolling, menus, keyboard focus, reduced motion.
- [ ] Install, reload, update and offline/online PWA tests on actual devices; confirm no cached stale version.
- [ ] Test login, logout, session expiry, blocked users, regular users and admin in **two independent authenticated sessions**.
- [ ] Confirm Supabase RLS, least privilege, and audit logs in isolated environment; no production test writes.
- [ ] Verify source attribution, permitted use of third-party logos, imagery, trademarks, API data, and provider/platform names.
- [ ] Validate geographic rights and availability for each streaming recommendation in Dominican Republic; display uncertainty when unknown.
- [ ] Publish accurate privacy notice, contact channel, retention/deletion process and terms after legal review.
- [ ] Confirm hosting/domain ownership, HTTPS, monitoring, backup/recovery, operational support, and incident response.
- [ ] Approve pricing, payment processing, invoicing/tax treatment and customer-facing offer **before** selling.
- [ ] Get explicit approval to merge/deploy and prepare a rollback plan.

## Manual acceptance script
1. Open home on a phone at 320px and 390px: no horizontal page overflow; cards and controls usable.
2. Navigate Today/Tomorrow/7 days, sports tabs, channels, providers and favorites. Verify dates and empty/error states.
3. Search for a team, return to home, rotate screen, open the floating menu and language selector.
4. With keyboard only, tab through all interactive elements; check visible focus and no keyboard traps.
5. Toggle reduced-motion preference and verify animations are minimized.
6. Install PWA, load once online, go offline, reopen and verify shell loads without implying feeds are live.
7. Return online and refresh; verify updates and cache behavior.
8. In isolated auth sessions, test permissions and admin denial; record screenshots and exact reproduction steps for failures.

## Go/no-go rule
Release only when all gates are checked, defects are triaged and blocking issues are fixed. Record tested commit, device/browser, date, tester and sign-off. Maintain v110 as the production rollback baseline until v111 is explicitly approved.

## Commercial positioning (draft)
**CodeXaStacio TV Guide** helps users find upcoming sports events, channels and possible streaming options in one mobile-friendly guide. Schedule and platform data may change. The product does not grant access to paid broadcasts, and platform listings do not imply affiliation or endorsement.

Do not advertise guaranteed live coverage, licensed distribution, complete sports schedules, official partnerships or specific prices unless independently verified and authorized.
