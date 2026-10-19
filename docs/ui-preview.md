# UI and account-screen preview

This update continues from the reliability work at `f0479cd`.

The user explicitly chose polished account screens first, with real accounts to be connected later. No authentication service, user database, email delivery, OAuth, password storage, login session, or account synchronization is implemented or implied.

## What changed

- Refined the green/white home page with clearer navigation, typography, spacing, and a labeled illustrative action-plan preview.
- Added shared branding and clear sign-in/sign-up entry points.
- Added `/sign-in` and `/sign-up` with responsive layouts, visible labels, browser validation, password visibility toggles, preview feedback, and guest return links.
- Account forms do not submit credentials, call an authentication endpoint, or serialize named password controls. Submitting shows an honest coming-soon notice; it does not claim an account was created or a user signed in.
- Preserved the meeting workflow, source verification, model selection, review, and guest storage. A final draft snapshot is saved when navigating away before the normal debounce completes.
- Fixed the Tailwind secondary-text token to match the accessible CSS color and added a missing accent-light token.

## Verification

- Existing 70 tests across 9 files passed.
- Expanded TypeScript check passed.
- Dataset validation passed: 20 cases (6 English, 7 Cebuano, 7 mixed).
- Final `npm run check` passed with exit 0, including the production build. `/sign-in` and `/sign-up` were statically generated (about 100 kB first-load JS each); home was about 120 kB. Only the existing nonfatal sandbox cache warnings appeared.
- Browser: home-to-sign-up navigation, sign-in/sign-up switching, password visibility, sign-in and sign-up preview submissions, guest return, and immediate draft preservation checked with public sample/test text.
- Mobile: home and sign-up checked at 320 px (document width 314 px); sign-up checked at 390 px (document width 384 px). No horizontal overflow observed. Viewport override reset afterward.
- Screenshots captured for desktop sign-in/sign-up and mobile sign-up. No real credentials were used.

Tests used the same session-only Windows sandbox runtime/esbuild workarounds described in `validation.md`. No new dependencies were introduced. This update does not change the previously recorded GitHub permission/billing, Docker, or live-model limitations.
