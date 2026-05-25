create schema if not exists app_private;

grant usage on schema app_private to anon, authenticated;

create or replace function app_private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

revoke all on function app_private.has_role(uuid, public.app_role) from public;
grant execute on function app_private.has_role(uuid, public.app_role) to anon, authenticated;

alter policy "Admins manage articles"
on public.articles
using (app_private.has_role(auth.uid(), 'admin'::public.app_role))
with check (app_private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Anyone can view published articles"
on public.articles
using ((published = true) or app_private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Habits viewable by owner or admin"
on public.habit_logs
using ((auth.uid() = user_id) or app_private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Profiles viewable by owner or admin"
on public.profiles
using ((auth.uid() = user_id) or app_private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Recs viewable by owner or admin"
on public.recommendations
using ((auth.uid() = user_id) or app_private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Scans viewable by owner or admin"
on public.tooth_scans
using ((auth.uid() = user_id) or app_private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Users update own scans"
on public.tooth_scans
using ((auth.uid() = user_id) or app_private.has_role(auth.uid(), 'admin'::public.app_role))
with check ((auth.uid() = user_id) or app_private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins delete roles"
on public.user_roles
using (app_private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins insert roles"
on public.user_roles
with check (app_private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins update roles"
on public.user_roles
using (app_private.has_role(auth.uid(), 'admin'::public.app_role))
with check (app_private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins view all roles"
on public.user_roles
using (app_private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Users view own roles"
on public.user_roles
using ((auth.uid() = user_id) or app_private.has_role(auth.uid(), 'admin'::public.app_role));

revoke execute on function public.has_role(uuid, public.app_role) from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.update_updated_at_column() from anon, authenticated;