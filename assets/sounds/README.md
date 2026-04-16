# Metronome Sound Samples

Place the following WAV files in this directory:

- `tick.wav` — Classic mechanical click (short, 16-bit PCM, 44.1kHz)
- `hihat.wav` — Closed hi-hat strike
- `kick.wav` — Bass drum hit
- `rimshot.wav` — Snare rim click

Recommended: Use royalty-free samples from freesound.org or create them with:
  - Audacity (free) — generate tone bursts at ~2kHz for tick
  - Sample packs from Splice, LANDR, or Logic Pro X

The files must be present for the metronome engine to load.
Until real samples are added, the engine will log a load error but the
timing loop will still function (no audio).
