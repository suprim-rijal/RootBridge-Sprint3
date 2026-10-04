# How we use git

## The branches

```
main                 always working, always deployable. Protected.
 └── develop         everything is merged here first
      ├── feature/auth-password-reset-email          (Member 1)
      ├── feature/learning-engine-split              (Member 2)
      ├── feature/classes-audio-upload               (Member 3)
      ├── feature/content-finnish-review             (Member 4)
      └── feature/quality-ci-on-pull-requests        (Member 5)
```

**Nobody pushes to main or develop directly.** Everything arrives through a pull request.

## Naming

```
feature/<area>-<short-task>     new work        feature/classes-bulk-approve
fix/<area>-<what-was-wrong>     a bug           fix/auth-pin-lost-on-save
docs/<what>                     documentation   docs/deployment-runbook
test/<what>                     tests only      test/progress-cheating-paths
```

Areas: `auth`, `learning`, `classes`, `content`, `quality`.

## The loop, every time

```bash
git checkout develop
git pull                                   # start from the newest develop
git checkout -b feature/auth-password-reset-email

# ... work, in small commits ...
git add backend/controllers/authController.js
git commit -m "Send a real reset email instead of logging the link

The forgot-password route answered politely but nothing was ever sent.
Adds an email service and a template. Falls back to logging in development."

git fetch origin
git rebase origin/develop                  # put your work on top of the newest develop
npm --prefix backend test                  # your side must pass
git push -u origin feature/auth-password-reset-email
```

Then open a pull request into **develop**, and ask one teammate to review.

## Commit messages

One line saying WHAT, a blank line, then WHY. The why is what a marker reads.

```
Refuse a live-class link that is not https

A javascript: link would have run in a student's browser when they
clicked "Join live class". The server now parses the address and
demands https, so the form cannot be bypassed.
```

Avoid: "update", "fix", "changes", "work", "final", "final2".

## Rebase, do not merge develop into your branch

`git rebase origin/develop` keeps history readable: your commits sit on top, in order.
Merging develop into your branch creates a tangle that is hard to review.

If a rebase reports a conflict, see CONFLICTS.md - it is usually one file and two minutes.

## Pull requests

- Small. A branch that changes 5 files is reviewed properly; one that changes 40 is rubber-stamped.
- Describe what changed and how you tested it.
- One reviewer minimum. The reviewer asks at least one real question.
- Merge only when the checks pass.

## Merge order at the end

1. Member 4 (content) - it touches the data everything else reads.
2. Member 1 (accounts) - other areas depend on the user shape.
3. Member 2 (learning) and Member 3 (classes) - these two barely touch each other.
4. Member 5 (quality, docs, deployment) - last, so tests and docs describe the final state.
5. `develop` -> `main` with a pull request titled "Release: Sprint 3 final".

Tag it: `git tag -a v1.0 -m "Sprint 3 final" && git push --tags`
