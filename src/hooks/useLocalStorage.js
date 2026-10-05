import { useCallback, useEffect, useState } from "react";

const readStorage = (key, fallback, onNotice, validate) => {
  let raw = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    onNotice("Доступ к хранилищу браузера запрещён — данные не будут сохраняться.");
    return fallback;
  }

  if (raw === null) return fallback;

  try {
    const parsed = JSON.parse(raw);
    return validate ? validate(parsed) : parsed;
  } catch {
    onNotice("Сохранённые данные повреждены и были сброшены.");
    return fallback;
  }
};

export const useLocalStorage = (key, initialValue, { onNotice, validate } = {}) => {
  const notify = onNotice ?? (() => {});
  const [value, setValue] = useState(() => readStorage(key, initialValue, notify, validate));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      notify(
        error?.name === "QuotaExceededError"
          ? "Хранилище браузера переполнено — новые данные не сохранятся."
          : "Не удалось сохранить данные в браузере."
      );
    }
  }, [key, value, notify]);

  const reset = useCallback(() => setValue(initialValue), [initialValue]);

  return [value, setValue, reset];
};
