import { useState } from "react";
import { errorMessage } from "../utils/rows.js";

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none">
    <path
      d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

export default function AuthModal({ signIn, signUp, onClose }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setInfo("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!email.trim()) {
      setError("Введите электронную почту.");
      return;
    }
    if (password.length < 6) {
      setError("Пароль не короче 6 символов.");
      return;
    }

    setBusy(true);
    try {
      const result =
        mode === "signin"
          ? await signIn(email.trim(), password)
          : await signUp(email.trim(), password);
      const { data, error: authError } = result;

      if (authError) {
        setError(errorMessage(authError));
        return;
      }

      if (mode === "signup" && !data.session) {
        setInfo("Письмо для подтверждения отправлено на почту. Откройте ссылку из письма и войдите.");
        return;
      }

      onClose();
    } catch (networkError) {
      setError(errorMessage(networkError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__card card">
        <div className="modal__head">
          <h2 className="section-title" id="auth-title">
            Вход в аккаунт
          </h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Закрыть и продолжить без аккаунта"
            title="Продолжить локально"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
            className={`tab ${mode === "signin" ? "tab--active" : ""}`}
            onClick={() => switchMode("signin")}
          >
            Войти
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            className={`tab ${mode === "signup" ? "tab--active" : ""}`}
            onClick={() => switchMode("signup")}
          >
            Регистрация
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="task-form__field">
            <label className="task-form__label" htmlFor="auth-email">
              Электронная почта
            </label>
            <input
              id="auth-email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              placeholder="you@example.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="task-form__field">
            <label className="task-form__label" htmlFor="auth-password">
              Пароль
            </label>
            <div className="auth-form__password">
              <input
                id="auth-password"
                className="input"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                placeholder="минимум 6 символов"
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="auth-form__eye"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                title={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                <EyeIcon />
              </button>
            </div>
          </div>

          {error && (
            <p className="task-form__error" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="auth-form__info" role="status">
              {info}
            </p>
          )}

          <button className="btn btn--primary auth-form__submit" type="submit" disabled={busy}>
            {busy ? "Подождите…" : mode === "signin" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>

        <p className="auth-form__hint">
          Аккаунт не нужен — можно пользоваться трекером локально, данные останутся в этом браузере.
        </p>
      </div>
    </div>
  );
}
