This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Admin panel (flash & gallery)

The site has a password-protected admin panel at `/admin` for adding/removing flash designs and gallery photos without touching code. It uses [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) for image + data storage.

To enable it in production:

1. In the Vercel project dashboard, go to **Storage → Create Database → Blob**, and connect it to this project. This automatically adds a `BLOB_READ_WRITE_TOKEN` environment variable.
2. Add two more environment variables (Vercel project → Settings → Environment Variables):
   - `ADMIN_PASSWORD` — the password your girlfriend will use to log in at `/admin`.
   - `ADMIN_SESSION_SECRET` — any long random string (e.g. `openssl rand -hex 32`), used to sign the login session cookie.
3. Redeploy so the new env vars take effect.

Once set up, log in at `yourdomain.com/admin`, and use the Flash / Galerie tabs to upload images, set flash prices and availability status, and delete items. Changes appear on the live site within seconds — no redeploy needed.

For local development, create a `.env.local` (gitignored) with the same three variables to test the admin panel locally.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
