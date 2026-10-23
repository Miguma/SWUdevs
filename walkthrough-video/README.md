# Tambayayong 60-second system walkthrough

This Remotion composition mirrors the current green/white Tambayayong UI and explains the observed Notes → Review → Tracking → Share workflow.

## Preview

```powershell
npm install
npm run studio
```

Open the `TambayayongWalkthrough` composition. The timeline is exactly 60 seconds at 30 fps.

## Voice-over

`voiceover.ssml` contains the narration source. `public/voiceover.wav` is generated locally with the installed Microsoft Zira voice, so no transcript or credential is sent to an external voice provider. Regenerate it with `npm run voiceover`.

## Export

Use **Render → Client-side render → Render video** in Remotion Studio. This
produces `out/TambayayongWalkthrough.mp4` with the browser-native encoder.

The command below is also available where Windows permits Remotion's bundled
FFmpeg binary:

```powershell
npm run render
```

The MP4 is written to `out/tambayayong-system-walkthrough.mp4`.
