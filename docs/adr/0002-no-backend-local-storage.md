# 2. No backend; data stays on the device in localStorage

Date: 2026-11-01 · Status: Accepted

## Context
PitchFix stores a vocal range, settings and practice history for one person. Accounts and sync are
out of scope.

## Decision
Ship as a static site with no backend. Persist data in `localStorage` behind a small storage port
with a schema version, validating what is read so corrupt or old data falls back to defaults.

## Consequences
- No personal data leaves the device and audio is never recorded, which keeps privacy simple.
- Data is lost if the user clears site data, and does not move between devices.
- The storage port allows a different store (e.g. IndexedDB or sync) later without touching domain code.
