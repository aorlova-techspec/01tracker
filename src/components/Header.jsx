import { formatFullDate } from "../utils/date.js";
import logo from "../assets/logo.png";

export default function Header({ configured, user, onSignIn, onSignOut }) {
  return (
    <header className="header card">
      <div className="header__brand">
        <img className="header__logo" src={logo} alt="" width="56" height="56" />
        <div className="header__titles">
          <h1 className="header__title">Daily Task Tracker</h1>
          <p className="header__tagline">Планируйте день и отслеживайте свой прогресс</p>
        </div>
      </div>

      <div className="header__aside">
        <p className="header__date">{formatFullDate()}</p>

        {configured && (
          <div className="header__account">
            {user ? (
              <>
                <span className="header__email" title={user.email}>
                  {user.email}
                </span>
                <button className="btn btn--ghost btn--small" type="button" onClick={onSignOut}>
                  Выйти
                </button>
              </>
            ) : (
              <button className="btn btn--primary btn--small" type="button" onClick={onSignIn}>
                Войти
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
