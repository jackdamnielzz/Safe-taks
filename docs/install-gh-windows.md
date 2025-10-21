[`docs/install-gh-windows.md`](docs/install-gh-windows.md:1)

Manual installation steps for GitHub CLI (gh) on Windows (use PowerShell as Administrator):

1) Download the MSI installer (recommended):
- Open PowerShell and run:
  Invoke-WebRequest -Uri "https://github.com/cli/cli/releases/latest/download/gh_{{ARCH}}_windows_amd64.msi" -OutFile "$env:TEMP\gh.msi"
  Replace {{ARCH}} with:
    - "v2" placeholder: instead use the real filename from the releases page.
  (If the above is inconvenient, open https://github.com/cli/cli/releases/latest in your browser and download the Windows MSI.)

2) Install the MSI:
- Run as admin:
  Start-Process msiexec -Wait -ArgumentList '/i', "$env:TEMP\gh.msi", '/qn'

3) Verify installation:
- Close and reopen PowerShell (so PATH updates).
- Run:
  gh --version

4) Authenticate gh with GitHub:
- Run:
  gh auth login
  Choose GitHub.com, SSH or HTTPS (SSH recommended), follow prompts to authenticate in browser.

5) Optional: Add gh to PATH if not recognized:
- The MSI typically updates PATH. If gh not found, add gh install folder (C:\Program Files\GitHub CLI) to user PATH via System settings or:
  [Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\Program Files\GitHub CLI", "User")

6) Re-run the rebasing script:
- From project root:
  pwsh ./scripts/rebase-dependabot.ps1

Notes:
- If you prefer Homebrew on Windows (via WSL) or Chocolatey/scoop, use those package managers instead.
- If you want, paste the output of `gh --version` here after installing and I'll re-run the script.