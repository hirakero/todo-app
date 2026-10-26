-- 持ち主の列を追加（まずは NULL を許可して、既存行を埋めてから NOT NULL にする）
alter table public.todos
  add column user_id uuid references auth.users (id) on delete cascade;

-- 既存の行（持ち主なし）を、登録済みの最初のユーザーに割り当てる。行が無い DB では何も起きない
update public.todos
set user_id = (select id from auth.users order by created_at limit 1)
where user_id is null;

-- 追加時は、ログイン中のユーザーの id を自動で入れる（アプリから user_id を送らなくてよい）
alter table public.todos
  alter column user_id set default auth.uid(),
  alter column user_id set not null;

-- ポリシーの検索を速くするためのインデックス
create index todos_user_id_idx on public.todos (user_id);

-- RLS を有効化。これ以降、ポリシーで許可された行しか操作できない
alter table public.todos enable row level security;

-- ログイン済み（authenticated）のユーザーが、自分の行だけを操作できるようにする。
-- (select auth.uid()) と書くと、行ごとではなく1回だけ評価されるので速い
create policy "Users can select own todos"
  on public.todos for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own todos"
  on public.todos for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own todos"
  on public.todos for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own todos"
  on public.todos for delete to authenticated
  using ((select auth.uid()) = user_id);
