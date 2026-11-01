# 3. Zoneless Angular with signals, organised by feature

Date: 2026-11-01 · Status: Accepted

## Context
Pitch updates arrive about 60 times a second. Change detection triggered by zone.js on every
animation frame would waste battery on phones.

## Decision
- Angular 22, standalone components, zoneless change detection and signals. The graph draws to a
  canvas from its own animation-frame loop and does not go through change detection at all.
- Folders follow what the app does (`pitch/`, `listening/`, `practice/`, …), not technical layers.
- Musical and scoring rules live in plain TypeScript classes and functions with no Angular imports;
  Angular services are thin adapters around browser APIs (microphone, audio, wake lock, storage).
- No command/query bus: in a client-only app, signal stores with intent-revealing methods give the
  same separation with less ceremony.

## Consequences
Domain logic is unit tested without TestBed. Browser adapters are covered by Playwright smoke tests
that use Chrome's fake microphone.
