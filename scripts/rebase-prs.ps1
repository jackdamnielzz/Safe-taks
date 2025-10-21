# [`scripts/rebase-prs.ps1`](scripts/rebase-prs.ps1:1)
# Rebase listed PR numbers onto origin/main and push with --force-with-lease
# Usage: pwsh ./scripts/rebase-prs.ps1

$prs = @(9,10,15,16,8,14,12,13,11,6,5,4,3,2,1,7)
git fetch origin main

foreach ($n in $prs) {
  Write-Host "-----"
  Write-Host "Processing PR #$n"
  $exists = $null
  try {
    $exists = gh pr view $n --json number -q .number 2>$null
  } catch { $exists = $null }
  if ($exists) {
    Write-Host "Checking out PR #$n..."
    gh pr checkout $n
    if ($LASTEXITCODE -ne 0) {
      Write-Host "Failed to checkout PR #$n. Skipping."
      git checkout main
      continue
    }
    git fetch origin
    Write-Host "Rebasing onto origin/main..."
    git rebase origin/main
    if ($LASTEXITCODE -ne 0) {
      Write-Host "Rebase conflict on PR #$n. Aborting and skipping."
      git rebase --abort
      git checkout main
      continue
    }
    $branch = (git rev-parse --abbrev-ref HEAD).Trim()
    Write-Host "Pushing rebased branch $branch..."
    git push --force-with-lease origin HEAD:$branch
    if ($LASTEXITCODE -ne 0) {
      Write-Host "Push failed for PR #$n. Skipping."
      git checkout main
      continue
    }
    Write-Host "Rebased and pushed PR #$n."
    git checkout main
  } else {
    Write-Host "PR #$n not found or closed."
  }
}