import test from "node:test";
import assert from "node:assert/strict";
import {
  FILTERS,
  createTask,
  deleteTask,
  filterTasks,
  getStats,
  isOverdue,
  normalizeTasks,
  toggleTask,
  updateTask,
} from "../utils/tasks.js";

test("createTask создаёт валидную задачу", () => {
  const task = createTask({ title: "  Сделать отчёт  ", description: " до 18:00 " });

  assert.equal(task.title, "Сделать отчёт");
  assert.equal(task.description, "до 18:00");
  assert.equal(task.project, "");
  assert.equal(task.deadline, "");
  assert.equal(task.completed, false);
  assert.ok(task.id);
  assert.ok(!Number.isNaN(new Date(task.createdAt).getTime()));
});

test("createTask сохраняет проект и дедлайн", () => {
  const task = createTask({
    title: "Смета",
    project: " Сайт клиента ",
    deadline: "2026-10-31",
  });

  assert.equal(task.project, "Сайт клиента");
  assert.equal(task.deadline, "2026-10-31");
});

test("createTask отбрасывает некорректный дедлайн", () => {
  assert.equal(createTask({ title: "а", deadline: "31.10.2026" }).deadline, "");
  assert.equal(createTask({ title: "а", deadline: "2026-13-45" }).deadline, "");
  assert.equal(createTask({ title: "а", deadline: "" }).deadline, "");
});

test("toggleTask переключает статус только у нужной задачи", () => {
  const first = createTask({ title: "Первая" });
  const second = createTask({ title: "Вторая" });
  const tasks = [first, second];

  const toggled = toggleTask(tasks, first.id);
  assert.equal(toggled.find((task) => task.id === first.id).completed, true);
  assert.equal(toggled.find((task) => task.id === second.id).completed, false);

  const restored = toggleTask(toggled, first.id);
  assert.equal(restored.find((task) => task.id === first.id).completed, false);
});

test("updateTask меняет название, описание, проект и дедлайн", () => {
  const task = createTask({ title: "Старое" });
  const [updated] = updateTask([task], task.id, {
    title: "Новое",
    description: "детали",
    project: "Редизайн",
    deadline: "2026-11-01",
  });

  assert.equal(updated.title, "Новое");
  assert.equal(updated.description, "детали");
  assert.equal(updated.project, "Редизайн");
  assert.equal(updated.deadline, "2026-11-01");
  assert.equal(updated.id, task.id);
});

test("deleteTask удаляет задачу по id", () => {
  const first = createTask({ title: "Первая" });
  const second = createTask({ title: "Вторая" });

  const result = deleteTask([first, second], first.id);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, second.id);
});

test("getStats считает статистику и процент", () => {
  const tasks = ["1", "2", "3", "4", "5", "6", "7", "8"].map((title) =>
    createTask({ title })
  );
  const halfDone = tasks.map((task, index) => ({ ...task, completed: index < 5 }));

  assert.deepEqual(getStats(tasks), { total: 8, completed: 0, remaining: 8, progress: 0 });
  assert.deepEqual(getStats(halfDone), { total: 8, completed: 5, remaining: 3, progress: 62 });
  assert.deepEqual(getStats([]), { total: 0, completed: 0, remaining: 0, progress: 0 });
});

test("filterTasks фильтрует по статусу", () => {
  const active = createTask({ title: "Активная" });
  const done = { ...createTask({ title: "Готовая" }), completed: true };
  const tasks = [active, done];

  assert.equal(filterTasks(tasks, "all").length, 2);
  assert.deepEqual(filterTasks(tasks, "active"), [active]);
  assert.deepEqual(filterTasks(tasks, "completed"), [done]);
  assert.equal(FILTERS.length, 3);
});

test("normalizeTasks чинит повреждённые данные", () => {
  const valid = createTask({ title: "Нормальная" });
  const result = normalizeTasks([
    valid,
    null,
    { title: "   " },
    { description: "без названия" },
    { title: "Без id и даты" },
  ]);

  assert.equal(result.length, 2);
  assert.equal(result[0].id, valid.id);
  assert.ok(result[1].id.length > 0);
  assert.ok(!Number.isNaN(new Date(result[1].createdAt).getTime()));

  assert.deepEqual(normalizeTasks("мусор"), []);
  assert.deepEqual(normalizeTasks({}), []);
});

const toDayString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

test("isOverdue ?????????? ???????????? ??????", () => {
  const yesterday = toDayString(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const tomorrow = toDayString(new Date(Date.now() + 24 * 60 * 60 * 1000));

  const overdue = createTask({ title: "??????????", deadline: yesterday });
  const inTime = createTask({ title: "???????", deadline: tomorrow });
  const noDeadline = createTask({ title: "??? ?????" });
  const done = { ...createTask({ title: "??????", deadline: yesterday }), completed: true };

  assert.equal(isOverdue(overdue), true);
  assert.equal(isOverdue(inTime), false);
  assert.equal(isOverdue(noDeadline), false);
  assert.equal(isOverdue(done), false);
});

test("normalizeTasks ????????? ?????? ? ???????, ????? ????? ??????", () => {
  const [task] = normalizeTasks([
    { title: "??????", project: "  ????????? ?????????? ", deadline: "2026-12-31" },
    { title: "????? ????", deadline: "?? ????" },
  ]);

  assert.equal(task.project, "????????? ??????????");
  assert.equal(task.deadline, "2026-12-31");
  assert.equal(normalizeTasks([{ title: "x", deadline: "2026-13-40" }])[0].deadline, "");
});
