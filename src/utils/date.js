const dateFormatters = {
  full: new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  }),
  task: new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }),
};

export const formatFullDate = (date = new Date()) => {
  try {
    return dateFormatters.full.format(date);
  } catch {
    return date.toLocaleDateString();
  }
};

export const formatTaskDate = (isoString) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return dateFormatters.task.format(date);
  } catch {
    return date.toLocaleString();
  }
};
