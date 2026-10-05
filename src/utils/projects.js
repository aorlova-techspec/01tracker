export const STORAGE_KEY = "daily-task-tracker:projects";

export const normalizeProjects = (raw) => {
  if (!Array.isArray(raw)) return [];
  const names = raw
    .filter((value) => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return [...new Set(names)];
};

export const addProject = (projects, name) => {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return { projects, added: false };
  if (projects.some((project) => project.toLowerCase() === trimmed.toLowerCase())) {
    return { projects, added: false, duplicate: true };
  }
  return { projects: [...projects, trimmed], added: true };
};

export const removeProject = (projects, name) =>
  projects.filter((project) => project !== name);

export const collectProjectOptions = (projects, tasks) => {
  const fromTasks = tasks
    .map((task) => task.project)
    .filter((name) => typeof name === "string" && name.trim().length > 0);
  return [...new Set([...projects, ...fromTasks])];
};
