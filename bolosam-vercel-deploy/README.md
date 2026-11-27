# BoloSam — Vercel Deploy Ready

Voice-first khata app for micro-merchants. **Bolo, Hisab Ho Gaya!**
Hindi / English / Hinglish voice commands for Bikri (sales), Kharcha (expenses),
Yaad (reminders), Munafa dashboard, category report, monthly budget and a
Bolta Calculator — with real Lucide icons (no emojis).

This version is a **standalone Vite + React app made for Vercel**. It has
**no backend and no database to set up** — all data is saved in the
visitor's own browser (`localStorage`), so it deploys as a pure static site.

---

## Deploy on Vercel — 3 easy ways

### Option A — Vercel dashboard (sabse easy, no Git needed)
1. Is ZIP ko unzip karo.
2. [vercel.com/new](https://vercel.com/new) par jao → **"Browse" / drag & drop**
   se poora unzipped folder upload karo.
   *(Ya Vercel dashboard → Add New → Project → folder select karo.)*
3. Vercel khud detect kar lega:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. **Deploy** dabao — 1–2 minute mein live URL mil jayega (jaise
   `bolosam.vercel.app`).

### Option B — GitHub se (auto-deploy on every push)
1. Unzipped folder ko ek naye GitHub repo mein push karo.
2. Vercel → Add New → Project → repo import karo → Deploy.
3. Har `git push` par site khud update ho jayegi.

### Option C — Vercel CLI
```bash
npm install
npx vercel        # pehli baar login + preview deploy
npx vercel --prod # production deploy
```

Koi **environment variable nahi chahiye**. `vercel.json` is project mein
pehle se ready hai.

---

## Locally chalana ho to

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build -> dist/
npm run preview  # build ko locally test karo
```

Node.js 18+ chahiye (20+ recommended).

---

## Kya-kya hai isme

- **Voice Studio** — bada mic button, Hindi / English toggle, live transcript,
  har mic error ke liye alag sahi message + permission help, typed command box
  aur example chips. Commands: "500 rupaye ki bikri hui",
  "150 ka kharcha chai pe", "Aaj ka hisab batao",
  "18 percent of 2500 kitna hota hai?"
- **Dashboard** — Munafa (Net Balance), Bikri / Kharcha cards,
  Today / This Month / All Time filter.
- **Khata (Ledger)** — search, manual entry, delete.
- **Report** — category donut chart (Kirana & Stock, Food & Chai,
  Transport & Fuel, Bills & Utilities, Other).
- **Budget** — monthly budget ring, over-budget alert, editable limit.
- **Yaad** — reminders with ring test.
- **Bolta Calculator** — result bolkar sunata hai, ek tap mein result ko
  Bikri / Kharcha entry bana deta hai.

Pehli baar khulne par demo kirana data dikhega (DEMO badge ke saath) —
dashboard mein **"Demo clear karo"** dabakar ek tap mein saaf ho jayega.

## Zaroori notes

- **Mic / voice ke liye HTTPS chahiye** — Vercel by default HTTPS deta hai,
  isliye deployed site par mic chalega. Voice recognition ke liye
  **Chrome / Edge** best hai (browser ka Web Speech API use hota hai).
- **Data kahan save hota hai?** Har visitor ke apne browser ke
  `localStorage` mein. Matlab: data device/browser ke hisaab se alag rahega,
  server par kuch save nahi hota. Hackathon demo / pilot ke liye perfect hai.
  Agar aage chal kar sab users ka data ek jagah (cloud database) chahiye ho,
  to backend API jodna hoga — ye frontend usi ke liye ready structure mein hai.
- Dark mode phone/browser ki setting se khud aa jata hai.

## Project structure

```
├── index.html
├── package.json
├── vercel.json          <- Vercel config (ready)
├── vite.config.ts
├── tsconfig.json
├── public/
│   └── icon.webp
└── src/
    ├── main.tsx
    ├── App.tsx          <- poori app (voice, dashboard, khata, report…)
    └── theme.css        <- Tailwind v4 theme + custom styles
```
