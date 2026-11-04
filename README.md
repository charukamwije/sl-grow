# Aswedduma (අස්වැද්දුම)

A web app for Sri Lankan households that want to grow vegetables at home. It works out what a family eats, what that costs at the market, what fits in their space, what to buy, and what they save. Customers buy seedlings, containers and supplies and order them online, paying on delivery or by bank transfer. It has step-by-step grow guides, works in English, Sinhala and Tamil, and has a Plantation section that estimates the return on planting Ceylon cinnamon or tea.

The full requirements are in [docs/SRS.md](docs/SRS.md).

## Features

- **Landing page** (`/`): what the app does, Sri Lanka's Maha and Yala seasons and growing zones, charts built from the planner's data (days to first harvest, value per sq ft), and buttons to the planner and shop.
- **Planner** (`/planner`): four steps covering home, vegetables, amounts and prices. The results show consumption, market cost, a grow plan that fills the space by value per sq ft, a shopping list at shop prices, savings with payback time, and health notes.
- **Shop** (`/shop`): about 50 products in 7 categories, with search and product codes (e.g. `F-COMPOST`).
- **Cart and checkout** (`/cart`): anyone can fill a cart; placing an order needs a Google sign-in. The customer chooses delivery or pickup and pays by **cash on delivery** (or at pickup) or **bank transfer**. Each order gets a short reference such as `ASW-7K3P9Q` and its own page under Account (`/account/orders/<id>`), showing its status. Bank transfer customers see the shop's bank details there and upload a photo or PDF of their transfer slip.
- **Grow guides** (`/guides`): package arrival, soil preparation, and one guide for each of 11 vegetables, with figures and an Add button for each recommended product.
- **Plantation** (`/plantation`): Cinnamon or Tea, entered in hectares or acres. Shows setup cost, payback year, NPV, IRR, break-even price, workers needed and a yearly money table. Every assumption can be edited, and you can send an enquiry on WhatsApp.
- **Guests can browse, plan and fill a cart** without an account; plans they save are kept on their device. Placing an order needs an account. Orders sent on WhatsApp before checkout moved into the app stay listed on the device that sent them.
- **Join** (`/join`): Aswedduma Certified. Three paths (Home Grower, Seeds, Plantation), each running Learn (a free course at `/join/<path>/learn`: 3 modules of 3 picture-led lessons with "Try it" tasks, each module ending in a quiz), Apply (requirements plus an application on WhatsApp with an `APP-` reference) and Get certified (a digital badge issued by the Aswedduma team after review). It is Aswedduma's own programme, not a government certificate.
- **Accounts** (`/account`, optional): Google sign-in, once Supabase is set up. Signed-in customers also get a cloud cart merged across devices, plus order history and saved plans in their account.
- **Languages**: English, සිංහල and தமிழ் for everything except the Plantation section, which is English only for now. WhatsApp enquiries and applications are always in English.

## Getting started

Requirements: Node.js 24 or later (`engines` asks for `>=24.0.0`).

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no Supabase settings the app runs in **guest mode**: the planner, shop, cart, guides and plantation all work, the cart explains that online ordering is not set up, and the Account page says accounts are not set up.

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
| `lib/data/products.ts` | The starting product catalogue (with Supabase set up, products are edited at `/admin/products` instead), the shared supplies added to every plan, and which container each plant size gets |
| `lib/data/vegetables.ts` | Vegetable planning data: price, weekly use, yield, cycles, space, days to harvest, climber or not |
| `lib/data/guides.ts` | The starting grow guides (with Supabase set up, guides are edited at `/admin/guides` instead). Writing `[[product_id]]` in a step shows that product's name and code |
| `lib/data/plantation.ts` | Cinnamon and tea assumptions and growing steps |
| `lib/i18n/strings.ts` | Interface text in the three languages |

A product's customer-facing code comes from its ID (BR-19): `f_compost` becomes `F-COMPOST`. That is why a product's ID cannot be changed once it exists.

**With Supabase set up, the shop's products live in the database.** `0003_products.sql` copies `lib/data/products.ts` into the `products` table once; after that, admins add, edit, hide and delete products and upload photos at `/admin/products`, and editing the file no longer changes the shop. Without Supabase (guest mode) the shop uses the file. Products the planner or a grow guide uses by ID (containers, trellis, shared supplies, soil mix ingredients, seedlings and every product a guide names) can have their price, names and photo changed, but cannot be hidden or deleted.

**Guides work the same way.** `0005_guides.sql` copies `lib/data/guides.ts` into the `guides` table once; after that, admins edit steps in English, Sinhala and Tamil, choose recommended products and add new guides at `/admin/guides`. The built-in guides (package, soil and the 11 vegetables) are linked from the shop, planner and courses, so they can be edited but not hidden or deleted; guides added in the console can be. A guide on show cannot name a product that is hidden or deleted, and every product a guide on show names is protected in turn.

## Accounts (optional): Supabase setup

Accounts need a [Supabase](https://supabase.com) project. Without one, everything except accounts still works.

1. **Create a project** in the Supabase dashboard. Pick the region **South Asia (Mumbai)**, `ap-south-1`, to sit next to the Vercel functions (see [Deploying to Vercel](#deploying-to-vercel)).
2. **Create the tables**: open SQL Editor and run each file in [supabase/migrations/](supabase/migrations/) in order (`0001_init.sql` to `0006_checkout.sql`). Or, with the [Supabase CLI](https://supabase.com/docs/guides/cli), run `supabase link` and then `supabase db push`. Once accounts are configured, the first sign-in fails loudly if the tables are missing.
3. **Create a Google OAuth client** in the [Google Cloud console](https://console.cloud.google.com/apis/credentials): Create credentials > OAuth client ID > Web application. Under **Authorized redirect URIs** add `https://<project-ref>.supabase.co/auth/v1/callback`. The dashboard shows this exact URL under Authentication > Sign In / Providers > Google.
4. **Enable Google in Supabase**: Authentication > Sign In / Providers > Google. Paste the client ID and secret from step 3.
5. **Allow the redirect back to the app**: Authentication > URL Configuration. Set **Site URL** to your production URL. Under **Redirect URLs** add `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback`. Supabase refuses to send the browser anywhere not on this list.
6. **Environment variables**: copy `.env.local.example` to `.env.local` and fill in the values from Project Settings > API Keys:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | The publishable (anon) key. Starts sign-in and reads sessions |
| `SUPABASE_SECRET_KEY` | The secret (service_role) key. Reads and writes the tables and deletes accounts. **Secret**: keep it out of git |
| `SITE_URL` | Optional. Public URL used in metadata and the sitemap |

Set all three Supabase values, or none. Accounts are switched on only when all three are present. All three are read on the server only; none is built into the page.

### How customer data is stored

Only the server reads and writes the database, using the secret key. Row level security is on for every table with no policies, and the browser roles have no privileges, so the publishable key cannot read or write a single row. Each row belongs to one user:

```
carts    user_id -> items: { productId: qty }
orders   user_id, ref, name, phone, method, address, notes, items, total, created_at
plans    user_id, people, space, vegetables, plants, shopping, total, yearly_savings, created_at
```

Every route takes the uid from the verified session, never from the request, so a customer can only reach their own data (FR-A-11). Order prices are recomputed from the catalogue on the server, and so are saved plan totals. Customers cannot edit or delete orders or plans in the app (FR-A-12); shop staff see them at `/admin/orders`, where an order can be found by its `ASW-` reference, phone or name.

**Orders and payment**: a new order is `Created` and unpaid. Admins move it through **Received → Out for delivery** ("Ready for pickup" for pickup orders) **→ Completed**, or **Cancelled**, and mark it **Paid** separately, at `/admin/orders/<id>`; the customer sees each change on their order page. The admin dashboard counts new orders and transfer slips waiting to be checked. Slips are kept in the private `payment-receipts` bucket and shown to admins through links that expire after 10 minutes. Super admins set the bank details customers see at `/admin/settings`; until the bank, account name and number are filled in, customers are told the shop will give them by phone.

**Cart sync**: on sign-in or page load, the device cart is merged into the cloud cart, keeping the larger quantity of each product (BR-20). The `merge_cart` database function does this in one statement, so two devices merging at once cannot lose each other's items. After that, each change is saved. Signing out leaves the device cart in place. Because of this rule, an item removed on one device can come back from another device's cart.

**Account deletion** removes the user from Supabase Auth. Their cart, orders and plans reference the user with `ON DELETE CASCADE`, so they are removed in the same step. The shop already has each order in WhatsApp, but decide on a retention rule before going live (OI-16).

### Roles and the admin console

Every account has one of three roles, stored in the `profiles` table:

| Role | Can do |
| --- | --- |
| Member | Shop, plan and keep a history. Every new sign-in is a member |
| Admin | Use the admin console at `/admin`: manage products and photos, edit and add grow guides, and see every signed-in customer's orders |
| Super admin | Everything an admin can, plus change anyone's role at `/admin/users` |

**Make the first super admin** once, after signing in with your Google account. In SQL Editor, run:

```sql
update public.profiles set role = 'super_admin' where email = 'you@example.com';
```

After that, promote and demote people from `/admin/users`. There is always at least one super admin: the database refuses to demote or delete the last one, and a super admin cannot demote themselves. Every role change is recorded in `audit_log`.

Members and guests get a 404 at `/admin`. Every admin page and action checks the role on the server for itself; the header's Admin link is only a shortcut.

### Session security

- **Server-only sign-in.** The server starts Google sign-in and finishes it at `/auth/callback` with PKCE. The code verifier sits in a cookie in the same browser, so a code sent to anyone else cannot be used.
- **Session cookies.** The session is kept in `httpOnly` cookies (`sb-*`). Pages never see them, and two weeks without a visit ends the session. `proxy.ts` refreshes the access token before each page renders.
- **Verified on every request.** The server checks each session with the Supabase Auth server, so a revoked session is rejected straight away.
- **Cross-site requests.** Every state-changing route rejects them (`Origin` check, plus a JSON content type where there is a body).
- **Sign-out.** Signing out revokes the user's sessions on every device.
- **Account deletion.** Deleting an account needs a Google sign-in from the last 5 minutes. Otherwise the user is sent through Google again and confirms on their return.

## Project structure

```
app/
  page.tsx                 Landing page
  planner/                 Planner
  shop/, cart/, guides/, plantation/, account/
  admin/                   Admin console; every page and action checks the role itself
  api/auth/                Start sign-in, sign out, current user and account deletion
  auth/callback/           Where Google sign-in returns to
  api/cart/                Cloud cart read/replace; cart/merge on sign-in
  api/orders/, api/plans/  Save an order / a plan (create only)
components/
  planner/, shop/, cart/, guides/, plantation/, account/, admin/, layout/, ui/
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
  order/checkout.ts        Checkout validation, order statuses and payment methods
  order/whatsapp.ts        WhatsApp messages for plantation enquiries and applications
  products.ts              Product codes, prices, cart helpers
  supabase/                Session and service-role clients, sessions, per-user queries
  shop-config.ts           The shop's WhatsApp number
__tests__/                 Vitest: lib/ units, api/ routes, client/ components
docs/SRS.md                Requirements
supabase/migrations/       Database tables, row level security and merge_cart
proxy.ts                   Refreshes the Supabase session before each page renders
```

## Deploying to Vercel

Vercel detects Next.js and needs no build settings. `vercel.json` only pins the server functions (sign-in, cart sync, orders, plans) to `bom1`, which is Mumbai and the closest region to Sri Lanka. For the lowest latency, create the Supabase project in `ap-south-1` (Mumbai) to match. If your database is somewhere else, change the region in `vercel.json` to the one nearest it.

1. **Push to your own GitHub repository.** Create an empty repo, then:
   ```bash
   git remote set-url origin https://github.com/<you>/sl_grow.git
   git push -u origin main
   ```
2. **Import it** at [vercel.com/new](https://vercel.com/new). Keep the detected defaults (Framework: Next.js, build command `next build`).
3. **Environment variables** (Project > Settings > Environment Variables, for Production and Preview). Paste each value exactly as it appears in `.env.local`, on one line:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`. This is secret: keep it out of git and out of anything public.

   Leave all three unset to deploy in guest mode, without accounts. `SITE_URL` is not needed: the production domain is picked up from `VERCEL_PROJECT_PRODUCTION_URL`.
4. **Deploy.** After that, every push to `main` redeploys production, and pull requests get preview URLs.
5. **Allow the domain in Supabase**: under Authentication > URL Configuration > Redirect URLs, add `https://<project>.vercel.app/auth/callback` and the same for any custom domain. Otherwise Supabase sends the browser to the Site URL instead of back to this deployment. Preview URLs change on every deploy. To test sign-in on previews, add a wildcard such as `https://*-<team>.vercel.app/**`, or test on the production domain.

CI (`.github/workflows/ci.yml`) runs lint, tests and a production build on GitHub for every push and pull request, separately from Vercel's own build.

## License

MIT. See [LICENSE](LICENSE). The project started from [zeikar/nextjs-firebase-boilerplate](https://github.com/zeikar/nextjs-firebase-boilerplate) and has since moved to Supabase.
