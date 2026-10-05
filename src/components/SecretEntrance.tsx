import { useRef, useState, type FormEvent } from "react";
import Dialog from "./Dialog";

export default function SecretEntrance({
  code,
  onClose,
  onUnlock,
}: {
  code: string;
  onClose: () => void;
  onUnlock: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (value.trim() !== code) {
      setError(true);
      input.current?.focus();
      input.current?.select();
      return;
    }
    onUnlock();
  }

  return (
    <Dialog title="BACKROOM 입장" className="secret-dialog" onClose={onClose} initialFocus={input}>
      <form className="secret-panel" onSubmit={submit}>
        <h2>BACKROOM</h2>
        <label htmlFor="secret-code">시크릿 코드</label>
        <input
          id="secret-code"
          ref={input}
          type="password"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={value}
          onChange={(event) => { setValue(event.target.value); setError(false); }}
          aria-invalid={error}
          aria-describedby={error ? "secret-error" : undefined}
        />
        {error && <p className="secret-error" id="secret-error" role="alert">코드가 맞지 않아요. 다시 입력해 주세요.</p>}
        <button className="secret-submit" type="submit">입장하기</button>
      </form>
    </Dialog>
  );
}
