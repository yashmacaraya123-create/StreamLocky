# StreamLock Supabase Setup

Your public project configuration is already included in `supabase-config.js`.
Do not add a service-role key or database password to this website.

## 1. Run the database setup once

1. Open your Supabase project.
2. Open **SQL Editor → New query**.
3. Paste the complete contents of **`SUPABASE-SETUP.sql`**.
4. Click **Run**.

This creates:
- profiles and admin-aware authentication;
- shared website content;
- per-user favorite video lists;
- media metadata and the public `streamlock-media` bucket;
- shared views, unlocks, impressions, and reward counters;
- Row Level Security policies for public reads, owner-only favorites, and
  admin-only content/media writes.

The SQL recognizes **`yashmacaraya123-create`** as the admin username. If you ran an earlier version, run this updated file again: it also repairs admin authorization for Storage and shared-content writes. After
running it, you can verify the profile with:

```sql
select id, username, full_name, role
from public.profiles
where username = 'yashmacaraya123-create';
```

The result should show `role = admin`.

## 2. Configure Authentication URLs

In **Authentication → URL Configuration**:

- Set **Site URL** to your real Netlify address.
- Add that same address and `http://localhost:8000` to **Redirect URLs** if you
  use local testing.

Use the email address and password of your Supabase Auth user to sign in. The
old hardcoded developer password is intentionally no longer used.

## 3. Deploy the complete package

Upload the **contents** of `streamlock-updated-v9` to the root of your GitHub
repository and commit them. Netlify will deploy automatically when connected.

Keep these files together:

- `supabase.js` — vendored Supabase browser client;
- `supabase-config.js` — public project URL and publishable key;
- `storage.js` — StreamLock cloud/cache integration;
- all HTML pages and `theme.css`.

## 4. Seed your shared content

Sign in through `login.html` using the Supabase account whose profile is admin,
then open the Developer Console. If the shared `site_state` row is empty, the
first admin session publishes the current website content to Supabase.

If you have existing local edits on Netlify, perform this first admin login in
the same browser where those edits are still available.

## 5. Verify synchronization

1. Edit a video or list as admin.
2. Wait one second for the debounced cloud save.
3. Open the site in another browser or incognito window.
4. Confirm that the edit and uploaded media appear there.
5. Sign in as a viewer and test favorites; only that viewer should see them.

## Security and operating notes

- The publishable key is safe for browser use **only with the supplied RLS
  policies enabled**. Never replace it with a service-role key.
- Public media is readable through public URLs, but only admin can upload,
  replace, or delete it through the supplied policies.
- Passwords, local account arrays, sessions, and transactions are excluded
  from shared website content.
- Shared activity RPCs accept small increments. For fraud-resistant paid
  rewards or revenue, replace them with signed provider callbacks or secure
  Edge Functions. Provider balances still come only from their genuine APIs.
- The SQL has not been executed for you; dashboard access is required. Run it
  before testing cloud sign-in and synchronization.
