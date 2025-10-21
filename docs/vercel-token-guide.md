[`docs/vercel-token-guide.md`](docs/vercel-token-guide.md:1)

How to create a short-lived Vercel token (VERCEL_TOKEN) — step-by-step:

1) Open Vercel dashboard
- Go to https://vercel.com and sign in with the account that has access to your project.

2) Navigate to your profile tokens
- Click your avatar (top-right) -> Settings.
- In Settings, open "Tokens" (sometimes under "Account" -> "Tokens" or "Security" -> "Tokens").

3) Create a new token
- Click "Create Token" or "New Token".
- Give it a name like "temporary-inspect-previews".
- For minimal scope, select the least privileges needed (e.g., "Read" for deployments, "Read & Deployments" if needed). Prefer read-only if only inspecting logs.
- Set an expiration if supported (choose shortest available time or use the UI to revoke after use).

4) Copy the token securely
- Copy the token value now (you will not be able to view it again).
- Paste it in a secure place (temporary clipboard). Do NOT share the token publicly.

5) Provide the token for this session
- Paste the token value here as a single line like:
  VERCEL_TOKEN=xxxxxxxxxxxxxxxxxxxx
- After I finish, immediately revoke the token in Vercel Dashboard (Settings -> Tokens -> Revoke).

6) If you prefer not to share a token
- Instead run "vercel login" locally and then run:
  vercel projects ls
  vercel inspect <deployment-id>
  vercel logs <deployment-url> --since 1h
  (I can provide exact vercel CLI commands to run locally; ask if you want those.)

Security notes:
- Only provide a short-lived token. Revoke it immediately after I finish.
- Prefer read-only scope.
- Do not paste the token into public chat logs or version control.

If you want, paste the token now and I will inspect previews and logs.