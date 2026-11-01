# 1. Pitch detection with McLeod (pitchy) plus a stabilizer

Date: 2026-11-01 · Status: Accepted

## Context
Singers need a pitch reading that is accurate to a few cents and does not flicker. Autocorrelation
methods such as YIN and McLeod (MPM) suit monophonic voice, but every per-frame detector sometimes
reports the octave above or below for a frame or two, which looks like a wild jump on the graph and
would break hold-to-match scoring.

## Decision
- Use `pitchy` (McLeod Pitch Method) on 2048-sample buffers read from an `AnalyserNode` once per
  animation frame. At 48 kHz that is about 43 ms, enough periods for voices down to ~65 Hz.
- Disable the browser's echo cancellation, noise suppression and auto gain on the microphone track.
- Pass every frame through `PitchStabilizer` (a pure class) that:
  - gates out quiet, unclear (clarity < 0.9) and out-of-range (65–1100 Hz) frames,
  - median-filters the last 5 readings in the MIDI (log) domain,
  - holds back octave jumps unless they persist for 80 ms,
  - forgets its octave lock after 250 ms of silence, so a new phrase may start anywhere.

## Consequences
- About two frames (~30 ms) of added latency from the median filter; acceptable for singing.
- Detection runs on the main thread. If profiling on low-end phones shows jank, move analysis into an
  `AudioWorklet` behind the same `PitchFrame` interface.
