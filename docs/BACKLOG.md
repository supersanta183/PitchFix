# PitchFix backlog

What's left to build, in rough priority order. Live version: **v1.4** (increments 1–7 done).

## Next up

### Increment 8 — Stats and progress

- [ ] Session stats on the summary screen
  - [ ] Accuracy % (notes matched / notes asked)
  - [ ] Average deviation in cents while singing each target
  - [ ] Tendency to sing sharp or flat
  - [ ] Hardest notes (missed most often or slowest to match)
- [ ] Store each finished session on the device (date, exercise, settings, outcomes, stats)
- [ ] Progress history screen with simple charts over time (e.g. accuracy and average deviation per session)
- [ ] Link to the history from the practice screen and from the session summary

### Increment 9 — Installable app and polish

- [ ] PWA: web app manifest, app icons, theme colours
- [ ] Service worker so the app works offline after the first visit (`@angular/service-worker`)
- [ ] Check install / "Add to Home Screen" on iPhone and Android
- [ ] Accessibility pass: contrast, screen-reader labels for live values, keyboard focus order, reduced motion
- [ ] Lighthouse audit (performance, accessibility, best practices, PWA)

## Follow-ups and known issues

- [ ] **Time to match includes the prompt.** The time recorded per note starts when the round starts, so it includes the piano playing. Measure from when singing can start instead (matters for stats in increment 8).
- [ ] **From memory could be stricter.** The too high / too low meter is still shown while singing from memory. Consider an option to hide all feedback until the note is matched or skipped.
- [ ] **Tune detection with real phone data.** Use `?debug` readings from real phones to check the loudness/clarity thresholds in `PitchStabilizer`.
- [ ] **Speaker echo on loud phones.** Listening resumes 150 ms after the piano stops; lengthen if the speaker's tail is picked up as the singer's voice.
- [ ] **iPhone speaker volume while the mic is on.** Safari plays quieter while recording; investigate `navigator.audioSession` or recommend headphones more strongly.
- [ ] **Pitch detection runs on the main thread.** If older phones stutter, move analysis into an `AudioWorklet` (see ADR 0001).
- [ ] **Range test feel.** Check whether holding steady for 1 second to capture the lowest/highest note is too strict for beginners.
- [ ] **CI.** Run unit tests and Playwright e2e tests on GitHub Actions for every push, before Vercel deploys.

## Out of scope for now

Song libraries, voice recording and playback, note-name quizzes, user accounts and cloud sync.
