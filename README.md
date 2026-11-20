# LION STUDIO

AI creative studio: images, stickers, motion stickers, voice (many languages), read text from images, LION AI planner, credits and plans.

Files: `server.js` (backend API), `page.js` (the whole app screen UI), `package.json`, `README.md`.

## Setup (once)

1. Supabase SQL Editor: run `lion_studio_schema.sql`, then this:

```sql
alter table profiles drop constraint profiles_id_fkey;
alter table profiles alter column id set default gen_random_uuid();
alter table profiles add column if not exists device_id text unique;
```

2. Supabase Storage: create a **public** bucket named `media`.
3. Vercel -> Project -> Settings -> Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY` (service_role key, never put it in GitHub)
   - `GEMINI_API_KEY`
   - optional: `GEMINI_TEXT_MODEL`, `GEMINI_IMAGE_MODEL`, `GEMINI_TTS_MODEL`
4. Push these files to GitHub. Vercel deploys automatically.

## Credits

Image 1, Sticker 1, Motion sticker 3, Voice 2, Music 3, Video clip 5, Read Image 1, LION AI 1 (edit `COST` in `server.js`).
Credits are charged only after a successful result. Free plan: 50 credits, refilled 24 hours after they reach 0.

## Not connected yet

Music, Video, Video Editor and paid plan purchase need a provider/payment gateway; their endpoints return a clear message until then.
Vercel limits request size to about 4.5 MB, so large uploads need a different storage flow later.
