# How to avoid merge conflicts

A conflict happens when two branches change **the same lines of the same file**. Avoid that,
and git merges everything by itself.

## Rule 1: stay in your own files

OWNERSHIP.md gives every file an owner. If your task needs a change in someone else's file,
message them and agree who makes it. Ten seconds of talking saves an hour of untangling.

## Rule 2: the five shared files need care

These are the files everyone eventually wants to touch:

| File | Why everyone touches it | The rule |
| --- | --- | --- |
| `frontend/src/App.jsx` | new pages need a route | **Add your route at the end of your area's block.** Never reorder existing routes. |
| `frontend/src/services/api.js` | new endpoints | **Append** your functions under your area's comment heading. |
| `backend/app.js` | new route groups | Member 5 adds it for you - ask in the group chat. |
| `frontend/src/styles/sprint3.css` | new styles | **Append at the end**, under a comment with your area name. |
| `README.md` | documentation | Member 5 owns it. Send them your paragraph. |

Appending is the trick: two people appending to different ends of a file rarely conflict,
and when they do, the fix is obvious because both versions are kept.

## Rule 3: never reformat a file you did not write

A "tidy up" that re-indents 300 lines turns a clean merge into a mess, and hides your real
change in the review. No prettier runs across the whole project on a feature branch.

## Rule 4: rebase before you push, every time

```bash
git fetch origin
git rebase origin/develop
```

Doing this daily means conflicts are small. Doing it once at the end means one giant conflict.

## Rule 5: small branches, merged quickly

A branch open for six days conflicts with everything. One or two days is the target.

## When a conflict happens anyway

```bash
git rebase origin/develop
# CONFLICT in frontend/src/services/api.js
```

Open the file. You will see:

```
<<<<<<< HEAD                      (what is already on develop)
export const listRequests = ...
=======                           (your change)
export const classDirectory = ...
>>>>>>> feature/classes-directory
```

Usually **both lines should stay** - two people added different functions. Delete the three
marker lines, keep both, save. Then:

```bash
git add frontend/src/services/api.js
git rebase --continue
```

Check it still builds before pushing. If you are unsure, `git rebase --abort` puts everything
back exactly as it was - nothing is lost, and you can ask for help.

## The one thing never to do

Do not "fix" a conflict by deleting the other person's code. If you are not sure what their
lines do, ask them. A lost feature is discovered days later, and by then nobody knows why.
