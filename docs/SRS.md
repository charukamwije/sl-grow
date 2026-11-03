# Software Requirements Specification (SRS): Aswedduma (අස්වැද්දුම)

Version 3.5 · Nov 3, 2026 · Prepared by Charuka Wijethunga

## Revision history

| Version | Date | Author | Summary |
| --- | --- | --- | --- |
| 1.0 | 2026-11-02 | Charuka Wijethunga | First full SRS: planner, shop, cart, WhatsApp checkout, grow guides, Sinhala and Tamil. |
| 2.0 | 2026-11-02 | Charuka Wijethunga | Added Google sign-in and accounts (Firebase), cloud cart, order history and saved plans. |
| 3.0 | 2026-11-02 | Charuka Wijethunga | Added Plantation investment (Cinnamon and Tea). Planner and Plantation are now step by step. |
| 3.1 | 2026-11-02 | Charuka Wijethunga | Matched the built architecture: a Next.js app whose server alone talks to Firestore, replacing the single static HTML file. Merged the v2 and v3 additions into their sections and removed scope statements they had overtaken. |
| 3.2 | 2026-11-02 | Charuka Wijethunga | Named the product Aswedduma (අස්වැද්දුම), previously "Home Veggie Shop & Planner". |
| 3.3 | 2026-11-02 | Charuka Wijethunga | Guests can use every function. Each order gets a short reference (FR-O-07). Guests' orders and plans are kept on their device (FR-A-07, 4.5). |
| 3.4 | 2026-11-03 | Charuka Wijethunga | Added the Join page: Aswedduma Certified, with Learn, Apply and Get certified steps and digital badges for home growers, seeds and plantations (3.15). |
| 3.5 | 2026-11-03 | Charuka Wijethunga | Each certification path is now a full free course: 3 modules of 3 lessons, each module ending in a quiz, in a course player (FR-J-02, FR-J-03, FR-J-07). |

## 1. Introduction

### 1.1 Purpose

This document specifies the functional and non-functional requirements of Aswedduma (අස්වැද්දුම), a home vegetable garden shop and planner: a web application for Sri Lankan households. It helps a household plan a home vegetable garden, estimate its food cost, buy the seeds, seedlings, containers and supplies it needs, follow step-by-step grow guides, and send the order to the shop through WhatsApp. It also helps a plantation investor estimate the return on planting Ceylon cinnamon or tea.

### 1.2 Scope

In scope:

- Garden planner, step by step (household consumption, cost, space-based grow plan, shopping list, savings, health notes)
- Shop catalogue with search, categories and product codes
- Cart stored in the browser, and in the customer's account when signed in
- Checkout that opens a pre-filled WhatsApp order message
- Grow guides for package arrival, soil preparation and 11 Sri Lankan vegetables
- English, Sinhala and Tamil language support
- Optional customer accounts with Google sign-in: cloud cart, order history and saved plans
- Plantation investment estimates for Cinnamon and Tea, step by step

Out of scope:

- Online payment
- Stock level tracking
- Automatic delivery charge calculation
- Admin dashboard for editing products (products are edited in code)
- Shipment tracking
- Editing or deleting orders and plans in the app (shop staff use the Firebase console)

### 1.3 Definitions

| Term | Meaning |
| --- | --- |
| LKR | Sri Lankan rupee |
| sq ft | Square feet of growing area |
| Cycle | One planting-to-harvest period. Cut-and-come-again crops have many cycles per year |
| Product code (SKU) | Code shown to customers, made from the product ID in upper case with the first underscore replaced by a hyphen, e.g. F-COMPOST |
| Seedling | A young plant bought ready to transplant |
| Hardening off | Gradually moving seedlings from shade to full sun before planting |
| Grow bag | Fabric or plastic bag used as a planting container |
| Home coverage | Share of a household's yearly need for a vegetable that the garden can supply |
| Guest mode | Using the app without signing in, or on a deployment without Firebase configured |
| NPV, IRR | Net present value; internal rate of return |

### 1.4 References

- Product catalogue, vegetable planning data, guide content and plantation assumptions (data files under `lib/data/`)
- Google Fonts: Noto Sans Sinhala and Noto Sans Tamil, bundled at build time
- WhatsApp click-to-chat link format (https://wa.me/\<number>?text=\<message>)
- Firebase Authentication and Cloud Firestore

### 1.5 Conventions

Requirement IDs: FR = functional, NFR = non-functional, BR = business rule, AC = acceptance criterion. Priority: M = must have, S = should have, C = could have.

## 2. Overall Description

### 2.1 Product perspective

The product is a Next.js web application. Calculations, the catalogue and the guides all run in the browser. The cart is saved in the browser's local storage. A small server verifies sign-in sessions and is the only part that reads and writes Firestore, through the Firebase Admin SDK. Without Firebase settings, the app runs entirely in guest mode.

### 2.2 User classes

| User | Description | Main needs |
| --- | --- | --- |
| Household gardener (primary) | Lives in a house, balcony or flat. Mostly uses a mobile phone. May prefer Sinhala or Tamil | Know what to grow, cost, space, buy the right items, follow simple steps |
| Shop owner or staff (secondary) | Receives WhatsApp orders and maintains prices and products | Clear order messages with product codes, accurate prices |
| Plantation investor | A person or company that wants to plant cinnamon or tea. Uses the Plantation section only | Setup cost, payback, return, workers, how to start |

### 2.3 Operating environment

- Browsers: current and previous major versions of Chrome, Edge, Safari and Firefox
- Devices: Android and iOS phones (minimum width 320 px), tablets and desktop computers
- Server: any Node.js 24+ host that runs Next.js (e.g. Vercel)
- An internet connection is needed to load the app, send the WhatsApp order and use accounts

### 2.4 Design and implementation constraints

- Next.js (App Router), React and TypeScript, styled with Tailwind CSS
- Firestore is reached only from the server through the Admin SDK. Firestore security rules deny all browser access
- All currency in LKR, formatted for the en-LK locale
- Shop WhatsApp number is set in code (`OWNER_WHATSAPP` in `lib/shop-config.ts`)
- Products, vegetables, guides, plantation assumptions and interface text are kept in data files

### 2.5 Assumptions and dependencies

- Prices, yields and growing times are estimates until the shop confirms them
- Customers have WhatsApp on their phone
- The shop owner checks each WhatsApp order manually and confirms delivery charges
- Accounts depend on a Firebase project with Google sign-in and Firestore enabled

## 3. Functional Requirements

### 3.1 Household and space input (Planner)

**Step by step.** The planner asks for details in four steps: (1) your home, with people and space; (2) the vegetables you eat, chosen with tick boxes; (3) the weekly amount and market price for the chosen vegetables; (4) your plan. Back and Next move between steps. Next is blocked when the space is 0 or no vegetable is chosen. The current step is always shown.

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-P-01 | The user shall enter the number of household members (whole number, minimum 1, default 4). | M |
| FR-P-02 | The user shall enter the growing space available in sq ft (minimum 0, default 60). | M |
| FR-P-03 | The user shall choose which vegetables to include using a checkbox. All are selected by default. | M |
| FR-P-04 | The user shall edit the market price (LKR per kg) for each vegetable. | M |
| FR-P-05 | The user shall edit the weekly consumption per person (grams) for each vegetable. | M |
| FR-P-06 | The system shall calculate and display the plan when the user presses Calculate my plan (end of step 3). | M |
| FR-P-07 | Empty or invalid number inputs shall be treated as 0, and the system shall not crash. | S |

### 3.2 Consumption and market cost

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-P-08 | The system shall show weekly consumption (kg) per vegetable and for the whole household. | M |
| FR-P-09 | The system shall show monthly market cost per vegetable and in total, and the yearly market cost. | M |

### 3.3 Grow plan

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-P-10 | The system shall calculate the number of plants needed for full coverage of each selected vegetable. | M |
| FR-P-11 | The system shall allocate the available space to vegetables in order of value per sq ft, highest first. | M |
| FR-P-12 | For each vegetable the system shall show plants planted and plants needed, space used, container, home coverage percentage and harvest pattern. | M |
| FR-P-13 | The system shall show the total space needed for full coverage of all selected vegetables. | M |
| FR-P-14 | The system shall show planting tips for small spaces. | S |

### 3.4 Shopping list from the plan

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-P-15 | The system shall build a shopping list containing seedlings (one per planted plant), containers (one per planted plant), a trellis net if any climbing crop is planted, and the shared supplies. | M |
| FR-P-16 | Prices in the shopping list shall come from the shop catalogue, not from market prices. | M |
| FR-P-17 | The system shall show each line with product name, product code, quantity, unit price and line total, and a total. | M |
| FR-P-18 | The 'Add this plan to cart' button shall add every line to the cart and open the cart. | M |

### 3.5 Savings

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-P-19 | The system shall show monthly savings, yearly savings, starting setup cost and payback time. | M |
| FR-P-20 | The system shall explain the savings assumptions on screen (see BR-09 to BR-14). | S |

### 3.6 Health benefits

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-P-21 | The system shall show the daily vegetable intake per person (grams), the yearly home harvest (kg), and a short nutrition note for each selected vegetable. | M |
| FR-P-22 | The system shall show a disclaimer that the notes are general and not medical advice. | M |

### 3.7 Shop

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-S-01 | The system shall display all products with icon, name, category, unit, price and product code. | M |
| FR-S-02 | The user shall filter products by category and search by name (current language and English). | M |
| FR-S-03 | The user shall add a product to the cart and change its quantity from the product card. | M |
| FR-S-04 | Seedling products shall show a Grow guide button that opens the matching guide. | S |
| FR-S-05 | When no product matches, the system shall show a 'no products' message. | S |

### 3.8 Cart

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-C-01 | The cart shall list each item with product name, code, unit price, quantity controls, line total and a Remove button. | M |
| FR-C-02 | The cart shall show the total before delivery. | M |
| FR-C-03 | The cart shall be saved in the browser so that it remains after the page is reloaded. | M |
| FR-C-04 | When the cart is empty, the system shall show an empty-cart message and hide the checkout form. | M |
| FR-C-05 | The cart shall link to the grow guides. | S |
| FR-C-06 | The cart count shall appear next to the Cart tab at all times. | S |

### 3.9 Checkout and order

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-O-01 | Name and phone number are required before an order can be sent. | M |
| FR-O-02 | The customer shall choose Pickup or Delivery. Delivery requires an address. | M |
| FR-O-03 | Notes are optional. | S |
| FR-O-04 | Sending the order shall open WhatsApp (wa.me link to the shop number) with a pre-filled message containing customer name, phone, method, address (if delivery), each item with product code, quantity and line total, total before delivery, and notes. | M |
| FR-O-05 | The order message shall be in English, whatever language the customer uses. | M |
| FR-O-06 | A guest's order shall not be stored on any server; the shop receives it only through WhatsApp. A signed-in customer's order is also saved to their account (FR-A-05). | M |
| FR-O-07 | Each order shall get a short reference, e.g. ASW-7K3P9Q: "ASW-" and six characters that cannot be misread (no 0/O, 1/I/L or U/V). It shall appear in the WhatsApp message, on screen after sending (with a Copy button) and on the Account page. The customer quotes it to the shop to follow up. | M |

### 3.10 Grow guides

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-G-01 | The Grow guide tab shall list all guides and let the user select one. | M |
| FR-G-02 | Guides shall include: Package arrival and setup (7 steps), Soil preparation (10 steps), and one guide per vegetable (11 vegetables, 6 to 10 steps each). | M |
| FR-G-03 | Each vegetable guide shall show space needed per plant, starting cost for one plant, seedling cost per year, days to first harvest, harvest per plant per year, and market value per year. | M |
| FR-G-04 | The package and soil guides shall show their own relevant figures (setup cost; mix cost per bag; readiness time). | M |
| FR-G-05 | Each guide shall list its recommended products with product code, price and an Add button. | M |
| FR-G-06 | Product names mentioned inside guide steps shall show the product name and product code. | S |
| FR-G-07 | Guides shall be reachable from the shop (seedling cards), from the cart, and from the top navigation. | S |

### 3.11 Language

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-L-01 | The user shall choose English, Sinhala (සිංහල) or Tamil (தமிழ்) from buttons at the top of every page. | M |
| FR-L-02 | Changing language shall update all visible text, including product names, vegetable names, guide steps, planner results and form labels. The Plantation section is English only until translated (OI-20). | M |
| FR-L-03 | The WhatsApp order message shall remain in English (see FR-O-05). | M |
| FR-L-04 | The default language shall be English. | M |

### 3.12 Messages

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-M-01 | The system shall show short confirmation or validation messages (for example, items added to cart, name missing, address missing). | S |

### 3.13 Accounts (Google sign-in)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-A-01 | Signed-out users shall see a Sign in button in the header and a sign-in card on the Account page. | M |
| FR-A-02 | Customers shall sign in with their Google account (Firebase Authentication, Google provider) using a popup window. | M |
| FR-A-03 | After sign-in the header shows the customer's first name. The Account page shows name, email and photo. | M |
| FR-A-04 | The cart shall be saved to the customer's account after each change. On sign-in, the cloud cart shall be merged with the device cart, keeping the larger quantity for each product (BR-20). | M |
| FR-A-05 | When a signed-in customer sends an order, the order shall be saved with their user ID, customer details, items with codes, quantities and prices, method, and total (BR-21). | M |
| FR-A-06 | The Account page shall list the customer's own orders, newest first, with date, items and total. | M |
| FR-A-07 | Anyone can save a plan. A guest's plan is saved on their device and listed on the Account page; a signed-in customer's plan is saved to their account (FR-A-08). | M |
| FR-A-08 | Signed-in customers can save planner results and see them under My saved plans, with date, people, space and total. | M |
| FR-A-09 | Signing out returns the app to guest mode. The device cart stays on the device. | S |
| FR-A-10 | If Firebase is not configured, the Account page shall show a setup message, and the rest of the app shall work in guest mode. | M |
| FR-A-11 | A customer shall be able to read only their own cart, orders and plans. The server shall enforce this by taking the user ID only from the verified session; Firestore rules deny all browser access. | M |
| FR-A-12 | Customers cannot edit or delete orders or plans in the app. Shop staff manage them in the Firebase console. | M |
| FR-A-13 | A customer may delete their account after re-authenticating with Google. This removes their cart, orders and saved plans. | S |

Guest customers' details are used only to create the WhatsApp message and are not stored.

### 3.14 Plantation investment (Cinnamon and Tea)

The Plantation section is for large-scale planting. It shows investment results instead of household consumption. All figures are placeholders until they are checked (OI-19).

**Step by step.** (1) Choose the crop; (2) enter the land size; (3) see the result, with the option to send an enquiry; (4) read how to grow the crop, one step at a time.

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-I-01 | The user shall choose Cinnamon (Ceylon) or Tea (Ceylon). | M |
| FR-I-02 | The user shall enter the land size in hectares or acres (1 ha = 2.47 acres). Next is blocked when the size is 0 or less. | M |
| FR-I-03 | The result shall show setup investment, payback year, net present value (NPV), internal rate of return (IRR), break-even price per kg, workers needed and a yearly money table. | M |
| FR-I-04 | Under Advanced settings the user shall set the discount rate (default 12%) and the analysis period (5 to 40 years, default 15). | S |
| FR-I-05 | Every cost, yield, price and timing assumption shall be editable, and all results shall update at once. | M |
| FR-I-06 | The growing guide shall show six steps for the chosen crop, one at a time. | M |
| FR-I-07 | The user shall send an enquiry (crop and land size) to the shop's WhatsApp. | M |
| FR-I-08 | The section shall show a disclaimer that figures are planning estimates, not financial or agricultural advice. | M |

### 3.15 Join: Aswedduma Certified

The Join page (`/join`) is a learning and certification programme with three paths: **Certified Home Grower**, **Certified Seeds** and **Certified Plantation**. Each path runs Learn → Apply → Get certified and ends in a digital badge.

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-J-01 | The page shall offer the three paths, each with who it is for and its badge. Choosing a path shows its journey. | M |
| FR-J-02 | Learn shall be a free course for each path: 3 modules of 3 lessons, each lesson with a picture, three short points, a "Try it" task, a link to a matching guide or tool where one exists, and a Listen button. The Join page shows the course outline with Start, Continue (at the first unfinished module) or Review. | M |
| FR-J-03 | Each module shall end in a quiz that must be answered fully correctly; a wrong attempt shows the score. Passing completes the module on the device. The application stays locked until every module is complete. | M |
| FR-J-04 | Apply shall list the path's practical requirements and collect name, phone, district or town and optional notes. Sending opens WhatsApp with an application reference (e.g. APP-7K3P9Q), the path and the details. The reference is shown on screen with a Copy button and listed under Your applications. | M |
| FR-J-05 | Get certified shall preview the path's digital badge with the applicant's name and a placeholder certificate ID. Badges and certificate IDs are issued by the Aswedduma team after review. | M |
| FR-J-06 | The page shall state that Aswedduma Certified is Aswedduma's own programme, not a government certificate, and does not replace official seed certification by the Department of Agriculture. | M |
| FR-J-07 | The course player (`/join/<path>/learn`) shall show the outline with completed modules ticked, overall progress, one lesson at a time with big Back and Next buttons, and a finish screen with the badge and a link to apply. It shall resume at a given module (`?module=n`). | M |

## 4. Data Requirements

### 4.1 Product catalogue

Each product record contains: ID, category, names in English, Sinhala and Tamil, unit, icon, price in LKR and, for seedlings, the linked vegetable ID. Categories: Seedlings, Seeds, Containers, Supports, Fertilizers, Crop protection, Tools. The catalogue has about 50 products (`lib/data/products.ts`).

### 4.2 Vegetable planning data

Each vegetable record contains: ID, names and health note in three languages, default market price (LKR/kg), default weekly consumption per person (g), yield per plant per cycle (kg), cycles per year, space per plant (sq ft), days to first harvest, and whether it is a climbing crop (`lib/data/vegetables.ts`).

### 4.3 Shared supplies

A fixed list included in every grow plan: compost (1 bag), organic fertilizer (2 kg), neem oil (1 bottle), watering can (1), pruning shears (1).

### 4.4 Guide content

Each guide contains names and, for the package and soil guides, time text in three languages; a list of steps (stage title and instruction in three languages); and a list of recommended product IDs (`lib/data/guides.ts`).

### 4.5 Stored browser data

- Key `hvs_cart`: JSON map of product ID to quantity
- Key `aswedduma_orders`: the last 50 orders sent from this device, each with its reference, date, method, items (code, name, quantity, line total) and total
- Key `aswedduma_plans`: the last 50 plans a guest saved, each with an ID, date, people, space and shopping-list total
- Key `aswedduma_learning`: the certification paths whose knowledge check was passed on this device, with the date
- Key `aswedduma_applications`: certification applications sent from this device, each with its reference, path and date
- No other data is saved in the browser. The customer's name, phone, address and notes are never saved on the device.

### 4.6 Data sensitivity

For guests, the system collects customer name, phone number and address only to create the WhatsApp message and does not store them. For signed-in customers, the same details are stored with each order in their account (4.7). A privacy notice and consent text are still to be written (OI-15).

### 4.7 Cloud data (Firestore)

All paths sit under the customer's own user document. Only the server reads or writes them.

| Path | Stored data | Who can read | Who can write |
| --- | --- | --- | --- |
| users/{uid}/meta/cart | Cart items and quantities | Owner only | Owner only |
| users/{uid}/orders/{id} | Customer details, items, total, method, time | Owner only (staff in console) | Owner creates; no edit or delete in the app |
| users/{uid}/plans/{id} | Saved planner inputs and result | Owner only | Owner creates; no edit or delete in the app |

Deleting an account removes the whole `users/{uid}` tree (FR-A-13).

## 5. External Interface Requirements

### 5.1 User interface

- Header with title, language buttons, Sign in or the customer's first name, and navigation tabs: Planner, Shop, Grow guide, Cart (with item count), Plantation, Account
- Mobile-first layout; works from 320 px width
- Tables scroll sideways on small screens rather than breaking the layout
- Toast messages appear at the bottom of the screen

### 5.2 Hardware interfaces

None beyond the device screen and touch or keyboard input.

### 5.3 Software interfaces

- Firebase Authentication: Google sign-in popup (browser) and session verification (server)
- Cloud Firestore: cart, orders and saved plans for signed-in customers, through the server only
- WhatsApp: click-to-chat link (wa.me) opens a new tab with the order or enquiry text
- Browser local storage: saves the cart

### 5.4 Communication interfaces

Planner, plantation and cart calculations happen in the browser. The browser calls the app's own server only for sign-in, sign-out, account deletion, cart sync, saving orders and saving plans, all over HTTPS to the same origin.

## 6. Non-Functional Requirements

| ID | Category | Requirement |
| --- | --- | --- |
| NFR-01 | Performance | Calculating and rendering the plan for all 11 vegetables shall take under 1 second on a typical mid-range phone. |
| NFR-02 | Usability | Every main function (plan, shop, guide, cart, checkout, plantation, account) shall be reachable in one tap from the top navigation. |
| NFR-03 | Usability | Customer-facing text shall be readable in all three languages with no text overflow on a 320 px screen. |
| NFR-04 | Accessibility | Main text shall meet WCAG 2.1 AA colour contrast. Form fields shall have labels. |
| NFR-05 | Localization | Numbers and currency shall use the en-LK format. Text shall switch without reloading the page. |
| NFR-06 | Reliability | Reloading the page shall keep the cart. Invalid planner inputs shall not stop the application. |
| NFR-07 | Security | Guest data shall not be sent to any server. Signed-in customers' data shall be reachable only by its owner. State-changing requests shall be same-origin only. Customer input shall not be inserted as HTML. |
| NFR-08 | Privacy | The application shall not use tracking or third-party analytics. Fonts are served from the app itself; the only third-party requests are Google sign-in and WhatsApp. |
| NFR-09 | Portability | The application shall work in the latest two versions of major browsers. |
| NFR-10 | Maintainability | Prices, products, vegetables, guide text and plantation assumptions shall be in clearly marked data files so they can be edited without changing logic. |
| NFR-11 | Deployability | The application shall build with `npm run build` and run on any Node.js host that supports Next.js. Without Firebase settings it shall still run, in guest mode. |

## 7. Business Rules and Calculations

**Consumption**

- BR-01: Annual need (kg) = grams per person per week / 1000 x people x 52
- BR-02: Weekly consumption shown = annual need / 52

**Plant requirement**

- BR-03: Yield per plant per year (kg) = yield per cycle x cycles per year
- BR-04: Plants needed = ceiling (annual need / yield per plant per year)
- BR-05: Space needed for full coverage = plants needed x space per plant

**Space allocation**

- BR-06: Value per sq ft = (price x yield per plant per year) / space per plant
- BR-07: Vegetables are sorted by value per sq ft, highest first (ties keep catalogue order). Each receives plants = min(plants needed, floor(remaining space / space per plant)). Remaining space is reduced after each vegetable.
- BR-08: Home coverage = plants x yield per plant per year / annual need, capped at 100%

**Savings**

- BR-09: Covered value (LKR/yr) = sum of covered kg x market price
- BR-10: Seedling cost per year = sum of plants x seedling price x cycles per year
- BR-11: Running cost (LKR/yr) = seedling cost + 10% of covered value (fertilizer and water allowance)
- BR-12: Setup cost = all shop line items that are not seedlings (containers, trellis, shared supplies)
- BR-13: Yearly savings = covered value - running cost - (setup cost / 3). Setup is assumed to last 3 years
- BR-14: Payback (months) = setup cost / ((covered value - running cost) / 12), rounded up. Shown only if positive

**Shopping list**

- BR-15: Containers are chosen by space per plant: 2 sq ft or more = Grow bag 15 L; 1 to under 2 sq ft = Plastic pot 12 in; under 1 sq ft = Plastic pot 8 in
- BR-16: One trellis net is added if any climbing vegetable is planted
- BR-17: Line total = shop unit price x quantity. Cart total = sum of line totals

**Health**

- BR-18: Daily intake per person (g) = sum of weekly grams of selected vegetables / 7

**Product codes**

- BR-19: Product code = product ID in upper case, first underscore replaced by hyphen

**Accounts**

- BR-20: On sign-in, the cloud cart and device cart are merged. For each product the larger quantity is kept.
- BR-21: A saved order records customer name, phone, method, address, notes, items (code, name, quantity, price, line total) and total. Names, codes and prices are taken from the catalogue on the server. It is stored only for signed-in customers.

**Plantation**

- Years run from 0 (setup) to the analysis period N. Year 0 carries only the setup cost.
- Revenue in year t = yield × hectares × price × ramp. The ramp is 0 before the first harvest year, 0.5 in the first harvest year and 1 after it.
- Upkeep in year t (t ≥ 1) = upkeep before the first harvest (years before it) or after it (the first harvest year and later), × hectares.
- Net cash flow = revenue − upkeep − setup. Cumulative cash = running total of net cash flow.
- NPV = sum of net(t) ÷ (1 + rate)^t.
- IRR is the rate at which NPV = 0, found by bisection. None is shown if the cash flows never change sign.
- Payback year is the first year the cumulative cash is 0 or more.
- Break-even price = price − NPV ÷ PV of quantity. NPV is linear in price, so this is the price at which NPV = 0.
- Workers needed = workers per hectare × hectares.

## 8. Acceptance Criteria

| ID | Scenario | Expected result |
| --- | --- | --- |
| AC-01 | Open the planner with default values and go through to Calculate | Consumption, grow plan, shopping list, savings and health sections all appear. Shopping list uses shop prices |
| AC-02 | Set the space too small for any plant and calculate | No vegetables planted. Message 'space too small' is shown. Shopping list is hidden |
| AC-03 | Press Add this plan to cart | All plan lines appear in the cart with correct quantities. Cart tab opens |
| AC-04 | Add an item, reload the page | The item is still in the cart |
| AC-05 | Send an order without a name | Message asks for name and phone. No WhatsApp window opens |
| AC-06 | Choose Delivery and leave address empty | Message asks for an address. No WhatsApp window opens |
| AC-07 | Send a valid order | A WhatsApp window opens with the shop number, customer details, product codes and total |
| AC-08 | Switch to Sinhala | Labels, product names, vegetable names, guides and planner results show Sinhala. Order message still in English |
| AC-09 | Open Grow guide for Tomato | Stats strip (space, cost, harvest) and 9 steps appear, with product table and Add buttons |
| AC-10 | Press Add in a guide product table | Item is added to the cart and the cart count increases |
| AC-11 | Search 'chili' in the shop | Green chili products are shown. Non-matching products are hidden |
| AC-12 | Shop WhatsApp number still set to placeholder | Cart shows the warning about the owner setting the number |
| AC-13 | Sign in with Google | Account page shows name, email and photo. Header shows the first name |
| AC-14 | Add items on device A while signed in, then sign in on device B | Device B cart shows the same items with the larger quantities |
| AC-15 | Send an order while signed in | Order appears in My orders with items and total. WhatsApp window opens |
| AC-16 | Signed in as customer A, try to read customer B's order | Access denied |
| AC-17 | Send an order as a guest | WhatsApp window opens. No order is saved to any account |
| AC-18 | Press Save this plan as a guest | Message confirms the plan was saved on the device. It is listed under My saved plans on the Account page |
| AC-19 | Firebase not configured | Account page shows the setup message. Shop works in guest mode |
| AC-20 | Planner step 1 with space 0, then Next | Message asks for the space. Step does not change. Back returns to the previous step |
| AC-21 | Planner step 2 with no vegetable ticked, then Next | Message asks for a vegetable. Step does not change |
| AC-22 | Plantation: change the land size | All four result cards update at once. Payback and NPV match a hand calculation for one case |
| AC-23 | Plantation: send an enquiry | WhatsApp opens with the crop and land size in the message |
| AC-24 | Send an order as a guest | WhatsApp message and the confirmation on screen show the same ASW- reference. The Account page lists the order under that reference |

## 9. Open Issues and Future Work

| ID | Issue | Owner | Priority |
| --- | --- | --- | --- |
| OI-01 | Confirm all prices, yields, cycles and growing times with local growers and suppliers | Shop owner | High |
| OI-02 | Replace the placeholder WhatsApp number 94XXXXXXXXX | Shop owner | High |
| OI-03 | Decide whether the cart is emptied after an order is sent | Shop owner | Medium |
| OI-04 | Define delivery charges and whether they are shown to the customer | Shop owner | Medium |
| OI-05 | Have Sinhala and Tamil text reviewed by professional translators and local growers | Shop owner | High |
| OI-06 | Review growing advice for accuracy (fertilizer amounts, pest control, harvest timing) | Agronomist | High |
| OI-07 | Add a privacy note explaining how customer phone numbers and addresses are used (a short note is shown at checkout and sign-in) | Shop owner | High |
| OI-08 | Add disclaimers for health claims on vegetable notes and pesticide use on product labels | Shop owner | Medium |
| OI-09 | Future: admin page to edit products and prices without code | Developer | Later |
| OI-10 | Future: store guest orders and track order status | Developer | Later |
| OI-11 | Future: stock levels and out-of-stock messages | Developer | Later |
| OI-12 | Future: remember language and planner inputs on the device | Developer | Later |
| OI-13 | Future: online payment (only if the shop chooses it) | Shop owner | Later |
| OI-14 | Deploy the deny-all Firestore security rules. (No composite index is needed: history is ordered within each customer's own collection.) | Developer | High |
| OI-15 | Write a customer privacy notice and consent text, shown before sign-in and checkout | Shop owner | High |
| OI-16 | Confirm how long order and plan records are kept, including accounting needs. Account deletion currently removes the customer's orders too | Shop owner | High |
| OI-17 | Test Google sign-in on target phones and in in-app browsers. Add a redirect fallback if the popup is blocked | Developer | Medium |
| OI-18 | Confirm the Firebase billing plan and expected monthly usage | Shop owner | Medium |
| OI-19 | Validate all plantation figures (costs, yields, prices, timing) with the Sri Lanka Tea Board, the Export Development Board, the Tea Research Institute, an agronomist and an accountant | Shop owner | High |
| OI-20 | Translate the Plantation section into Sinhala and Tamil | Translation reviewer | Medium |
| OI-21 | Set the real Firebase project settings (`FIREBASE_ADMIN_SERVICE_ACCOUNT`, `NEXT_PUBLIC_FIREBASE_WEB_SDK_CONFIG`) in the hosting environment | Developer | High |
| OI-22 | Translate the sign-in, sign-out and account deletion status messages, which are English only | Translation reviewer | Low |
| OI-23 | Certificates: decide who reviews applications, the germination and field standards for each path, and how certificate IDs are issued and verified (a public verification page needs the database) | Shop owner | High |

## 10. Approval

| Role | Name | Signature | Date |
| --- | --- | --- | --- |
| Product owner (shop owner) |  |  |  |
| Developer |  |  |  |
| Agronomy reviewer |  |  |  |
| Translation reviewer |  |  |  |

## Appendix A: Product Code Examples

| Product ID | Product code | Name (English) |
| --- | --- | --- |
| s\_tomato | S-TOMATO | Tomato seedling (Thakkali) |
| f\_compost | F-COMPOST | Compost (10 kg bag) |
| k\_gb15 | K-GB15 | Grow bag 15 L |
| t\_ph | T-PH | Soil pH meter |
| c\_neem | C-NEEM | Neem oil (500 ml) |
