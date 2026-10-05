import { useState } from "react";
import { formatTaskDate } from "../utils/date.js";
import { isOverdue } from "../utils/tasks.js";
import ProjectSelect from "./ProjectSelect.jsx";

const EditIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none">
    <path
      d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M14.5 6.5l3 3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none">
    <path
      d="M4 7h16M10 7V5.5A1.5 1.5 0 0 1 11.5 4h1A1.5 1.5 0 0 1 14 5.5V7m-8 0 .8 11.1A2 2 0 0 0 8.8 20h6.4a2 2 0 0 0 2-1.9L18 7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function TaskItem({
  task,
  projectOptions,
  onToggle,
  onUpdate,
  onDelete,
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [project, setProject] = useState(task.project);
  const [deadline, setDeadline] = useState(task.deadline);
  const [error, setError] = useState("");

  const startEditing = () => {
    setTitle(task.title);
    setDescription(task.description);
    setProject(task.project);
    setDeadline(task.deadline);
    setError("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setError("");
  };

  const saveEditing = (event) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Название задачи не может быть пустым.");
      return;
    }
    onUpdate({ title, description, project, deadline });
    setEditing(false);
    setError("");
  };

  const removeTask = () => {
    const confirmed = window.confirm(`Удалить задачу «${task.title}»?`);
    if (confirmed) onDelete();
  };

  const overdue = isOverdue(task);

  return (
    <li className={`task ${task.completed ? "task--completed" : ""}`}>
      <label className="task__check">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={onToggle}
          aria-label={
            task.completed
              ? `Вернуть задачу «${task.title}» в активные`
              : `Отметить задачу «${task.title}» выполненной`
          }
        />
        <span className="task__checkmark" aria-hidden="true" />
      </label>

      <div className="task__body">
        {editing ? (
          <form className="task__edit" onSubmit={saveEditing} noValidate>
            <label className="visually-hidden" htmlFor={`edit-title-${task.id}`}>
              Название задачи
            </label>
            <input
              id={`edit-title-${task.id}`}
              className={`input ${error ? "input--invalid" : ""}`}
              type="text"
              value={title}
              maxLength={120}
              autoFocus
              onChange={(event) => {
                setTitle(event.target.value);
                if (error) setError("");
              }}
            />
            <label className="visually-hidden" htmlFor={`edit-description-${task.id}`}>
              Описание задачи
            </label>
            <input
              id={`edit-description-${task.id}`}
              className="input"
              type="text"
              value={description}
              maxLength={500}
              placeholder="Описание (необязательно)"
              onChange={(event) => setDescription(event.target.value)}
            />
            <div className="task__edit-row">
              <div className="task-form__field">
                <label className="task-form__label" htmlFor={`edit-project-${task.id}`}>
                  Проект
                </label>
                <ProjectSelect
                  id={`edit-project-${task.id}`}
                  value={project}
                  onChange={setProject}
                  options={projectOptions}
                />
              </div>
              <div className="task-form__field">
                <label className="task-form__label" htmlFor={`edit-deadline-${task.id}`}>
                  Дедлайн
                </label>
                <input
                  id={`edit-deadline-${task.id}`}
                  className="input"
                  type="date"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                />
              </div>
            </div>
            {error && (
              <p className="task__error" role="alert">
                {error}
              </p>
            )}
            <div className="task__edit-actions">
              <button className="btn btn--primary btn--small" type="submit">
                Сохранить
              </button>
              <button
                className="btn btn--ghost btn--small"
                type="button"
                onClick={cancelEditing}
              >
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="task__content">
              <p className="task__title">{task.title}</p>
              {task.description && <p className="task__description">{task.description}</p>}
              <p className="task__meta">
                <time dateTime={task.createdAt}>{formatTaskDate(task.createdAt)}</time>
                <span className={`task__status ${task.completed ? "task__status--done" : ""}`}>
                  {task.completed ? "Выполнено" : "В работе"}
                </span>
                {task.project && <span className="task__project">{task.project}</span>}
                {task.deadline && (
                  <span className={`task__deadline ${overdue ? "task__deadline--overdue" : ""}`}>
                    до {task.deadline}
                    {overdue && " · просрочено"}
                  </span>
                )}
              </p>
            </div>

            <div className="task__actions">
              <button
                className="icon-btn"
                type="button"
                onClick={startEditing}
                aria-label={`Редактировать задачу «${task.title}»`}
                title="Редактировать"
              >
                <EditIcon />
              </button>
              <button
                className="icon-btn icon-btn--danger"
                type="button"
                onClick={removeTask}
                aria-label={`Удалить задачу «${task.title}»`}
                title="Удалить"
              >
                <TrashIcon />
              </button>
            </div>
          </>
        )}
      </div>
    </li>
  );
}
