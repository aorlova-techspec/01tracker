import test from "node:test";
import assert from "node:assert/strict";
import { errorMessage, taskFromRow, taskToRow } from "../utils/rows.js";

test("taskToRow/taskFromRow — сохраняют и восстанавливают задачу", () => {
  const task = {
    id: "abc",
    title: "Отчёт",
    description: "к пятнице",
    project: "Сайт",
    deadline: "2026-10-30",
    completed: true,
    createdAt: "2026-10-05T10:00:00.000Z",
  };

  const row = taskToRow(task);
  assert.equal(row.deadline, "2026-10-30");
  assert.equal(row.created_at, task.createdAt);
  assert.deepEqual(taskFromRow(row), task);
});

test("taskFromRow — пустые поля из базы превращаются в пустые строки", () => {
  const restored = taskFromRow({
    id: "x",
    title: "Задача",
    description: null,
    project: null,
    deadline: null,
    completed: false,
    created_at: null,
  });

  assert.equal(restored.description, "");
  assert.equal(restored.project, "");
  assert.equal(restored.deadline, "");
  assert.ok(restored.createdAt);
});

test("taskToRow — пустой дедлайн уходит в базу как null", () => {
  const row = taskToRow({ deadline: "" });
  assert.equal(row.deadline, null);
});

test("errorMessage — переводит ошибки Supabase на русский", () => {
  assert.equal(errorMessage({ message: "Invalid login credentials" }), "Неверная почта или пароль.");
  assert.equal(
    errorMessage({ message: "User already registered" }),
    "Эта почта уже зарегистрирована."
  );
  assert.equal(errorMessage({ message: "Password should be at least 6 characters" }), "Пароль слишком простой: минимум 6 символов.");
  assert.equal(errorMessage({ message: "Failed to fetch" }), "Нет связи с сервером. Проверьте интернет.");
  assert.equal(errorMessage(null), "Не удалось выполнить операцию.");
  assert.ok(errorMessage({ message: "что-то новое" }).startsWith("Ошибка:"));
});
