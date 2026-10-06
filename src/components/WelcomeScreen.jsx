import AuthForm from "./AuthForm.jsx";
import logo from "../assets/logo.png";
import fon from "../assets/fon.jpg";

const FEATURES = [
  { title: "Задачи и дедлайны", text: "Планируйте день, ставьте сроки и отмечайте выполненное." },
  { title: "Проекты", text: "Свой словарь проектов — задачи всегда по местам." },
  { title: "Прогресс", text: "Статистика дня и полоса выполнения видны с первого взгляда." },
  { title: "Везде одинаково", text: "С телефона и компьютера, с выгрузкой задач в Excel." },
];

export default function WelcomeScreen({ signIn, signUp, onAuthenticated, onGuest }) {
  return (
    <div className="welcome" style={{ backgroundImage: `url(${fon})` }}>
      <div className="welcome__overlay" />

      <div className="welcome__inner">
        <section className="welcome__intro">
          <img className="welcome__logo" src={logo} alt="" width="72" height="72" />
          <h1 className="welcome__title">Daily Task Tracker</h1>
          <p className="welcome__tagline">Планируйте день и отслеживайте свой прогресс</p>
          <p className="welcome__text">
            Простой личный трекер ежедневных задач: добавляйте задачи, дедлайны и проекты,
            отмечайте выполненное и следите за прогрессом. Ваши данные доступны на всех
            устройствах — с любого телефона и компьютера.
          </p>

          <ul className="welcome__features">
            {FEATURES.map((feature) => (
              <li className="welcome__feature" key={feature.title}>
                <span className="welcome__check" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                    <path
                      d="M5 12.5 9.5 17 19 7.5"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>
                  <strong>{feature.title}.</strong> {feature.text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="welcome__card card" aria-label="Вход в аккаунт">
          <p className="welcome__card-title">Войдите или создайте аккаунт</p>
          <p className="welcome__card-subtitle">Это бесплатно и занимает меньше минуты</p>

          <AuthForm signIn={signIn} signUp={signUp} onSuccess={onAuthenticated} />

          <button className="welcome__guest" type="button" onClick={onGuest}>
            Продолжить без аккаунта →
          </button>
        </section>
      </div>
    </div>
  );
}
