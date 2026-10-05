import { useState } from "react";
import { exportTasksToExcel } from "../utils/export.js";

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none">
    <path
      d="M12 4v10m0 0 4-4m-4 4-4-4M5 18h14"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function ExportButton({ tasks, onNotice }) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy || tasks.length === 0) return;
    setBusy(true);
    try {
      await exportTasksToExcel(tasks);
    } catch (error) {
      onNotice("Не удалось выгрузить файл Excel. Попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      className="btn btn--ghost export-btn"
      type="button"
      onClick={handleClick}
      disabled={busy || tasks.length === 0}
      title="Скачать все задачи в файл .xlsx"
    >
      <DownloadIcon />
      {busy ? "Готовим файл…" : `Выгрузить в Excel (${tasks.length})`}
    </button>
  );
}
