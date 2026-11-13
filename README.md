# VELTRÉ Store

A full e-commerce web app for a women's dress boutique. Customers register, shop, check out and track orders; the store owner manages everything from an admin dashboard. Orders are saved in MongoDB and sent to the seller on WhatsApp for confirmation. No online payment is taken.

> **VELTRÉ is a working name.** Change it any time in **Admin → Settings → Store**.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| UI | Tailwind CSS v4, Radix UI (dialogs, menus, select, tabs, accordion, radio, switch, checkbox, toasts), Lucide icons |
| API | Serverless REST route handlers in `src/app/api` (one function per route on Vercel) |
| Database | MongoDB (official Node driver), validated with zod |
| Auth | Email + password (bcrypt), httpOnly session cookies stored as SHA-256 hashes, rate limiting |
| Web app | Installable PWA: manifest, icons, service worker, offline page, mobile tab bar |

**About Bits UI:** Bits UI is a Svelte library and can't run in React or Next.js. Radix UI is its React equivalent, so it's used here.

## Features

**Storefront:** home page (hero, featured, collections, new arrivals), shop with search, collection/size/colour/price/stock/sale filters, sorting and pagination done in the database, product pages with colour-specific galleries, per-size stock and "only X left" warnings, collections, about and contact pages, and a cart drawer. Everything comes from the database, and the store shows tidy empty states until you add products.

**Accounts:** register, log in, log out, edit profile and default delivery address, change password (signs out other devices), order history and order tracking with a status timeline. **Login is required to check out.** A guest cart is kept and merged into the account at login, and the cart syncs across devices.

**Checkout:**
1. Prices and stock are re-checked on the server.
2. Stock is reserved atomically, so two people can't buy the last item.
3. The order is saved with a number like `VLT-261016-K7QZ2M`.
4. WhatsApp opens with the full order summary and a link for you to manage the order.
5. The order page always has a "Send on WhatsApp" button in case the pop-up was blocked.
6. Customers can cancel while an order is still pending; stock is returned automatically.

**Admin (`/admin`):**
- **Dashboard:** pending orders, 30-day orders and value, customers, low-stock alerts, recent orders.
- **Orders:** filter and search; move orders through pending → confirmed → processing → shipped → delivered or cancelled. Only valid transitions are allowed, and cancelling returns stock. Add notes customers can see, mark orders paid, and message the customer on WhatsApp.
- **Products:** photo upload (compressed in the browser, stored as base64), description, details, fit, price and sale price, sizes, colours with optional photos per colour, a colour × size stock grid, and status (active, draft, archived), featured and new.
- **Collections:** name, link, description, cover image, order.
- **Customers:** order count and total spent; make or remove admins; set a temporary password; disable accounts.
- **Settings:** brand name, tagline, WhatsApp number, delivery fee, delivery/payment/exchange text, contact details, social links, homepage hero and About page (with images), order number prefix, low-stock threshold, max quantity per item.

## Run it locally

Requirements: **Node.js 20+** and **MongoDB** (installed locally, or a free MongoDB Atlas cluster).

```bash
npm install
cp .env.example .env.local        # then edit if needed
sudo systemctl start mongod       # if using local MongoDB
npm run dev                       # http://localhost:3000
```

### Create the first admin

Either:
- put your email in `ADMIN_EMAILS` in `.env.local`, restart, and **register** at `/register` with that email, or
- run `npm run create-admin` and follow the prompts. It creates a new admin or promotes an existing account.

### Sample catalog (optional)

`npm run seed` adds 4 collections, 26 dresses, rompers and playsuits (with front and back photos, colours, sizes and stock) and the homepage hero and About images to the database in `MONGODB_URI`. It refuses to run if products already exist. `npm run seed -- --replace` swaps the catalog for the sample one; orders, customers and your settings text are kept. Edit `scripts/seed/catalog.ts` to change the sample data.

Then open **`/admin`** and:
1. **Settings:** check the WhatsApp number (`233599967302` is set), delivery and payment text, contact details and socials; upload a hero image.
2. **Collections:** create your collections.
3. **Products:** add your products with photos, sizes, colours and stock.

### Environment variables

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `MONGODB_URI` | yes | `mongodb+srv://user:pass@cluster.mongodb.net` | Database connection |
| `MONGODB_DB` | no | `veltre` | Database name (default `veltre`) |
| `APP_URL` | yes in production | `https://www.yourdomain.com` | Absolute links (sitemap, WhatsApp admin link, SEO) |
| `ADMIN_EMAILS` | no | `you@example.com,partner@example.com` | Emails that become admins when they register |

## Deploy (Vercel + MongoDB Atlas)

1. **MongoDB Atlas** (free M0 cluster):
   - Create a cluster and a database user.
   - In **Network Access**, allow `0.0.0.0/0`. Vercel's serverless functions don't have fixed IP addresses, so they need this to connect.
   - Copy the connection string.
2. **Vercel:**
   - Import the Git repository; Vercel detects Next.js automatically.
   - Add the environment variables above (`APP_URL` = your Vercel or custom domain).
   - Deploy.
3. Register with your admin email (or run `create-admin` locally against the Atlas URI), then set up the store in `/admin`.
4. On your phone, open the site and choose **Add to Home Screen** to install it as an app.

Any Node host that runs `npm run build && npm start` also works, for example Render or Railway.

## API

All endpoints return JSON. Write requests must come from the site itself (`Origin` check) and use the session cookie.

| Method & path | Access | Purpose |
| --- | --- | --- |
| `POST /api/auth/register` · `login` · `logout` · `GET /api/auth/me` | public | Accounts and sessions |
| `GET` / `PATCH /api/account` · `POST /api/account/password` | user | Profile, password |
| `POST /api/account/orders/:number/cancel` | user | Cancel own pending order |
| `GET /api/products` | public | Search and filter (`q`, `category`, `size`, `color`, `min`, `max`, `instock`, `sale`, `sort`, `page`) |
| `POST /api/products` · `GET` / `PUT` / `DELETE /api/products/:id` | admin | Manage products |
| `GET /api/categories` · `POST` · `PUT` / `DELETE /api/categories/:id` | public / admin | Collections |
| `POST /api/images` · `GET /api/images/:id` | admin / public | Upload (base64) and serve images |
| `POST /api/cart/quote` | public | Server-side cart pricing and stock |
| `GET` / `PUT /api/cart` | user | Saved cart |
| `GET` / `POST /api/orders` · `GET /api/orders/:id` | user | Place and view orders (`?scope=all` for admins) |
| `PATCH /api/orders/:id` | admin | Status, payment, notes |
| `GET /api/admin/stats` · `GET /api/admin/customers` · `PATCH /api/admin/customers/:id` | admin | Dashboard, customers |
| `GET` / `PUT /api/settings` | public / admin | Store settings |

## Images

Photos you upload are resized (max 1600 px) and converted to WebP **in your browser**, then sent to the API as base64 and stored in MongoDB in their own `images` collection. The API checks each file's type and signature and caps it at 2.5 MB. They are served from `/api/images/<id>` with one-year caching, and the service worker also caches them on phones.

A typical product photo is 100–300 KB. The free Atlas tier (512 MB) holds roughly 1,500–3,000 photos alongside your data. Upgrade the cluster, or move images to a CDN, if you outgrow that.

## Security

- Passwords are hashed with bcrypt (cost 12). Sessions are random 256-bit tokens; only their SHA-256 hash is stored, with a 30-day expiry.
- Cookies are `httpOnly`, `SameSite=Lax` and `Secure` in production. Every write request is checked against the site's own origin, to block cross-site requests.
- Logins are rate-limited per email and per IP; registrations, uploads, orders and password changes are rate-limited too.
- All input is validated with zod on the server. Prices, totals and stock are always calculated from the database.
- Security headers are set: CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy.
- Admin pages and APIs check the admin role on the server for every request.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm test` | 24 API integration tests against a temporary MongoDB (uses `/usr/bin/mongod` if installed, otherwise downloads one) |
| `npm run lint` · `npm run typecheck` | Code checks |
| `npm run create-admin` | Create or promote an admin account |
| `npm run seed` | Add the sample catalog (`-- --replace` to replace the existing catalog) |

## Project structure

```
src/
  app/
    (store)/        storefront, cart, checkout, account
    (auth)/         login, register
    admin/          admin dashboard
    api/            serverless REST API
    manifest.ts  robots.ts  sitemap.ts  offline/
  components/       ui/ (Radix-based), store/, admin/, auth/, providers/
  lib/              shared logic: catalog, cart, money, phone, validation, WhatsApp
  server/           database, auth, rate limiting, repositories
  middleware.ts     redirects logged-out users away from checkout, account and admin
public/sw.js        service worker
tests/              API integration tests
scripts/            create-admin
```

## Not included yet

- **Password reset by email.** This needs an email provider (e.g. Resend). Until then, a customer who forgets their password can contact you on WhatsApp, and you set a temporary password for them in **Admin → Customers**.
- **Online payment.** Payment is arranged on WhatsApp. Paystack (Mobile Money and card) can be added later.

## Image credits

The sample photos in `scripts/seed/images` are from [Unsplash](https://unsplash.com) (free to use under the [Unsplash License](https://unsplash.com/license)). Photos with visible third-party brand logos were left out. Replace them with your own product photography before launch so customers see the items you actually sell.
