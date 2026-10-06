import { spawn } from "node:child_process";
import { mkdir, readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const shotsDir = path.join(root, "screenshots");
const downloadDir = path.join(os.tmpdir(), "daily-task-tracker-export");
const PORT = 4173;
const URL = `http://127.0.0.1:${PORT}`;
const CHROME =
  process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const failures = [];
const consoleErrors = [];

let checkName = "";
const check = (condition, message) => {
  if (condition) {
    console.log(`  ok   ${checkName}: ${message}`);
  } else {
    failures.push(`${checkName}: ${message}`);
    console.log(`  FAIL ${checkName}: ${message}`);
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const startPreview = () => {
  const viteBin = path.join(root, "node_modules", "vite", "bin", "vite.js");
  const child = spawn(
    process.execPath,
    [viteBin, "preview", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"],
    { cwd: root, stdio: "ignore" }
  );

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("vite preview не запустился за 30 секунд"));
    }, 30000);

    const probe = async () => {
      try {
        const res = await fetch(URL);
        if (res.ok) {
          clearTimeout(timer);
          resolve(child);
          return;
        }
      } catch {
        /* сервер ещё поднимается */
      }
      setTimeout(probe, 300);
    };

    probe();
  });
};

const stats = (page) =>
  page.$$eval(".stat", (nodes) =>
    nodes.map((node) => ({
      label: node.querySelector(".stat__label").textContent.trim(),
      value: node.querySelector(".stat__value").textContent.trim(),
    }))
  );

const titles = (page) =>
  page.$$eval(".task__title", (nodes) => nodes.map((node) => node.textContent.trim()));

const run = async () => {
  await mkdir(shotsDir, { recursive: true });
  await rm(downloadDir, { recursive: true, force: true });
  await mkdir(downloadDir, { recursive: true });

  let preview = null;
  let browser = null;

  try {
    preview = await startPreview();

    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    page.on("dialog", (dialog) => dialog.accept());
    page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`console.error: ${message.text()}`);
    });
    page.on("response", (response) => {
      if (response.status() >= 400 && response.url().startsWith(URL)) {
        consoleErrors.push(`HTTP ${response.status()}: ${response.url()}`);
      }
    });

    checkName = "0. экран входа";
    await page.goto(URL, { waitUntil: "networkidle0" });
    const welcome = await page.$(".welcome");
    if (welcome) {
      check(Boolean(await page.$("#auth-email")), "показана форма входа/регистрации");
      check(!(await page.$(".app__container")), "трекер скрыт до входа");
      const welcomeTitle = await page.$eval(".welcome__title", (el) => el.textContent.trim());
      check(welcomeTitle === "Daily Task Tracker", "название и описание на фоне");
      check(Boolean(await page.$(".welcome__features")), "показаны преимущества продукта");
      await page.screenshot({ path: path.join(shotsDir, "06-welcome.png") });
      await page.evaluate(() => localStorage.setItem("daily-task-tracker:guest", "1"));
      await page.reload({ waitUntil: "networkidle0" });
    } else {
      console.log("  skip 0. экран входа: в этой сборке Supabase не настроен");
    }

    checkName = "1. пустой старт";
    await page.goto(URL, { waitUntil: "networkidle0" });
    const emptyText = await page.$eval(".empty", (node) => node.textContent);
    check(emptyText.includes("На сегодня задач нет."), "показано пустое состояние");
    const initialStats = await stats(page);
    check(
      initialStats[0].value === "0" &&
        initialStats[1].value === "0" &&
        initialStats[2].value === "0" &&
        initialStats[3].value === "0%",
      "статистика в нуле на старте"
    );
    await page.screenshot({ path: path.join(shotsDir, "01-first-run.png"), fullPage: true });

    checkName = "2. добавление одной задачи";
    await page.type("#task-title", "Подготовить презентацию");
    await page.click(".task-form__submit");
    check((await titles(page)).length === 1, "задача появилась в списке");
    check((await page.$eval("#task-title", (el) => el.value)) === "", "форма очищена");
    check((await stats(page))[0].value === "1", "статистика: всего задач = 1");

    checkName = "3. добавление нескольких задач";
    await page.type("#task-title", "Позвонить клиенту");
    await page.type("#task-description", "уточнить сроки по проекту");
    await page.click(".task-form__submit");
    await page.type("#task-title", "Отправить отчёт");
    await page.click(".task-form__submit");
    check((await titles(page)).length === 3, "в списке 3 задачи");
    check((await stats(page))[0].value === "3", "статистика: всего задач = 3");

    checkName = "4. пустая задача";
    await page.click(".task-form__submit");
    const errorText = await page.$eval(".task-form__error", (el) => el.textContent);
    check(errorText.includes("Введите название"), "ошибка валидации показана");
    check((await titles(page)).length === 3, "задача не добавлена");

    checkName = "5-6. выполнение и статистика";
    await page.click(".task__check input");
    const statsAfterToggle = await stats(page);
    check(statsAfterToggle[1].value === "1", "выполнено = 1");
    check(statsAfterToggle[2].value === "2", "осталось = 2");
    check(statsAfterToggle[3].value === "33%", "прогресс = 33%");
    const progressWidth = await page.$eval(".progress__fill", (el) => el.style.width);
    check(progressWidth === "33%", `progress bar заполнен на ${progressWidth}`);
    const doneClass = await page.$eval(".task", (el) => el.className);
    check(doneClass.includes("task--completed"), "задача помечена выполненной");

    checkName = "7. фильтр «Активные»";
    await page.$$eval(".filter-btn", (buttons) => buttons[1].click());
    check((await titles(page)).length === 2, "показаны 2 активные задачи");

    checkName = "8. фильтр «Выполненные»";
    await page.$$eval(".filter-btn", (buttons) => buttons[2].click());
    check((await titles(page)).length === 1, "показана 1 выполненная задача");

    checkName = "9. редактирование";
    await page.$$eval(".filter-btn", (buttons) => buttons[0].click());
    await page.click(".task__actions .icon-btn");
    await page.click(".task__edit .input");
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.type(".task__edit .input", "Подготовить презентацию для совета директоров");
    await page.$$eval(".task__edit-actions button", (buttons) => buttons[0].click());
    const editedTitles = await titles(page);
    check(
      editedTitles.includes("Подготовить презентацию для совета директоров"),
      "название задачи обновлено"
    );

    checkName = "10. удаление";
    const beforeDelete = (await titles(page)).length;
    await page.click(".task__actions .icon-btn--danger");
    await sleep(150);
    check((await titles(page)).length === beforeDelete - 1, "задача удалена после подтверждения");

    checkName = "11. сохранение после перезагрузки";
    const beforeReload = await titles(page);
    await page.reload({ waitUntil: "networkidle0" });
    const afterReload = await titles(page);
    check(
      JSON.stringify(beforeReload) === JSON.stringify(afterReload),
      "задачи сохранились в localStorage"
    );
    await page.screenshot({ path: path.join(shotsDir, "03-final-desktop.png"), fullPage: true });

    checkName = "12. мобильная версия";
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await sleep(250);
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    check(!hasOverflow, "горизонтального скролла нет");
    await page.screenshot({ path: path.join(shotsDir, "02-mobile.png"), fullPage: true });
    await page.setViewport({ width: 1280, height: 900 });
    await sleep(200);

    checkName = "13-14. все задачи выполнены";
    const checkboxes = await page.$$(".task__check input");
    for (const box of checkboxes) {
      const checked = await box.evaluate((el) => el.checked);
      if (!checked) await box.click();
    }
    await sleep(200);
    const allDoneNotice = await page.$eval(".notice--success", (el) => el.textContent);
    check(allDoneNotice.includes("Все задачи выполнены"), "показано сообщение об окончании");
    check((await stats(page))[3].value === "100%", "прогресс = 100%");
    await page.screenshot({ path: path.join(shotsDir, "04-all-done.png"), fullPage: true });

    checkName = "15. словарь проектов";
    await page.type("#project-name", "Сайт клиента");
    await page.click(".projects__add");
    const chips = await page.$$eval(".chip__name", (nodes) =>
      nodes.map((node) => node.textContent.trim())
    );
    check(chips.includes("Сайт клиента"), "проект добавлен в словарь");

    await page.click(".projects__add");
    const emptyProjectError = await page.$eval(".projects [role='alert']", (el) => el.textContent);
    check(emptyProjectError.includes("Введите название"), "пустой проект не добавляется");

    await page.type("#project-name", "Сайт клиента");
    await page.click(".projects__add");
    const duplicateError = await page.$eval(".projects [role='alert']", (el) => el.textContent);
    check(duplicateError.includes("уже есть"), "дубликат проекта отклонён");

    await page.click("#project-name");
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Delete");

    checkName = "16. задача с проектом и дедлайном";
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const deadline = [
      tomorrow.getFullYear(),
      String(tomorrow.getMonth() + 1).padStart(2, "0"),
      String(tomorrow.getDate()).padStart(2, "0"),
    ].join("-");

    await page.type("#task-title", "Собрать требования");
    const hasProjectOption = await page.$eval("#task-project", (el) =>
      Array.from(el.options).some((option) => option.value === "Сайт клиента")
    );
    check(hasProjectOption, "проект из словаря доступен в выпадающем списке");
    await page.select("#task-project", "Сайт клиента");
    await page.$eval(
      "#task-deadline",
      (el, value) => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
        setter.call(el, value);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      },
      deadline
    );
    await page.click(".task-form__submit");

    const projectChip = await page.$eval(".task .task__project", (el) => el.textContent.trim());
    check(projectChip === "Сайт клиента", "проект показан на карточке задачи");
    const deadlineBadge = await page.$eval(".task .task__deadline", (el) => el.textContent.trim());
    check(deadlineBadge === `до ${deadline}`, "дедлайн показан на карточке задачи");

    await page.click(".task__actions .icon-btn");
    const editProject = await page.$eval(".task__edit select", (el) => el.value);
    const editDeadline = await page.$eval(".task__edit input[type='date']", (el) => el.value);
    check(
      editProject === "Сайт клиента" && editDeadline === deadline,
      "в режиме редактирования проект и дедлайн подставлены"
    );
    await page.$$eval(".task__edit-actions button", (buttons) => buttons[1].click());
    await sleep(150);

    checkName = "17. выгрузка в Excel";
    const exportLabel = await page.$eval(".export-btn", (el) => el.textContent);
    check(exportLabel.includes("Выгрузить в Excel"), "кнопка выгрузки есть в блоке фильтров");
    check(
      (await page.$eval(".export-btn", (el) => el.disabled)) === false,
      "кнопка выгрузки активна"
    );

    const cdp = await page.target().createCDPSession();
    try {
      await cdp.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDir });
    } catch {
      await cdp.send("Browser.setDownloadBehavior", {
        behavior: "allowAndEmitEvents",
        downloadPath: downloadDir,
        eventsEnabled: true,
      });
    }

    await page.click(".export-btn");
    let fileName = "";
    for (let attempt = 0; attempt < 60 && !fileName; attempt += 1) {
      const files = await readdir(downloadDir).catch(() => []);
      const ready = files.find(
        (file) => file.endsWith(".xlsx") && !files.includes(`${file}.crdownload`)
      );
      if (ready) fileName = ready;
      else await sleep(250);
    }
    check(Boolean(fileName), `файл скачан: ${fileName || "не найден"}`);
    if (fileName) {
      const size = (await stat(path.join(downloadDir, fileName))).size;
      check(size > 3000, `файл не пустой: ${size} байт`);
    }
    await page.screenshot({ path: path.join(shotsDir, "05-projects-export.png"), fullPage: true });

    checkName = "консоль";
    check(consoleErrors.length === 0, `ошибок в консоли: ${consoleErrors.length}`);
    consoleErrors.forEach((error) => console.log(`       ${error}`));
  } finally {
    if (browser) await browser.close();
    if (preview) preview.kill();
  }

  console.log("");
  if (failures.length > 0) {
    console.log(`ПРОВАЛЕНО: ${failures.length}`);
    failures.forEach((failure) => console.log(` - ${failure}`));
    process.exitCode = 1;
  } else {
    console.log("Все сценарии пройдены. Скриншоты: screenshots/");
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
