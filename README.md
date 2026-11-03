# Aswedduma (අස්වැද්දුම)

A web app for Sri Lankan households that want to grow vegetables at home. It works out what a family eats, what that costs at the market, what fits in their space, what to buy, and what they save. Customers buy seedlings, containers and supplies and send the order to the shop on WhatsApp. It has step-by-step grow guides, works in English, Sinhala and Tamil, and has a Plantation section that estimates the return on planting Ceylon cinnamon or tea.

The full requirements are in [docs/SRS.md](docs/SRS.md).

## Features

- **Landing page** (`/`): what the app does, Sri Lanka's Maha and Yala seasons and growing zones, charts built from the planner's data (days to first harvest, value per sq ft), and buttons to the planner and shop.
- **Planner** (`/planner`): four steps covering home, vegetables, amounts and prices. The results show consumption, market cost, a grow plan that fills the space by value per sq ft, a shopping list at shop prices, savings with payback time, and health notes.
- **Shop** (`/shop`): about 50 products in 7 categories, with search and product codes (e.g. `F-COMPOST`).
- **Cart and checkout** (`/cart`): the cart is kept on the device. Checkout gives each order a short reference such as `ASW-7K3P9Q` and opens WhatsApp with a pre-filled English order message that includes it. The reference is shown on screen with a Copy button, so the customer can quote it to follow up.
- **Grow guides** (`/guides`): package arrival, soil preparation, and one guide for each of 11 vegetables, with figures and an Add button for each recommended product.
- **Plantation** (`/plantation`): Cinnamon or Tea, entered in hectares or acres. Shows setup cost, payback year, NPV, IRR, break-even price, workers needed and a yearly money table. Every assumption can be edited, and you can send an enquiry on WhatsApp.
- **Guests can do everything**: no account is needed. A guest's orders (with their references) and saved plans are kept on their device and listed on the Account page. Their name, phone and address are never stored.
- **Join** (`/join`): Aswedduma Certified. Three paths (Home Grower, Seeds, Plantation), each running Learn (a free course at `/join/<path>/learn`: 3 modules of 3 picture-led lessons with "Try it" tasks, each module ending in a quiz), Apply (requirements plus an application on WhatsApp with an `APP-` reference) and Get certified (a digital badge issued by the Aswedduma team after review). It is Aswedduma's own programme, not a government certificate.
- **Accounts** (`/account`, optional): Google sign-in, once Firebase is set up. Signed-in customers also get a cloud cart merged across devices, plus order history and saved plans in their account.
- **Languages**: English, සිංහල and தமிழ் for everything except the Plantation section, which is English only for now. WhatsApp orders are always in English.

## Getting started

Requirements: Node.js 24 or later (`engines` asks for `>=24.0.0`).

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no Firebase settings the app runs in **guest mode**: the planner, shop, cart, checkout, guides and plantation all work, and the Account page says accounts are not set up.

Other scripts: `npm test`, `npm run test:watch`, `npm run test:coverage`, `npm run lint`, `npm run build`, `npm start`.

## Before going live

1. **The shop's WhatsApp number** is set to the WhatsApp Business number +94 76 868 3639 in [lib/shop-config.ts](lib/shop-config.ts) (`OWNER_WHATSAPP`, international format without `+` or spaces; `OWNER_WHATSAPP_DISPLAY` is how it is shown in the footer). Every order, plantation enquiry and certification application goes there. To change it, edit both values.
2. **Check every price, yield and growing time** in `lib/data/` with local growers and suppliers (SRS OI-01).
3. **Have the Sinhala and Tamil text reviewed** (OI-05) in `lib/i18n/strings.ts` and the data files.
4. **Validate the plantation figures** in [lib/data/plantation.ts](lib/data/plantation.ts) (OI-19). They are placeholders.

## Editing products, vegetables and guides

All content lives in plain data files that hold no logic (NFR-10):

| File | What it holds |
| --- | --- |
| `lib/data/products.ts` | Product catalogue, the shared supplies added to every plan, and which container each plant size gets |
| `lib/data/vegetables.ts` | Vegetable planning data: price, weekly use, yield, cycles, space, days to harvest, climber or not |
| `lib/data/guides.ts` | Grow guide steps. Writing `[[product_id]]` in a step shows that product's name and code |
| `lib/data/plantation.ts` | Cinnamon and tea assumptions and growing steps |
| `lib/i18n/strings.ts` | Interface text in the three languages |

A product's customer-facing code comes from its ID (BR-19): `f_compost` becomes `F-COMPOST`. Changing an ID therefore changes its code.

## Accounts (optional): Firebase setup

Accounts need a Firebase project. Without one, everything except accounts still works.

1. **Create a project** in the [Firebase console](https://console.firebase.google.com/).
2. **Enable Google sign-in**: Authentication > Get started > Sign-in method > Google.
3. **Create the Firestore database**: Databases & Storage > Firestore > Create database > Standard edition > keep the ID `(default)` > choose a location > start in **production mode**. Production mode denies all browser access, which is what this app wants, because only the server talks to Firestore. Once accounts are configured, the first sign-in fails loudly if the database is missing.
4. **Service account**: Project settings > Service accounts > Generate new private key.
5. **Web app config**: Project settings > General > Your apps > add a web app and copy its config.
6. **Environment variables**: copy `.env.local.example` to `.env.local` and fill in:

| Variable | Purpose |
| --- | --- |
| `FIREBASE_ADMIN_SERVICE_ACCOUNT` | Service account JSON from step 4. Verifies sessions and reads and writes Firestore |
| `NEXT_PUBLIC_FIREBASE_WEB_SDK_CONFIG` | Web config from step 5, used by the browser for the Google popup |
| `SITE_URL` | Optional. Public URL used in metadata and the sitemap |

Both JSON values must each be on a **single physical line**. Keep the `\n` escapes inside `private_key`; only real line breaks break parsing. Running `jq -c . key.json` gives the right shape. The console shows the web config as JavaScript with unquoted keys: quote every key and drop the `const` and any trailing comma.

Set both variables, or neither. Accounts are switched on only when both are present.

7. **Authorized domains**: add every domain the app is served from (your production domain and `localhost`) under Authentication > Settings > Authorized domains. Otherwise the Google popup fails with `auth/unauthorized-domain`.
8. **Deploy the rules**: paste `firestore.rules` (deny all) into the Firestore Rules tab, or use `firebase deploy --only firestore:rules`.

### How customer data is stored

Only the server reads and writes Firestore, through the Admin SDK. The browser never imports `firebase/firestore`. Each customer's data sits under their own user document:

```
users/{uid}/meta/cart      cloud cart: { items: { productId: qty } }
users/{uid}/orders/{id}    orders sent while signed in (name, phone, method, address, notes, items, total)
users/{uid}/plans/{id}     saved planner results (people, space, choices, shopping list, total)
```

Every route takes the uid from the verified session cookie, never from the request, so a customer can only reach their own data (FR-A-11). Order prices are recomputed from the catalogue on the server, and so are saved plan totals. Customers cannot edit or delete orders or plans in the app (FR-A-12); shop staff see them in the Firebase console (use a collection-group view on `orders`). Ordering by `createdAt` happens within each customer's own collection, so no composite index is needed.

A guest's checkout details go only into the WhatsApp message and are never sent to the server.

**Cart sync**: on sign-in or page load, the device cart is merged into the cloud cart, keeping the larger quantity of each product (BR-20). After that, each change is saved. Signing out leaves the device cart in place. Because of this rule, an item removed on one device can come back from another device's cart.

**Account deletion** removes the Google account and then the customer's whole `users/{uid}` tree, including their orders. The shop already has each order in WhatsApp, but decide on a retention rule before going live (OI-16).

### Session security

These rules come from the original boilerplate and are unchanged:

- Sign-in swaps a Firebase ID token for a 2-week `httpOnly` session cookie, and only if the sign-in happened in the last 5 minutes.
- Every state-changing route rejects cross-site requests (`Origin` check plus a JSON content type).
- Signing out revokes the user's sessions on every device.
- Deleting an account needs a fresh Google re-authentication.

## Project structure

```
app/
  page.tsx                 Landing page
  planner/                 Planner
  shop/, cart/, guides/, plantation/, account/
  api/auth/                Sign in, sign out, current user and account deletion
  api/cart/                Cloud cart read/replace; cart/merge on sign-in
  api/orders/, api/plans/  Save an order / a plan (create only)
components/
  planner/, shop/, cart/, guides/, plantation/, account/, layout/, ui/
contexts/
  language-context.tsx     Current language and t()
  cart-context.tsx         Device cart (localStorage key hvs_cart) and cloud sync
  session-context.tsx      The server-verified user, for client components
  auth-context.tsx         Google sign-in, sign-out, delete
  notification-context.tsx Toast messages
lib/
  data/                    Products, vegetables, guides, plantation (content only)
  i18n/                    UI strings and translation helpers
  planner/calc.ts          Planner calculations (BR-01 to BR-18)
  plantation/calc.ts       Cash flows, NPV, IRR, payback, break-even
  order/whatsapp.ts        Checkout validation and WhatsApp messages
  products.ts              Product codes, prices, cart helpers
  firebase/                Admin and web SDKs, sessions, per-user Firestore paths
  shop-config.ts           The shop's WhatsApp number
__tests__/                 Vitest: lib/ units, api/ routes, client/ components
docs/SRS.md                Requirements
```

## Deploying to Vercel

Vercel detects Next.js and needs no build settings. `vercel.json` only pins the server functions (sign-in, cart sync, orders, plans) to `bom1`, which is Mumbai and the closest region to Sri Lanka. For the lowest latency, create the Firestore database in `asia-south1` (Mumbai) to match. If your database is somewhere else, change the region in `vercel.json` to the one nearest it.

1. **Push to your own GitHub repository.** Create an empty repo, then:
   ```bash
   git remote set-url origin https://github.com/<you>/sl_grow.git
   git push -u origin main
   ```
2. **Import it** at [vercel.com/new](https://vercel.com/new). Keep the detected defaults (Framework: Next.js, build command `next build`).
3. **Environment variables** (Project > Settings > Environment Variables, for Production and Preview). Paste each value exactly as it appears in `.env.local`, on one line:
   - `NEXT_PUBLIC_FIREBASE_WEB_SDK_CONFIG`
   - `FIREBASE_ADMIN_SERVICE_ACCOUNT`. This is secret: keep it out of git and out of anything public.

   Leave both unset to deploy in guest mode, without accounts. `SITE_URL` is not needed: the production domain is picked up from `VERCEL_PROJECT_PRODUCTION_URL`. `NEXT_PUBLIC_` values are built into the page, so **redeploy** after changing one.
4. **Deploy.** After that, every push to `main` redeploys production, and pull requests get preview URLs.
5. **Authorize the domain in Firebase**: add `<project>.vercel.app`, and any custom domain, under Authentication > Settings > Authorized domains. Otherwise Google sign-in fails with `auth/unauthorized-domain`. Preview URLs change on every deploy, so test sign-in on the production domain, or add a preview domain while you test it.

CI (`.github/workflows/ci.yml`) runs lint, tests and a production build on GitHub for every push and pull request, separately from Vercel's own build.

## License

MIT. See [LICENSE](LICENSE). The project started from [zeikar/nextjs-firebase-boilerplate](https://github.com/zeikar/nextjs-firebase-boilerplate).
