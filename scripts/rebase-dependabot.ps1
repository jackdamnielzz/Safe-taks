# PowerShell script to rebase Dependabot PR branches onto main using GitHub CLI (gh)
# [`scripts/rebase-dependabot.ps1`](scripts/rebase-dependabot.ps1:1)
#
# Usage:
# 1) Open PowerShell in project root (d:\Programmeren\MaasISO\saasapps\tra001)
# 2) Run: pwsh ./scripts/rebase-dependabot.ps1
#    or: ./scripts/rebase-dependabot.ps1
#
# This script lists open Dependabot PRs, then for each it:
# - checks out the PR locally via `gh pr checkout`
# - rebases onto origin/main
# - pushes the rebased branch with --force-with-lease
#
# Requirements:
# - GitHub CLI (gh) installed and authenticated
# - PowerShell (Windows) / pwsh
# - No secrets need to be pasted here; gh auth should already be configured

# Configure:
$ownerRepo = "$(git remote get-url origin)"  # used only for info
Write-Host "Remote origin URL: $ownerRepo"
Write-Host "Fetching latest origin/main..."
git fetch origin main

# Get open Dependabot PR numbers (type: dependabot)
$prList = gh pr list --search "author:dependabot" --json number,headRefName,title -L 100 | ConvertFrom-Json

if (-not $prList -or $prList.Count -eq 0) {
  Write-Host "No open Dependabot PRs found."
  exit 0
}

foreach ($pr in $prList) {
  $num = $pr.number
  $branch = $pr.headRefName
  $title = $pr.title
  Write-Host "Processing PR #$num - $title (branch: $branch)"

  # Checkout PR branch via gh (creates local branch)
  Write-Host "Checking out PR #$num..."
  gh pr checkout $num
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to checkout PR #$num. Skipping."
    continue
  }

  # Ensure up-to-date refs
  git fetch origin

  # Rebase onto origin/main
  Write-Host "Rebasing $branch onto origin/main..."
  git rebase origin/main
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Rebase failed for $branch. Attempting to abort and continue to next PR."
    git rebase --abort
    # Optionally you can add conflict resolution steps here if you want to handle them interactively.
    Write-Host "Skipped PR #$num due to rebase conflicts."
    # Checkout back to main to keep workspace clean
    git checkout main
    continue
  }

  # Push rebased branch
  Write-Host "Pushing rebased branch $branch..."
  git push --force-with-lease origin HEAD:$branch
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to push rebased branch $branch for PR #$num."
    git checkout main
    continue
  }

  Write-Host "Successfully rebased and pushed PR #$num."
  # Checkout main to prepare for next iteration
  git checkout main
}

Write-Host "Done. Vercel should re-run preview deployments for rebased PRs automatically."