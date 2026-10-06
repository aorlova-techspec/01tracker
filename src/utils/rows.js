export const taskToRow = (task) => ({
  id: task.id,
  title: task.title,
  description: task.description,
  project: task.project,
  deadline: task.deadline || null,
  completed: task.completed,
  created_at: task.createdAt,
});

export const taskFromRow = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description ?? "",
  project: row.project ?? "",
  deadline: row.deadline ?? "",
  completed: row.completed === true,
  createdAt: row.created_at ?? new Date().toISOString(),
});

export const errorMessage = (error) => {
  const message = String(error?.message ?? "");

  if (message.includes("Invalid login credentials")) return "Неверная почта или пароль.";
  if (message.includes("already registered")) return "Эта почта уже зарегистрирована.";
  if (message.toLowerCase().includes("password"))
    return "Пароль слишком простой: минимум 6 символов.";
  if (message.includes("Email not confirmed"))
    return "Почта не подтверждена — проверьте входящие письма.";
  if (message.includes("Failed to fetch") || message.includes("NetworkError"))
    return "Нет связи с сервером. Проверьте интернет.";
  if (message.includes("duplicate key")) return "Такая запись уже есть.";
  if (message) return `Ошибка: ${message}`;
  return "Не удалось выполнить операцию.";
};
