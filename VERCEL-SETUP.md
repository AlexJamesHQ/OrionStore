# Vercel setup

1. Deploy this project to Vercel.
2. Add `GITHUB_TOKEN` as a server-side Environment Variable for Production (and Preview if needed).
3. Redeploy after changing environment variables.
4. Vercel builds the frontend with `vite build`; GitHub API routes live under `/api`.

The TypeScript config intentionally excludes Vercel serverless files and the local Express server from the browser application's type-check. Those runtime files are not part of the Vite client bundle.
