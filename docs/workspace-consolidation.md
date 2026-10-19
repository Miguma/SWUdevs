# Canonical localhost workspace — 19 October 2026

Port 3000 was running the original checkout at `C:\Users\marka\OneDrive\Desktop\Tambayayong`. Port 3100 was running a separate Codex checkout. Different source trees explained the different interfaces; browser storage is also isolated by origin, including port.

The combined source preserves the original compact intake layout and adds the tested reliability changes, explicit model selection, quoted task evidence, accessible controls, and sign-in/sign-up previews. Clicking the brand returns to the intake workspace. Account forms are deliberately unconnected and do not send or store passwords.

The original folder's nine modified UI files were backed up byte-for-byte and preserved in a recoverable Git snapshot (`49b2cb7`, branch `codex/local-ui-snapshot`) before consolidation. Source and destination hashes were checked immediately before applying 55 source-file updates. Environment files, browser data, dependencies, Git history, and build output were not copied or cleared. The original folder remains on main with reviewable uncommitted changes: Git refused feature-branch creation even after source-folder and Git-folder permission grants. The implementation branch remains `codex/reliability-and-hackathon` in the isolated checkout.

`npm run dev` explicitly uses port 3000. The separate port-3100 process was stopped. The original running development server picked up the updated source without a restart. Health now identifies version `1.1.0-preview.2`, release `unified-ui-preview`, and account access `preview-only`.

## Validation

- Combined source in the isolated checkout: `npm run check` passed 20 dataset cases, 70 tests across 9 files, typecheck, and production build. After replacing a named JSON import with the default import, production build passed again. Nonfatal sandbox Webpack cache warnings remain.
- Original server on port 3000: health, sign-in, and sign-up each returned HTTP 200. Browser navigation confirmed the updated home, compact intake, explicit offline model notice, and both account screens. Tests/build were run in the isolated checkout, not against the original folder's existing dependency installation.
- Local settings and browser storage were preserved. Saved data from port 3100 is not automatically merged into port 3000.
- Authentication is a screen preview only. No real account or session has been created.
- The earlier GitHub billing lock, missing usable GitHub write access, offline Ollama/local-model availability, unavailable Docker engine, and sandbox test-runtime workarounds remain as documented in validation.md. No real-model accuracy or successful remote CI run is claimed.

Use `http://localhost:3000` for further development and demonstrations. If starting from the original folder, run `npm run dev`; it should report an occupied port rather than silently create another app instance.
