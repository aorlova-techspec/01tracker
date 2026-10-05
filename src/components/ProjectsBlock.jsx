import { useState } from "react";

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none">
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none">
    <path
      d="M6 6l12 12M18 6L6 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default function ProjectsBlock({ projects, usedProjects, onAdd, onRemove }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Введите название проекта.");
      return;
    }

    const result = onAdd(trimmed);
    if (result.duplicate) {
      setError("Такой проект уже есть в словаре.");
      return;
    }
    if (result.added === false) {
      setError("Не удалось добавить проект. Попробуйте ещё раз.");
      return;
    }

    setName("");
    setError("");
  };

  const handleRemove = (project) => {
    const inUse = usedProjects.includes(project);
    const confirmed = window.confirm(
      inUse
        ? `Проект «${project}» используется задачами. Убрать его из словаря? Задачи сохранят название.`
        : `Удалить проект «${project}» из словаря?`
    );
    if (confirmed) onRemove(project);
  };

  return (
    <section className="card projects" aria-label="Словарь проектов">
      <div className="projects__head">
        <h2 className="section-title">Проекты</h2>
        <p className="projects__hint">Занесите проекты в словарь и выбирайте их в задачах</p>
      </div>

      <form className="projects__form" onSubmit={handleSubmit} noValidate>
        <label className="visually-hidden" htmlFor="project-name">
          Название проекта
        </label>
        <input
          id="project-name"
          className={`input projects__input ${error ? "input--invalid" : ""}`}
          type="text"
          value={name}
          maxLength={60}
          placeholder="Например: Сайт клиента"
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError("");
          }}
          aria-invalid={Boolean(error)}
        />
        <button className="btn btn--ghost projects__add" type="submit">
          <PlusIcon />
          Добавить проект
        </button>
      </form>

      {error && (
        <p className="task-form__error" role="alert">
          {error}
        </p>
      )}

      {projects.length > 0 ? (
        <ul className="projects__list">
          {projects.map((project) => (
            <li className="chip" key={project}>
              <span className="chip__name">{project}</span>
              {usedProjects.includes(project) && (
                <span className="chip__count" title="Задач с этим проектом">
                  {usedProjects.filter((item) => item === project).length}
                </span>
              )}
              <button
                className="chip__remove"
                type="button"
                onClick={() => handleRemove(project)}
                aria-label={`Удалить проект «${project}» из словаря`}
                title="Удалить из словаря"
              >
                <CloseIcon />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="projects__empty">Словарь проектов пуст — добавьте первый проект.</p>
      )}
    </section>
  );
}
