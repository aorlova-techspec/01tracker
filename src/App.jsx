import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header.jsx";
import StatsCards from "./components/StatsCards.jsx";
import AddTaskForm from "./components/AddTaskForm.jsx";
import ProjectsBlock from "./components/ProjectsBlock.jsx";
import Filters from "./components/Filters.jsx";
import ExportButton from "./components/ExportButton.jsx";
import TaskList from "./components/TaskList.jsx";
import WelcomeScreen from "./components/WelcomeScreen.jsx";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { useAuth } from "./hooks/useAuth.js";
import { supabase } from "./lib/supabase.js";
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
import { errorMessage, taskFromRow, taskToRow } from "./utils/rows.js";
import logo from "./assets/logo.png";

const GUEST_KEY = "daily-task-tracker:guest";

export default function App() {
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("all");
  const [loadingCloud, setLoadingCloud] = useState(false);
  const [cloudTasks, setCloudTasks] = useState([]);
  const [cloudProjects, setCloudProjects] = useState([]);

  const notify = useCallback((message) => setNotice(message), []);

  const validate = useCallback((parsed) => {
    if (!Array.isArray(parsed)) {
      notify("Сохранённые данные имели неверный формат и были сброшены.");
      return [];
    }
    const normalized = normalizeTasks(parsed);
    if (normalized.length !== parsed.length) {
      notify("Часть сохранённых задач была восстановлена некорректно и удалена.");
    }
    return normalized;
  }, [notify]);

  const [localTasks, setLocalTasks] = useLocalStorage(STORAGE_KEY, [], {
    onNotice: notify,
    validate,
  });
  const [localProjects, setLocalProjects] = useLocalStorage(PROJECTS_KEY, [], {
    onNotice: notify,
    validate: normalizeProjects,
  });

  const { user, signIn, signUp, signOut, configured, ready } = useAuth();
  const [guest, setGuest] = useLocalStorage(GUEST_KEY, false);
  const isCloud = Boolean(user);

  const tasks = isCloud ? cloudTasks : localTasks;
  const projects = isCloud ? cloudProjects : localProjects;

  const localSnapshot = useRef({ tasks: [], projects: [] });
  useEffect(() => {
    localSnapshot.current = { tasks: localTasks, projects: localProjects };
  }, [localTasks, localProjects]);

  useEffect(() => {
    if (!user || !supabase) return undefined;
    let cancelled = false;

    const load = async () => {
      setLoadingCloud(true);
      const [tasksResult, projectsResult] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("projects").select("name").order("name", { ascending: true }),
      ]);
      if (cancelled) return;
      setLoadingCloud(false);

      if (tasksResult.error) {
        notify(`Не удалось загрузить задачи: ${errorMessage(tasksResult.error)}`);
        return;
      }
      if (projectsResult.error) {
        notify(`Не удалось загрузить проекты: ${errorMessage(projectsResult.error)}`);
        return;
      }

      let loadedTasks = tasksResult.data.map(taskFromRow);
      let loadedProjects = projectsResult.data.map((row) => row.name);
      const snapshot = localSnapshot.current;

      if (loadedTasks.length === 0 && snapshot.tasks.length > 0) {
        const { error } = await supabase.from("tasks").insert(snapshot.tasks.map(taskToRow));
        if (error) {
          notify(`Не удалось импортировать локальные задачи: ${errorMessage(error)}`);
        } else {
          loadedTasks = snapshot.tasks;
          notify(`Из этого браузера импортировано задач: ${snapshot.tasks.length}.`);
        }
      }

      if (loadedProjects.length === 0 && snapshot.projects.length > 0) {
        const { error } = await supabase
          .from("projects")
          .insert(snapshot.projects.map((name) => ({ name })));
        if (!error) loadedProjects = snapshot.projects;
      }

      if (cancelled) return;
      setCloudTasks(loadedTasks);
      setCloudProjects(loadedProjects);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user, notify]);

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
  const projectOptions = useMemo(() => collectProjectOptions(projects, tasks), [projects, tasks]);
  const usedProjects = useMemo(
    () => tasks.map((task) => task.project).filter(Boolean),
    [tasks]
  );

  const handleAdd = useCallback(
    async ({ title, description, project, deadline }) => {
      if (!title.trim()) return false;
      const task = createTask({ title, description, project, deadline });

      if (isCloud) {
        const { error } = await supabase.from("tasks").insert(taskToRow(task));
        if (error) {
          notify(`Не удалось сохранить задачу: ${errorMessage(error)}`);
          return false;
        }
        setCloudTasks((previous) => [task, ...previous]);
        return true;
      }

      setLocalTasks((previous) => [task, ...previous]);
      return true;
    },
    [isCloud, notify, setLocalTasks]
  );

  const handleToggle = useCallback(
    (id) => {
      const setter = isCloud ? setCloudTasks : setLocalTasks;
      let updated = null;
      setter((previous) =>
        previous.map((task) => {
          if (task.id !== id) return task;
          updated = toggleTask([task], id)[0];
          return updated;
        })
      );

      if (isCloud && updated) {
        supabase
          .from("tasks")
          .update({ completed: updated.completed })
          .eq("id", id)
          .then(({ error }) => {
            if (error) notify(`Не удалось сохранить изменение: ${errorMessage(error)}`);
          });
      }
    },
    [isCloud, notify, setLocalTasks]
  );

  const handleUpdate = useCallback(
    async (id, values) => {
      if (!values.title.trim()) return false;

      const patch = {
        title: values.title.trim(),
        description: (values.description ?? "").trim(),
        project: (values.project ?? "").trim(),
        deadline: values.deadline || null,
      };

      if (isCloud) {
        const { error } = await supabase.from("tasks").update(patch).eq("id", id);
        if (error) {
          notify(`Не удалось сохранить задачу: ${errorMessage(error)}`);
          return false;
        }
        setCloudTasks((previous) =>
          previous.map((task) => (task.id === id ? { ...task, ...patch, deadline: patch.deadline ?? "" } : task))
        );
        return true;
      }

      setLocalTasks((previous) => updateTask(previous, id, values));
      return true;
    },
    [isCloud, notify, setLocalTasks]
  );

  const handleDelete = useCallback(
    async (id) => {
      if (isCloud) {
        const { error } = await supabase.from("tasks").delete().eq("id", id);
        if (error) {
          notify(`Не удалось удалить задачу: ${errorMessage(error)}`);
          return;
        }
        setCloudTasks((previous) => deleteTask(previous, id));
        return;
      }
      setLocalTasks((previous) => deleteTask(previous, id));
    },
    [isCloud, notify, setLocalTasks]
  );

  const handleAddProject = useCallback(
    async (name) => {
      const result = addProject(projects, name);
      if (!result.added) return result;

      if (isCloud) {
        const { error } = await supabase.from("projects").insert({ name: name.trim() });
        if (error) {
          if (String(error.message).includes("duplicate")) {
            return { projects, added: false, duplicate: true };
          }
          notify(`Не удалось сохранить проект: ${errorMessage(error)}`);
          return { projects, added: false };
        }
        setCloudProjects(result.projects);
        return result;
      }

      setLocalProjects(result.projects);
      return result;
    },
    [projects, isCloud, notify, setLocalProjects]
  );

  const handleRemoveProject = useCallback(
    async (name) => {
      if (isCloud) {
        const { error } = await supabase.from("projects").delete().eq("name", name);
        if (error) {
          notify(`Не удалось удалить проект: ${errorMessage(error)}`);
          return;
        }
        setCloudProjects((previous) => removeProject(previous, name));
        return;
      }
      setLocalProjects((previous) => removeProject(previous, name));
    },
    [isCloud, notify, setLocalProjects]
  );

  if (configured && !ready) {
    return (
      <div className="welcome welcome--splash" role="status">
        <img className="welcome__logo" src={logo} alt="" width="72" height="72" />
        <p className="welcome__splash-text">Проверяем сессию…</p>
      </div>
    );
  }

  if (configured && !user && !guest) {
    return (
      <WelcomeScreen
        signIn={signIn}
        signUp={signUp}
        onAuthenticated={() => setGuest(false)}
        onGuest={() => setGuest(true)}
      />
    );
  }

  return (
    <div className="app">
      <div className="app__container">
        <Header
          configured={configured}
          user={user}
          onSignIn={() => setGuest(false)}
          onSignOut={signOut}
        />

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

        {loadingCloud && (
          <div className="notice notice--info" role="status">
            Загружаем задачи из облака…
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
          {isCloud
            ? "Задачи хранятся в облаке и синхронизируются между устройствами — доступны только вам."
            : "Данные хранятся локально в вашем браузере (localStorage) — доступны только вам."}
        </footer>
      </div>
    </div>
  );
}
