# HodaHub — Modern E-Commerce Platform

HodaHub is a high-performance e-commerce platform built with **React**, **Vite**, **Tailwind CSS**, and powered by **Supabase** (PostgreSQL, Supabase Auth with Phone OTP, and Deno Edge Functions). All product media and assets are managed via **Cloudinary**.

---

## 🔒 Architecture Highlights

1. **Relational Database (PostgreSQL via Supabase)**:
   - 15 relational tables with foreign keys and cascade rules.
   - Row Level Security (RLS) enabled and enforced on every table.
   - `handle_new_user()` trigger auto-creates profile rows on first phone OTP verify.
   - `is_admin()` security definer function prevents recursive RLS evaluations.

2. **Supabase Auth (Phone OTP)**:
   - SMS-based Phone OTP authentication:
     ```ts
     await supabase.auth.signInWithOtp({ phone: '+91XXXXXXXXXX' });
     await supabase.auth.verifyOtp({ phone: '+91XXXXXXXXXX', token: otpCode, type: 'sms' });
     ```
   - Client session handled via Supabase SDK (`supabase.auth.signOut()` for logout).
   - Guest checkouts supported without creating `auth.users` rows.

3. **Supabase Edge Functions (Deno)**:
   - `msg91-send-sms-hook`: Supabase Auth Send SMS Hook for Phone Login OTP via MSG91 (DLT compliant).
   - `send-notification`: Transactional SMS order lifecycle updates via MSG91 Flow API.
   - `create-razorpay-order`: Server-side Razorpay order generation (protects Key Secret).
   - `verify-razorpay-payment`: Server-side HMAC SHA-256 signature verification & order status update.
   - `create-delhivery-shipment`: Manifests Delhivery shipments with `DELHIVERY_API_KEY`.
   - `track-shipment`: Polls Delhivery tracking status.
   - `check-pincode-serviceability`: Checks delivery TAT & COD eligibility via Delhivery.
   - `guest-order-track`: Safely looks up guest orders by phone + order_id using `service_role` key without exposing `orders` table to anonymous SELECT.

4. **Media Management (Cloudinary)**:
   - All product images, category banners, and box option images are stored in **Cloudinary** (Supabase Storage is NOT used).

---

## 📋 Database Schema

| Table | Description | RLS Policy Summary |
|-------|-------------|--------------------|
| `profiles` | 1:1 linked with `auth.users(id)` | Owner read/update, Admin full access |
| `categories` | Categories & hierarchies | Public read, Admin write |
| `products` | Product catalog & pricing | Public read (active), Admin write |
| `product_variants`| Variants (size, color, stock) | Public read, Admin write |
| `product_images` | Cloudinary URLs per product | Public read, Admin write |
| `box_options` | Signature packaging options | Public read (active), Admin write |
| `product_box_options` | Join table for packaging | Public read, Admin write |
| `addresses` | User & guest shipping addresses | Owner read/write, Admin full access |
| `orders` | Customer & guest orders | Owner read own, Admin full access, Guest insert |
| `order_items` | Line items per order | Order owner read, Order creator insert |
| `reviews` | Product ratings & reviews | Approved public read, Owner insert/update |
| `coupons` | Promo codes & discounts | Public read (for cart apply), Admin write |
| `wallets` | Customer wallet balances | Owner read, Service role/Admin write |
| `wallet_transactions` | Wallet credit/debit audit | Owner read, Service role/Admin write |
| `return_requests` | Order return/replacement tickets | Order owner create/read, Admin update |

---

## 🚀 Supabase Setup & Deployment

### 1. Database Migration & Seeds
1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Run the migration file:
   [`supabase/migrations/20260910000000_init_hodahub_schema.sql`](supabase/migrations/20260910000000_init_hodahub_schema.sql)
3. Run the seed data file:
   [`supabase/seed.sql`](supabase/seed.sql)

### 2. Configure MSG91 & Supabase "Send SMS Hook"
Because MSG91 is not in Supabase's native built-in provider dropdown, HodaHub uses Supabase's **Send SMS Hook** with our Edge Function:
1. **MSG91 Setup (DLT Compliance)**:
   - Sign up at [msg91.com](https://msg91.com) and retrieve your **Auth Key**.
   - Register a 6-character Sender ID (e.g., `HODAHB`) on the DLT portal.
   - Register DLT templates for:
     - `OTP`: Login verification code
     - `ORDER_PLACED`: Order confirmation with tracking link
     - `SHIPPED`: Dispatch notification with courier & AWB
     - `OUT_FOR_DELIVERY`: Out for delivery alert
     - `DELIVERED`: Delivery completion alert
2. **Supabase Auth Configuration**:
   - In Supabase Dashboard, go to **Authentication** -> **Providers** -> **Phone** and enable Phone Provider (disable any legacy external provider config).
   - Go to **Authentication** -> **Hooks**.
   - Under **Send SMS hook**, click **Add hook** (type: **HTTPS**).
   - Set the URL to: `https://<your-project-ref>.supabase.co/functions/v1/msg91-send-sms-hook`
   - Click **Generate Secret** and copy the secret (`whsec_...`). Set this as `SMS_HOOK_SECRET` in Edge Function secrets.

### 3. Setting the First Administrator Account
Because no signup flow assigns `role = 'admin'` automatically for security reasons, the initial admin account must be promoted manually after completing their first Phone OTP login:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE phone = '+919900011223'; -- Replace with your administrator's verified phone number
```
*Note: Once this is run, all admin actions (product creation, order status updates, coupons) are enforced at the PostgreSQL database level through RLS.*

### 4. Deploying Edge Functions
Install the Supabase CLI and link your project:
```bash
supabase link --project-ref your-project-id
```

Set server-side secret keys:
```bash
supabase secrets set RAZORPAY_KEY_ID="rzp_live_xxx" \
                     RAZORPAY_KEY_SECRET="your_razorpay_secret" \
                     DELHIVERY_API_KEY="your_delhivery_key" \
                     MSG91_AUTH_KEY="your_msg91_auth_key" \
                     MSG91_SENDER_ID="HODAHB" \
                     SMS_HOOK_SECRET="whsec_your_hook_secret" \
                     MSG91_TEMPLATE_ID_OTP="your_otp_template_id" \
                     MSG91_TEMPLATE_ID_ORDER_PLACED="your_order_placed_template_id" \
                     MSG91_TEMPLATE_ID_SHIPPED="your_shipped_template_id" \
                     MSG91_TEMPLATE_ID_OUT_FOR_DELIVERY="your_ofd_template_id" \
                     MSG91_TEMPLATE_ID_DELIVERED="your_delivered_template_id"
```

Deploy all Edge Functions:
```bash
supabase functions deploy msg91-send-sms-hook --no-verify-jwt
supabase functions deploy send-notification
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
supabase functions deploy create-delhivery-shipment
supabase functions deploy track-shipment
supabase functions deploy check-pincode-serviceability
supabase functions deploy guest-order-track
```

---

## 💻 Local Development

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and Cloudinary credentials.

### 2. Install Dependencies & Run
```bash
npm install
npm run dev
```

### 3. Build & Validate
```bash
npm run build
npm run lint
```
