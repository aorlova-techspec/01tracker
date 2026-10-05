export const STORAGE_KEY = "daily-task-tracker:tasks";

const isFilledString = (value) => typeof value === "string" && value.trim().length > 0;

const normalizeDeadline = (value) => {
  if (!isFilledString(value)) return "";
  const raw = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const [year, month, day] = raw.split("-").map(Number);
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day
    ? raw
    : "";
};

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const normalizeTask = (task) => {
  if (!task || typeof task !== "object") return null;
  if (!isFilledString(task.title)) return null;

  const parsedDate = new Date(task.createdAt);
  return {
    id: isFilledString(task.id) ? task.id : generateId(),
    title: task.title.trim(),
    description: typeof task.description === "string" ? task.description.trim() : "",
    project: isFilledString(task.project) ? task.project.trim() : "",
    deadline: normalizeDeadline(task.deadline),
    completed: task.completed === true,
    createdAt: Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
  };
};

export const normalizeTasks = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeTask).filter(Boolean);
};

export const createTask = ({ title, description = "", project = "", deadline = "" }) => ({
  id: generateId(),
  title: title.trim(),
  description: description.trim(),
  project: project.trim(),
  deadline: normalizeDeadline(deadline),
  completed: false,
  createdAt: new Date().toISOString(),
});

export const toggleTask = (tasks, id) =>
  tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task));

export const updateTask = (tasks, id, { title, description, project, deadline }) =>
  tasks.map((task) =>
    task.id === id
      ? {
          ...task,
          title: title.trim(),
          description: (description ?? "").trim(),
          project: (project ?? "").trim(),
          deadline: normalizeDeadline(deadline ?? ""),
        }
      : task
  );

export const deleteTask = (tasks, id) => tasks.filter((task) => task.id !== id);

export const getStats = (tasks) => {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const remaining = total - completed;
  const progress = total === 0 ? 0 : Math.floor((completed / total) * 100);

  return { total, completed, remaining, progress };
};

export const isOverdue = (task) => {
  if (!task.deadline || task.completed) return false;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const deadlineDate = new Date(`${task.deadline}T00:00:00`);
  if (Number.isNaN(deadlineDate.getTime())) return false;
  return deadlineDate < startOfToday;
};

export const FILTERS = [
  { id: "all", label: "Все" },
  { id: "active", label: "Активные" },
  { id: "completed", label: "Выполненные" },
];

export const filterTasks = (tasks, filter) => {
  if (filter === "active") return tasks.filter((task) => !task.completed);
  if (filter === "completed") return tasks.filter((task) => task.completed);
  return tasks;
};
