import { formatTaskDate } from "./date.js";

const STATUS_LABEL = { true: "Выполнено", false: "В работе" };

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat("ru-RU").format(date);
  } catch {
    return value;
  }
};

const buildRows = (tasks) =>
  tasks.map((task) => ({
    Название: task.title,
    Описание: task.description,
    Проект: task.project,
    Дедлайн: formatDate(task.deadline),
    Статус: STATUS_LABEL[String(task.completed)],
    "Создана": formatTaskDate(task.createdAt),
  }));

export const exportTasksToExcel = async (tasks) => {
  const XLSX = await import("xlsx");

  const worksheet = XLSX.utils.json_to_sheet(buildRows(tasks));
  worksheet["!cols"] = [
    { wch: 40 },
    { wch: 40 },
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Задачи");

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `daily-task-tracker-${date}.xlsx`);
  return true;
};
