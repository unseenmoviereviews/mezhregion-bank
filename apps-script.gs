// Межрегионпромстройторгинвестсбервкладбанк — приём результатов в Google-таблицу.
// Вставьте этот код в «Расширения → Apps Script» новой таблицы и опубликуйте как веб-приложение
// (доступ: «Все»). Полученный адрес …/exec вставьте в config.js.

const SHEET = 'Результаты';
const HEAD = ['Обновлено', 'ID попытки', 'ФИО', 'Группа', 'Статус', 'Баллы', 'Максимум', '%',
  '1. Карта рынка', '2. Договор', '3. Вклад', '4. Инфляция', '5. Страхование', '6. Баланс семьи',
  '7. Норма сбережений', '8. Портфель', '9. Антифрод', '10. Жалобы', '11. Цифровые услуги',
  'Выходы со страницы', 'Когда уходил', 'Перезагрузки', 'Начало', 'Минут', 'Вариант', 'Подробности'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) sh = ss.insertSheet(SHEET);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold').setBackground('#0b3a2c').setFontColor('#ffffff');
  }
  return sh;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    const sh = sheet_();
    const row = [new Date(), d.id, d.fio, d.group, d.status, d.score, d.max, d.percent]
      .concat(d.tasks)
      .concat([d.exits, d.exitsLog, d.reloads, d.started, d.minutes, d.seed, d.details]);
    const last = sh.getLastRow();
    let target = 0;
    if (last > 1) {
      const ids = sh.getRange(2, 2, last - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(d.id)) { target = i + 2; break; }
    }
    if (target) sh.getRange(target, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('Приём результатов работает');
}
