import { useState } from "react";
import ProjectSelect from "./ProjectSelect.jsx";

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;

export default function AddTaskForm({ onAdd, projectOptions }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [project, setProject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Введите название задачи — пустую задачу добавить нельзя.");
      return;
    }

    const result = await onAdd({ title: trimmedTitle, description, project, deadline });
    if (result === false) {
      setError("Не удалось добавить задачу. Попробуйте ещё раз.");
      return;
    }

    setTitle("");
    setDescription("");
    setProject("");
    setDeadline("");
    setError("");
  };

  return (
    <section className="card form-card" aria-label="Добавление задачи">
      <h2 className="section-title">Новая задача</h2>

      <form className="task-form" onSubmit={handleSubmit} noValidate>
        <div className="task-form__field task-form__field--title">
          <label className="task-form__label" htmlFor="task-title">
            Название задачи <span className="task-form__required">*</span>
          </label>
          <input
            id="task-title"
            className={`input ${error ? "input--invalid" : ""}`}
            type="text"
            value={title}
            maxLength={MAX_TITLE_LENGTH}
            placeholder="Например: подготовить отчёт"
            onChange={(event) => {
              setTitle(event.target.value);
              if (error) setError("");
            }}
            aria-describedby={error ? "task-title-error" : undefined}
            aria-invalid={Boolean(error)}
          />
          {error && (
            <p className="task-form__error" id="task-title-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="task-form__field task-form__field--description">
          <label className="task-form__label" htmlFor="task-description">
            Описание <span className="task-form__optional">необязательно</span>
          </label>
          <input
            id="task-description"
            className="input"
            type="text"
            value={description}
            maxLength={MAX_DESCRIPTION_LENGTH}
            placeholder="Детали, ссылки, заметки"
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="task-form__field task-form__field--project">
          <label className="task-form__label" htmlFor="task-project">
            Проект <span className="task-form__optional">необязательно</span>
          </label>
          <ProjectSelect
            id="task-project"
            value={project}
            onChange={setProject}
            options={projectOptions}
          />
        </div>

        <div className="task-form__field task-form__field--deadline">
          <label className="task-form__label" htmlFor="task-deadline">
            Дедлайн <span className="task-form__optional">необязательно</span>
          </label>
          <input
            id="task-deadline"
            className="input"
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
          />
        </div>

        <button className="btn btn--primary task-form__submit" type="submit">
          Добавить задачу
        </button>
      </form>
    </section>
  );
}
