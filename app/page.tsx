"use client"; // 入力やクリックの状態を扱うので、クライアントコンポーネントにする

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "./lib/supabase/client";
import { isTodo, type Todo } from "./types";

// ブラウザ用クライアント。内部で使い回されるので、モジュール直下で作ってよい
const supabase = createClient();

export default function Home() {
  // 入力欄の文字列
  const [title, setTitle] = useState("");
  // 追加済みのToDo一覧
  const [todos, setTodos] = useState<Todo[]>([]);
  // ログイン中のユーザーの id。undefined = まだ確認中、null = 未ログイン
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  // どのユーザーの一覧を読み込み済みか。userId と同じなら「読み込み完了」とみなす。
  // ログインし直して別のユーザーになったときも、自動で「読み込み中」に戻る
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const isLoaded = userId !== undefined && loadedUserId === userId;
  // 追加の送信中か。連打で同じToDoが2件できるのを防ぐ
  const [isAdding, setIsAdding] = useState(false);
  // 追加後にフォーカスを戻すため、入力欄そのものを掴んでおく
  const titleInputRef = useRef<HTMLInputElement>(null);
  // 入力欄の下に出すエラー文。null なら出ていない
  const [addError, setAddError] = useState<string | null>(null);

  // 表示中のトースト。null なら出ていない。
  // id は「同じ文章でも新しい通知」と区別するための通し番号で、アニメーションのやり直しに使う
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null,
  );
  // 3秒後に消すためのタイマー。連続で出したときに前のタイマーを止める必要がある
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // トーストを出して3秒後に消す
  function showToast(message: string) {
    // 前のタイマーが残っていると、新しいトーストが早く消されてしまう
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    setToast({ id: Date.now(), message });
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }

  // ログイン状態の変化を監視する。登録した直後（最初の確認）、ログイン、ログアウトで呼ばれる。
  // この画面は別ページへ移動しても残るので、ヘッダーのログアウトにもここで追従できる。
  // コールバックの中では Supabase を呼ばず、状態を更新するだけにする（呼ぶと固まることがある）
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });

    // 画面を閉じるときに監視をやめる
    return () => subscription.unsubscribe();
  }, []);

  // ログイン中のユーザーが決まったら、そのユーザーの一覧を Supabase から読み込む。
  // 通信は描画中に行えないので useEffect の中で行う
  useEffect(() => {
    if (!userId) return;
    const currentUserId: string = userId;
    // 読み込み中にユーザーが変わったら、古い結果は捨てる
    let cancelled = false;

    async function load() {
      // 作成日時の古い順（＝追加した順）に取得する。
      // 自分の行だけが返るのは RLS（DB 側のポリシー）のおかげ
      const { data, error } = await supabase
        .from("todos")
        .select("id, title, done")
        .order("created_at", { ascending: true });
      if (cancelled) return;

      if (error) {
        showToast("読み込みに失敗しました");
      } else {
        // Todo の形をしている行だけを残す
        setTodos(data.filter(isTodo));
      }
      setLoadedUserId(currentUserId);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 「追加」したときの処理
  async function handleAdd() {
    // 前後の空白を除く。空白だけの入力も空として扱う
    const trimmed = title.trim();
    if (trimmed === "") {
      // 追加はせず、理由を入力欄の下に出す
      setAddError("タイトルを入力してください");
      return;
    }

    setIsAdding(true);
    // id と作成日時は DB が自動で付けるので、title だけ送る。
    // select() を付けると、DB が付けた id を含む行が返ってくる
    const { data, error } = await supabase
      .from("todos")
      .insert({ title: trimmed })
      .select("id, title, done")
      .single();
    setIsAdding(false);

    if (error || !isTodo(data)) {
      // 失敗したときは入力欄を残し、やり直せるようにする
      showToast("追加に失敗しました");
      return;
    }

    // 既存の配列は変更せず、末尾に足した新しい配列を作って渡す
    setTodos((current) => [...current, data]);
    // 入力欄を空に戻す
    setTitle("");
    // ボタンをクリックしたときはフォーカスがボタンに移るので、入力欄に戻して連続入力できるようにする
    titleInputRef.current?.focus();
    showToast("ToDo を追加しました");
  }

  // 編集中のToDoのid。null なら誰も編集していない
  const [editingId, setEditingId] = useState<string | null>(null);
  // 編集欄に表示している文字列（確定するまで todos には反映しない）
  const [editingTitle, setEditingTitle] = useState("");

  // 編集モードに入る
  function handleStartEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  }

  // 編集をやめて元に戻す。editingTitle は捨てるだけでよい
  function handleCancelEdit() {
    setEditingId(null);
    setEditingTitle("");
  }

  // 編集内容を確定する
  async function handleSaveEdit() {
    const trimmed = editingTitle.trim();
    // 保存ボタンは空のとき無効化しているが、Enter でも送信できるのでここでも弾く
    if (trimmed === "" || editingId === null) return;

    // DB の更新に成功してから画面に反映する。失敗時は編集欄を残してやり直せるようにする
    const { error } = await supabase
      .from("todos")
      .update({ title: trimmed })
      .eq("id", editingId);
    if (error) {
      showToast("保存に失敗しました");
      return;
    }

    setTodos((current) =>
      current.map((todo) =>
        todo.id === editingId ? { ...todo, title: trimmed } : todo,
      ),
    );
    handleCancelEdit(); // 編集状態の後片付けは同じなので使い回す
  }

  // 削除の確認中のToDo。null ならダイアログは出ていない
  const [deletingTodo, setDeletingTodo] = useState<Todo | null>(null);
  // <dialog> を開閉するには DOM の要素そのものを操作する必要があるので ref で掴む
  const dialogRef = useRef<HTMLDialogElement>(null);

  // deletingTodo の変化に合わせてダイアログを開閉する
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // showModal() だと背景が操作できなくなり、Esc で閉じる動作も付いてくる
    if (deletingTodo) dialog.showModal();
    else dialog.close();
  }, [deletingTodo]);

  // 削除ボタンを押したとき。まだ消さず、確認ダイアログを開くだけ
  function handleDelete(todo: Todo) {
    setDeletingTodo(todo);
  }

  // ダイアログで「削除する」を押したとき
  async function handleConfirmDelete() {
    if (!deletingTodo) return;

    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", deletingTodo.id);
    if (error) {
      showToast("削除に失敗しました");
      setDeletingTodo(null);
      return;
    }

    // filter で「消したいもの以外」を集めた新しい配列を作る
    setTodos((current) => current.filter((item) => item.id !== deletingTodo.id));
    setDeletingTodo(null);
  }

  // チェックの ON / OFF を切り替える
  async function handleToggle(todo: Todo) {
    const { error } = await supabase
      .from("todos")
      .update({ done: !todo.done })
      .eq("id", todo.id);
    if (error) {
      showToast("更新に失敗しました");
      return;
    }

    // map で新しい配列を作り、対象のものだけ done を反転させたコピーに差し替える
    setTodos((current) =>
      current.map((item) =>
        item.id === todo.id ? { ...item, done: !item.done } : item,
      ),
    );
  }

  // ログイン状態の確認中、または未ログインのときは、一覧や入力欄を出さない
  if (!userId) {
    return (
      <div className="flex flex-1 justify-center px-4 py-16 sm:py-24">
        <main className="w-full max-w-md">
          <h1 className="text-center text-4xl font-bold tracking-tight text-emerald-900">
            ToDo リスト
          </h1>
          {userId === undefined ? (
            <p className="mt-10 text-center text-sm text-gray-400">
              読み込み中...
            </p>
          ) : (
            <div className="mt-10 rounded-lg bg-white p-5 text-center shadow-sm">
              <p className="text-sm text-gray-600">
                ToDo を使うには、ログインしてください
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  ログイン
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  新規登録
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 justify-center px-4 py-16 sm:py-24">
      {/* max-w-md で横幅を制限し、スマホでも横スクロールが出ないようにする */}
      <main className="w-full max-w-md">
        <h1 className="text-center text-4xl font-bold tracking-tight text-emerald-900">
          ToDo リスト
        </h1>
        <p className="mt-3 text-center text-sm text-gray-500">
          今日やることを書き出しましょう
        </p>

        {/* 入力エリアも白いカードにして、下の一覧と見た目を揃える */}
        {/* form にすると Enter キーでも追加できる */}
        <form
          onSubmit={(event) => {
            event.preventDefault(); // ページのリロードを防ぐ
            handleAdd();
          }}
          className="mt-10 rounded-lg bg-white p-5 shadow-sm"
        >
          {/* 入力欄とボタンを横並びにする箱。エラー文はこの箱の外（下）に出す */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                // 何か入力したらエラーは用済みなので消す
                setAddError(null);
              }}
              placeholder="やることを入力"
              // 編集中は追加できないようにする
              disabled={editingId !== null}
              // 入力内容に問題があることを支援技術にも伝える
              aria-invalid={addError !== null}
              aria-describedby={addError ? "add-error" : undefined}
              // min-w-0 がないと長い入力のときに flex アイテムが縮まず、横スクロールの原因になる
              className={`min-w-0 flex-1 rounded-lg border px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${
                addError
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-200 focus:border-emerald-500"
              }`}
            />
            <button
              type="submit"
              disabled={editingId !== null || isAdding}
              className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
            >
              追加
            </button>
          </div>

          {/* エラーは入力欄の直下。role="alert" で、出た瞬間に読み上げられる */}
          {addError && (
            <p id="add-error" role="alert" className="mt-3 text-sm text-red-600">
              {addError}
            </p>
          )}
        </form>

        {/* 読み込み中 → 1件もない → 一覧、の3パターンを出し分ける */}
        {!isLoaded ? (
          // 保存データを読む前に一覧を出すと、一瞬「ToDo がありません」が見えてしまう
          <p className="mt-10 text-center text-sm text-gray-400">読み込み中...</p>
        ) : todos.length === 0 ? (
          <p className="mt-10 text-center text-sm text-gray-400">
            まだ ToDo がありません
          </p>
        ) : (
          <ul className="mt-10 flex flex-col gap-3">
            {todos.map((todo) => (
              // key には id を使う。index だと削除や並べ替えで中身とズレる
              <li key={todo.id} className="rounded-lg bg-white shadow-sm">
                {editingId === todo.id ? (
                  // ----- 編集モード -----
                  // form にすると Enter キーで保存できる
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleSaveEdit();
                    }}
                    className="flex flex-col gap-3 p-5"
                  >
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      // Esc で編集をやめる。input は Esc を自前で拾う必要がある
                      onKeyDown={(event) => {
                        if (event.key === "Escape") handleCancelEdit();
                      }}
                      // 編集モードに入った瞬間に input が新しく表示されるので、ここにフォーカスが当たる
                      autoFocus
                      className="min-w-0 rounded-lg border border-emerald-500 px-4 py-3 outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                      >
                        キャンセル
                      </button>
                      <button
                        type="submit"
                        // 空文字では保存させない
                        disabled={editingTitle.trim() === ""}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                      >
                        保存
                      </button>
                    </div>
                  </form>
                ) : (
                  // ----- 通常表示 -----
                  <div className="flex items-start gap-3 p-5">
                    {/* label で囲むと、チェックボックスだけでなく文字をタップしても切り替わる */}
                    <label
                      className={`flex min-w-0 flex-1 items-start gap-3 ${
                        editingId === null
                          ? "cursor-pointer"
                          : "cursor-not-allowed"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={todo.done}
                        onChange={() => handleToggle(todo)}
                        // 他のToDoを編集中はチェックを変えられないようにする
                        disabled={editingId !== null}
                        // accent-* でチェック時の色をブラウザ標準の青から緑に変える
                        className="mt-0.5 size-5 shrink-0 accent-emerald-600 disabled:cursor-not-allowed"
                      />
                      {/* min-w-0 + break-words で長い文字列もカード内で折り返す */}
                      <span
                        className={`min-w-0 break-words ${
                          todo.done ? "text-gray-400 line-through" : ""
                        }`}
                      >
                        {todo.title}
                      </span>
                    </label>
                    {/* ボタンは横に並べる。shrink-0 で文字が長くても潰れないようにする */}
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(todo)}
                        // 他のToDoを編集中は押せないようにする
                        disabled={editingId !== null}
                        className="rounded-md px-3 py-1 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(todo)}
                        disabled={editingId !== null}
                        // 赤系だが、普段は文字だけにして誤操作しにくくしている
                        className="rounded-md px-3 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* 削除の確認ダイアログ。開いていないときはブラウザが非表示にしてくれる */}
        <dialog
          ref={dialogRef}
          // Esc キーや dialog.close() で閉じたときに呼ばれる。状態も閉じた状態に揃える
          onClose={() => setDeletingTodo(null)}
          // backdrop: で背景の暗幕にも色を付けられる
          className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg bg-white p-6 shadow-lg backdrop:bg-black/30"
        >
          <h2 className="text-lg font-bold">ToDo を削除しますか？</h2>
          <p className="mt-3 break-words text-sm text-gray-600">
            「{deletingTodo?.title}」を削除します。この操作は取り消せません。
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeletingTodo(null)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              削除する
            </button>
          </div>
        </dialog>
      </main>

      {/* トースト。fixed なので一覧の長さに関係なく画面の右下に固定される */}
      {toast && (
        <div
          // key が変わると要素が作り直され、アニメーションがもう一度再生される。
          // 連続で追加したときも「また出た」と分かるようにするため
          key={toast.id}
          // role="status" + aria-live で、スクリーンリーダーにも読み上げられる
          role="status"
          aria-live="polite"
          className="animate-toast-in fixed bottom-6 right-4 flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm shadow-md sm:right-6"
        >
          <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
          {toast.message}
        </div>
      )}
    </div>
  );
}
