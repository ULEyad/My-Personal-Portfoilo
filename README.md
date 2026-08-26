# Personal site + AI twin — deploy guide

This capstone project has two parts that ship together:

- `index.html` — the site itself: page, styles, and the AI twin widget, all in one file
- `api/chat.js` — a tiny serverless function that talks to Gemini on the twin's behalf, so your API key never reaches the browser

## Deploy it (Vercel, free tier is enough)

1. Push this folder to a new GitHub repo — keep `index.html` and `api/chat.js` in the same relative positions, since Vercel auto-detects anything inside `api/` as a serverless function
2. Go to vercel.com → **New Project** → import that repo
3. In **Project Settings → Environment Variables**, add `GEMINI_API_KEY` with a real key from Google AI Studio (aistudio.google.com → "Get API key" — free, no credit card)
4. Deploy — no build step, no framework config needed
5. Visit your new `.vercel.app` URL and talk to your twin

## Before you make it real

- [x] Real name, bio, and projects — done, this is your actual site
- [x] `PROFILE` block in `api/chat.js` — updated with your real background
- [x] Footer contact links — already pointing at your real email / GitHub / LinkedIn
- [x] Unity / game-dev certification — now in the Education section *and* its own Skills card, and the twin talks about it as normal background instead of hiding it
- [x] LinkedIn URL confirmed — `linkedin.com/in/eyad-elshafey-b45929428`, updated everywhere (header, footer, and the twin's profile)
- [ ] Optional: buy a domain (Namecheap, Porkbun, wherever) and add it under the Vercel project's Settings → Domains — Vercel will give you the DNS records to paste at your registrar. This needs your own payment method, so it's not something I can do from here.

## Why it's built this way

The "Learning Log" section on the site itself walks through the real decisions behind this build: context vs. retrieval, why the API key had to move server-side, and how the system prompt is put together. Worth a read before you touch the code — it explains the *why* behind the *what*, which is the part a capstone rubric actually cares about.

## Local testing

Vercel's CLI can run this exact setup on your machine before you deploy:

```
npm i -g vercel
vercel dev
```

That serves `index.html` and runs `api/chat.js` as a real function on localhost, reading `GEMINI_API_KEY` from a `.env.local` file (don't commit that file — add it to `.gitignore`).

## Good to know about the free tier

Gemini's Flash-Lite tier is free within rate limits (roughly 1,000 requests/day, plenty for a portfolio site), no credit card needed. The tradeoff: on the free tier, Google may use request content to improve their products. Fine for a public "ask me about my projects" bot; worth knowing if that ever matters to you.
