import { useCallback, useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import StatsCards from "./components/StatsCards.jsx";
import AddTaskForm from "./components/AddTaskForm.jsx";
import ProjectsBlock from "./components/ProjectsBlock.jsx";
import Filters from "./components/Filters.jsx";
import ExportButton from "./components/ExportButton.jsx";
import TaskList from "./components/TaskList.jsx";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import {
  STORAGE_KEY,
  createTask,
  deleteTask,
  filterTasks,
  getStats,
  normalizeTasks,
  toggleTask,
  updateTask,
} from "./utils/tasks.js";
import {
  STORAGE_KEY as PROJECTS_KEY,
  addProject,
  collectProjectOptions,
  normalizeProjects,
  removeProject,
} from "./utils/projects.js";

export default function App() {
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("all");

  const notify = useCallback((message) => setNotice(message), []);

  const validate = useCallback(
    (parsed) => {
      if (!Array.isArray(parsed)) {
        notify("Сохранённые данные имели неверный формат и были сброшены.");
        return [];
      }
      const normalized = normalizeTasks(parsed);
      if (normalized.length !== parsed.length) {
        notify("Часть сохранённых задач была восстановлена некорректно и удалена.");
      }
      return normalized;
    },
    [notify]
  );

  const [tasks, setTasks] = useLocalStorage(STORAGE_KEY, [], { onNotice: notify, validate });
  const [projects, setProjects] = useLocalStorage(PROJECTS_KEY, [], {
    onNotice: notify,
    validate: normalizeProjects,
  });

  const projectOptions = useMemo(() => collectProjectOptions(projects, tasks), [projects, tasks]);
  const usedProjects = useMemo(
    () => tasks.map((task) => task.project).filter(Boolean),
    [tasks]
  );

  const handleAddProject = useCallback(
    (name) => {
      const result = addProject(projects, name);
      if (result.added) setProjects(result.projects);
      return result;
    },
    [projects, setProjects]
  );

  const handleRemoveProject = useCallback(
    (name) => setProjects((previous) => removeProject(previous, name)),
    [setProjects]
  );

  const stats = useMemo(() => getStats(tasks), [tasks]);

  const counts = useMemo(
    () => ({
      all: tasks.length,
      active: tasks.filter((task) => !task.completed).length,
      completed: tasks.filter((task) => task.completed).length,
    }),
    [tasks]
  );

  const visibleTasks = useMemo(() => filterTasks(tasks, filter), [tasks, filter]);

  const handleAdd = useCallback(
    ({ title, description, project, deadline }) => {
      if (!title.trim()) return false;
      setTasks((previous) => [createTask({ title, description, project, deadline }), ...previous]);
      return true;
    },
    [setTasks]
  );

  const handleToggle = useCallback(
    (id) => setTasks((previous) => toggleTask(previous, id)),
    [setTasks]
  );

  const handleUpdate = useCallback(
    (id, values) => {
      if (!values.title.trim()) return false;
      setTasks((previous) => updateTask(previous, id, values));
      return true;
    },
    [setTasks]
  );

  const handleDelete = useCallback(
    (id) => setTasks((previous) => deleteTask(previous, id)),
    [setTasks]
  );

  return (
    <div className="app">
      <div className="app__container">
        <Header />

        {notice && (
          <div className="notice notice--warning" role="alert">
            <span>{notice}</span>
            <button
              type="button"
              className="notice__close"
              onClick={() => setNotice("")}
              aria-label="Скрыть сообщение"
            >
              ×
            </button>
          </div>
        )}

        <StatsCards stats={stats} />

        <AddTaskForm onAdd={handleAdd} projectOptions={projectOptions} />

        <ProjectsBlock
          projects={projects}
          usedProjects={usedProjects}
          onAdd={handleAddProject}
          onRemove={handleRemoveProject}
        />

        <div className="card toolbar">
          <Filters current={filter} onChange={setFilter} counts={counts} />
          <ExportButton tasks={tasks} onNotice={notify} />
        </div>

        <TaskList
          tasks={visibleTasks}
          allTasks={tasks}
          filter={filter}
          stats={stats}
          projectOptions={projectOptions}
          onToggle={handleToggle}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />

        <footer className="footer">
          Данные хранятся локально в вашем браузере (localStorage) — доступны только вам.
        </footer>
      </div>
    </div>
  );
}
