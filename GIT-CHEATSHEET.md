# Git cheat sheet for this project

## Once, at the start

```bash
git clone https://github.com/<owner>/rootbridge.git
cd rootbridge
git config user.name "Your Name"
git config user.email "your.school@email"      # the email on your GitHub account
```

If your commits show the wrong name, this is why - and it is what a marker checks.

## Every working session

```bash
git checkout develop && git pull                  # newest shared state
git checkout -b feature/<area>-<task>             # your branch
# ... work ...
git status                                        # what changed
git diff                                          # exactly what changed
git add <specific files>                          # not "git add ." out of habit
git commit -m "Short line" -m "Why this change exists."
git fetch origin && git rebase origin/develop     # stay current
git push -u origin feature/<area>-<task>
```

## Useful

```bash
git log --oneline --graph --all -20     # see the branch picture
git branch -a                           # all branches
git switch -                            # back to the previous branch
git restore <file>                      # throw away changes to one file
git reset --soft HEAD~1                 # undo the last commit, keep the changes
git stash / git stash pop               # park changes to switch branch quickly
```

## Getting out of trouble

| Situation | Command |
| --- | --- |
| A rebase is going badly | `git rebase --abort` |
| Committed to develop by mistake | `git branch feature/x && git reset --hard origin/develop` then continue on feature/x |
| Pushed something secret (.env) | Tell the team, rotate the secret, remove the file, force-push with the owner's help |
| Wrong branch | `git stash`, switch, `git stash pop` |

## Never commit

- `.env` (it holds the database password and the JWT secret)
- `node_modules/`
- `frontend/dist/`

These are already in `.gitignore`. If `git status` shows them, do not force them in.
