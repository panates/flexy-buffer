# Changelog

<!-- rman:documented-up-to 774b2a2d91e5368fd9c969df1a2ef7626575ad77 -->

## v1.1.2 (2026-10-05)

### 🧹 Chores

- migrate to rman 2.x and the shared GitHub Actions workflows (b9dff0a)
- rebuild the changelog with rman, test on Node 22/24/26, drop husky and .madgerc (d33aac3)

### 💬 General Changes

- Arm one house keep timer per idle window, not one per flush (a01b19a)
- Bump docs/api.md baseline to the commit it now describes (f1dddc3)

---

## v1.1.1 (2026-09-13)

### 💬 General Changes

- Fill TSDoc gaps: buffer field, read-method @returns/@throws, setter @param (16eea5d)
- Bump docs/api.md baseline to the commit it now describes (2de22b4)

---

## v1.1.0 (2026-09-12)

### 💬 General Changes

- Make position settable, avoid unneeded flush() timer resets (fbb35ad)
- Bump docs/api.md baseline to the commit it now describes (68dac6a)

---

## v1.0.1 (2026-09-12)

### 💬 General Changes

- Upgrade TypeScript to v6.0.3 in dependencies and lockfile (861f136)
- Drop the unverified browser claim, refresh docs baseline (5434ed4)

---

## v1.0.0 (2026-09-12)

### 💬 General Changes

- Add start()/flush(), byte-exact maxLength, fix writeString bug (34bd920)
- Move to a single ESM-only build (8e39b4a)

---

## v0.1.2 (2025-10-30)

### 🐛 Bug Fixes

- Fixed return values chore: Added README (8229bf0)

---

## v0.1.0 (2025-10-28)

### 💬 General Changes

- Initial commit (de063c7)
