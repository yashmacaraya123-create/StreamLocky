# Apply the Supabase Sync Repair

The updated SQL repairs Maker authorization consistently for shared content,
media metadata, and Storage uploads.

1. Upload the complete v11 package contents to the GitHub repository root.
2. In Supabase **SQL Editor**, run the updated **SUPABASE-SETUP.sql** again.
   It is safe to rerun the supplied setup and replaces the old `is_admin()`
   function used by the existing RLS policies.
3. Wait for Netlify to publish the new files.
4. Sign out of StreamLock, then sign in again with your Supabase Maker email
   and password.
5. Open **Developer Hub → Manage Videos → Test Sync**.
6. Upload a small test image/video, then click **Refresh** in Supabase Video
   Storage. Usage now counts actual objects in the `streamlock-media` bucket.

The transfer indicator now displays the real Supabase error instead of only a
generic failure. If it still fails, copy that exact message for diagnosis.
