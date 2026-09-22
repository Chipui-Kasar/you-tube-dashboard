-- Admin access is now granted by allowlisting a Google account's email here.
-- There is no signup form anymore: run this in the Supabase SQL editor for
-- every email that should be allowed to sign in at /admin/login with Google.
--
-- Replace the email (and name) below, then run it.
insert into admin_users (email, full_name, is_active)
values ('you@example.com', 'Your Name', true)
on conflict (email) do update set is_active = true;
