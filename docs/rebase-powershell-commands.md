[`scripts/rebase-dependabot.ps1`](scripts/rebase-dependabot.ps1:1)

PowerShell commands (run from project root d:\Programmeren\MaasISO\saasapps\tra001):

# 1) Ensure gh is authenticated
gh auth status

# 2) Fetch and update main
git fetch origin main
git checkout main
git pull origin main

# 3) Run the rebasing script (uses gh)
pwsh ./scripts/rebase-dependabot.ps1

# Troubleshooting notes:
# - If gh is not installed: https://cli.github.com/
# - If script hits rebase conflicts, resolve them interactively:
#     git status
#     (edit files to fix conflicts)
#     git add <files>
#     git rebase --continue
#   then:
#     git push --force-with-lease origin HEAD:<branch>