# Task board: three or more branches for each member

These are **real, useful tasks** the project actually needs, taken from a code audit.
Each one is a branch, a pull request, and something you can talk about with confidence.

Tick them off as they are merged.

## Member 1 - Accounts and security

- [ ] `feature/auth-password-reset-email`
      Forgot-password currently answers politely but sends nothing. Add an email service
      (Resend, SendGrid or Nodemailer), a reset token with an expiry, and a reset page.
      **Touches:** authController, User model, a new page. **Talk about:** why the same
      answer is given for every address.
- [ ] `feature/auth-cookie-token-option`
      Offer the login token as an httpOnly cookie instead of localStorage, behind a setting.
      **Talk about:** what XSS is, and why a cookie is safer against it.
- [ ] `feature/auth-delete-account`
      Let someone delete their account and everything attached to it (progress, memberships,
      requests). **Talk about:** data protection, and cleaning up related documents.
- [ ] `test/auth-permission-matrix`
      A test that every route refuses every role that should not reach it.

## Member 2 - Learning experience

- [ ] `feature/learning-engine-split`
      LessonEngine is 600 lines. Extract ChoiceAnswers, TypingAnswer, WordOrderAnswer and
      PairUpAnswer into `components/exercises/`. **Talk about:** component composition, props.
- [ ] `feature/learning-accessibility`
      Keyboard-only run through a lesson, focus management between steps, and announcements
      for screen readers. **Talk about:** aria-live, focus order, why it matters.
- [ ] `feature/learning-skip-and-return`
      Let a learner skip a hard question and come back to it at the end.
- [ ] `test/learning-exercise-generation`
      A test that every one of the 536 lessons builds valid steps: no repeats in a row, the
      answer always among the options.

## Member 3 - Classes and teachers

- [ ] `feature/classes-teacher-audio`
      **The most valuable missing feature.** Let a teacher record audio for a vocabulary item,
      stored with the existing upload pipeline, and play it in lessons instead of the robot
      voice. **Talk about:** GridFS, MediaRecorder, why recorded audio matters for Twi.
- [ ] `feature/classes-analytics`
      A simple class overview: who is falling behind, which modules are hardest.
- [ ] `feature/classes-bulk-requests`
      Approve or decline several join requests at once, with a confirmation.
- [ ] `test/classes-permissions`
      Tests that one teacher can never see or change another teacher's class.

## Member 4 - Content and languages

- [ ] `feature/content-native-review`
      Have a Finnish and a Japanese speaker check the content; record the corrections and who
      reviewed it. **Talk about:** why content accuracy is a real requirement here.
- [ ] `feature/content-fifth-language`
      Add a new language using `data/languages/_build.js` and list it in `languages.js`.
      **Talk about:** how the ids, phases and item shape keep the engine language-independent.
- [ ] `feature/content-culture-create-step`
      The culture "Create" lessons are currently multiple choice. Add a small real step: write
      a sentence or upload a photo, stored like a class material.
- [ ] `test/content-validation`
      A test that every module has words and lessons, and that no two ids clash.

## Member 5 - Quality, docs and deployment

- [ ] `feature/quality-ci-on-pull-requests`
      Make GitHub Actions run the backend tests and the frontend build on every pull request,
      and require it to pass before merging.
- [ ] `test/quality-coverage-gaps`
      Add tests for the paths nothing covers yet (contact form, error handler branches).
- [ ] `docs/deployment-runbook`
      A step-by-step deployment guide with screenshots, and what to do when it fails.
- [ ] `docs/architecture-diagrams`
      Diagrams of the request flow and the data model for the report.

## Definition of done, for every branch

1. It works, and you have tried it yourself in the browser.
2. The tests pass (`npm --prefix backend test`) and the frontend builds.
3. Commits explain WHY.
4. A teammate reviewed it and asked at least one question.
5. It is merged into develop without breaking anything.
