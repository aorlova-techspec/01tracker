const formatCase = (value, forms) => {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
};

export default function StatsCards({ stats }) {
  const { total, completed, remaining, progress } = stats;
  const taskWord = formatCase(total, ["задача", "задачи", "задач"]);

  return (
    <section className="stats" aria-label="Статистика за день">
      <article className="card stat">
        <p className="stat__label">Всего задач</p>
        <p className="stat__value">{total}</p>
        <p className="stat__hint">{taskWord}</p>
      </article>

      <article className="card stat stat--done">
        <p className="stat__label">Выполнено</p>
        <p className="stat__value">{completed}</p>
        <p className="stat__hint">из {total}</p>
      </article>

      <article className="card stat stat--left">
        <p className="stat__label">Осталось</p>
        <p className="stat__value">{remaining}</p>
        <p className="stat__hint">до конца дня</p>
      </article>

      <article className="card stat stat--progress">
        <p className="stat__label">Прогресс</p>
        <p className="stat__value">{progress}%</p>
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Процент выполнения задач"
        >
          <span className="progress__fill" style={{ width: `${progress}%` }} />
        </div>
      </article>
    </section>
  );
}
