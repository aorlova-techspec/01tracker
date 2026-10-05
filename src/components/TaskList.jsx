import TaskItem from "./TaskItem.jsx";
import EmptyState from "./EmptyState.jsx";

const EMPTY_MESSAGES = {
  noTasks: {
    title: "На сегодня задач нет.",
    text: "Добавьте первую задачу, чтобы начать планирование.",
  },
  allCompleted: {
    title: "Все задачи выполнены.",
    text: "Отличный результат!",
  },
  noActive: {
    title: "Активных задач нет.",
    text: "Все задачи на сегодня закрыты или их ещё не добавили.",
  },
  noCompleted: {
    title: "Выполненных задач пока нет.",
    text: "Отметьте первую задачу галочкой, чтобы она появилась здесь.",
  },
};

const getEmptyMessage = (tasks, filter, stats) => {
  if (tasks.length === 0) return EMPTY_MESSAGES.noTasks;
  if (stats.remaining === 0) return EMPTY_MESSAGES.allCompleted;
  if (filter === "active") return EMPTY_MESSAGES.noActive;
  return EMPTY_MESSAGES.noCompleted;
};

export default function TaskList({
  tasks,
  allTasks,
  filter,
  stats,
  projectOptions,
  onToggle,
  onUpdate,
  onDelete,
}) {
  const hasAnyTask = allTasks.length > 0;
  const allCompleted = hasAnyTask && stats.remaining === 0;
  const message = getEmptyMessage(allTasks, filter, stats);

  return (
    <section className="card list-card" aria-label="Список задач">
      <div className="list-card__head">
        <h2 className="section-title">Задачи</h2>
        {hasAnyTask && (
          <p className="list-card__count">
            Показано {tasks.length} из {allTasks.length}
          </p>
        )}
      </div>

      {allCompleted && filter === "all" && (
        <p className="notice notice--success" role="status">
          Все задачи выполнены. Отличный результат!
        </p>
      )}

      {tasks.length > 0 ? (
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              projectOptions={projectOptions}
              onToggle={() => onToggle(task.id)}
              onUpdate={(values) => onUpdate(task.id, values)}
              onDelete={() => onDelete(task.id)}
            />
          ))}
        </ul>
      ) : (
        <EmptyState title={message.title} text={message.text} />
      )}
    </section>
  );
}
