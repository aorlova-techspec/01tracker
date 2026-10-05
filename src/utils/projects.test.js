import test from "node:test";
import assert from "node:assert/strict";
import {
  addProject,
  collectProjectOptions,
  normalizeProjects,
  removeProject,
} from "../utils/projects.js";

test("normalizeProjects чистит и дедуплицирует словарь", () => {
  assert.deepEqual(
    normalizeProjects([" Сайт ", "Сайт", "", 42, null, "Редизайн"]),
    ["Сайт", "Редизайн"]
  );
  assert.deepEqual(normalizeProjects("мусор"), []);
  assert.deepEqual(normalizeProjects({}), []);
});

test("addProject добавляет новый проект и ловит дубликаты", () => {
  const first = addProject([], "  Сайт клиента ");
  assert.equal(first.added, true);
  assert.deepEqual(first.projects, ["Сайт клиента"]);

  const duplicate = addProject(first.projects, "сайт клиента");
  assert.equal(duplicate.added, false);
  assert.equal(duplicate.duplicate, true);
  assert.deepEqual(duplicate.projects, ["Сайт клиента"]);

  const empty = addProject(first.projects, "   ");
  assert.equal(empty.added, false);
});

test("removeProject убирает проект по имени", () => {
  const projects = ["Сайт", "Редизайн"];
  assert.deepEqual(removeProject(projects, "Сайт"), ["Редизайн"]);
  assert.deepEqual(removeProject(projects, "Нет такого"), projects);
});

test("collectProjectOptions объединяет словарь и проекты задач", () => {
  const projects = ["Сайт"];
  const tasks = [
    { project: "Редизайн" },
    { project: "" },
    { project: "Сайт" },
    { project: "Мобильное приложение" },
  ];

  assert.deepEqual(collectProjectOptions(projects, tasks), [
    "Сайт",
    "Редизайн",
    "Мобильное приложение",
  ]);
});
