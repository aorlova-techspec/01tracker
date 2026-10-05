import { formatFullDate } from "../utils/date.js";
import logo from "../assets/logo.png";

export default function Header() {
  return (
    <header className="header card">
      <div className="header__brand">
        <img className="header__logo" src={logo} alt="" width="56" height="56" />
        <div className="header__titles">
          <h1 className="header__title">Daily Task Tracker</h1>
          <p className="header__tagline">Планируйте день и отслеживайте свой прогресс</p>
        </div>
      </div>
      <p className="header__date">{formatFullDate()}</p>
    </header>
  );
}
