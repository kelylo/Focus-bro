# Focus Bro database

Authenticated learning data is stored in
`public.focus_bro_state`, keyed by `auth.users.id`. The JSON `state` document
contains the existing feature records, allowing pages and browsers to share
one account without destructive migrations.

Run [`supabase-schema.sql`](../supabase-schema.sql) in the configured Supabase
project before enabling account sync. Row-level security permits a user to
read and write only their own row. Never put a Supabase service-role key in
the browser or this repository.
