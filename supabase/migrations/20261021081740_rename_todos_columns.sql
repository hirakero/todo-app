-- アプリ側の型（title / done）に列名を合わせる
alter table public.todos rename column text to title;
alter table public.todos rename column completed to done;
