import chalk from 'chalk';
import ExcelJS from 'exceljs';
import sqlite3 from 'sqlite3';
import { Markup, Telegraf } from 'telegraf';
import { TOKEN, fixik, issueKeyboard, redirectKeyboard, state } from './config-backup.js';

sqlite3.verbose();

const dbPath = 'test.db';
const db = new sqlite3.Database(dbPath);

const bot = new Telegraf(TOKEN);

const dealer = new fixik();
const status = new state();

const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Main Data');

let categoryChat;
let category;
let currentIssue;
let commandUsed;

bot.command('file', async (ctx) => {
  db.all('SELECT * FROM main', (err, rows) => {
      if (err) {
          console.error(err);
          return;
      }
      const headers = ['id', 'chatId', 'type', 'commentary', 'status', 'workerChatId', 'workerName'];
      worksheet.addRow(headers);

      rows.forEach(row => {
          const values = [row.id, row.chatId, row.type, row.commentary, row.status, row.workerChatId, row.workerName];
          worksheet.addRow(values);
      }); 

      workbook.xlsx.writeBuffer()
          .then(buffer => {
              ctx.replyWithDocument({ source: buffer, filename: 'output.xlsx' })
                  .then(() => {
                      db.close();
                      console.log(chalk.bgGreen(`${ctx.from.first_name} ${ctx.from.last_name}`), 'has requested EXCEL file');
                  })
                  .catch(err => {
                      console.error('Не удалось создать excel файл:', err);
                      db.close();
                  });
          })
          .catch(err => {
              console.error('Не удалось создать excel файл:', err);
              db.close();
          });
  });
});

bot.start(ctx => {
  currentIssue = null;
  commandUsed = false;
  categoryChat = null;
  category = null;

  ctx.reply('Добро пожаловать');
    const keyboard = Markup.keyboard([
      ['Отправить запрос', 'Посмотреть запросы']
    ]);

  ctx.reply('Выберите тип проблемы:', keyboard);
});

bot.hears('Отправить запрос', (ctx) => {
  const keyboard = Markup.keyboard([
    ['1С', 'Прочее П.О.'],
    ['Железо', 'Сеть'],
  ]);

  ctx.reply('Выберите тип проблемы:', keyboard);
});

bot.hears('Посмотреть запросы', (ctx) => {
  const findKeyboard = Markup.keyboard([
    ['Все запросы'],
    ['Завершенные', 'В процессе'],
  ]);

  ctx.reply('Выберите категорию запросов', findKeyboard);
});

bot.hears('Все запросы', (ctx) => {
  if(ctx.chat.id == dealer.categories.category1.mainChat || ctx.chat.id == dealer.categories.category1.masterChat) {
    db.all('SELECT * FROM main', (err, rows) => {
  if (err) {
      console.error(err);
      return;
  }

  const messageText = rows.map(row => {
    return `ID: ${row.id}\nКатегория: ${row.type}\nОписание: ${row.commentary}\nСтатус: ${row.status}\n\n`;
  }).join('');

  ctx.reply(messageText);
  console.log(chalk.bgGreen(`${ctx.from.first_name} ${ctx.from.last_name}`), 'has requested all issues');
});
  }
});

bot.hears('Завершенные', (ctx) => {
  if(ctx.chat.id == dealer.categories.category1.mainChat || ctx.chat.id == dealer.categories.category1.masterChat) {
    db.all('SELECT * FROM main WHERE status = "ЗАВЕРШЕНО"', (err, rows) => {
  if (err) {
      console.error(err);
      return;
  }

  const messageText = rows.map(row => {
    return `ID: ${row.id}\nКатегория: ${row.type}\nОписание: ${row.commentary}\nСтатус: ${row.status}\n\n`;
  }).join('');

  ctx.reply(messageText);
  console.log(chalk.bgGreen(`${ctx.from.first_name} ${ctx.from.last_name}`), 'has requested completed issues');
});
  }
});

bot.hears('В процессе', (ctx) => {
  if(ctx.chat.id == dealer.categories.category1.mainChat || ctx.chat.id == dealer.categories.category1.masterChat) {
    db.all('SELECT * FROM main WHERE status = "ПРИНЯТО В ОБРАБОТКУ" OR status = "ОЖИДАНИЕ"', (err, rows) => {
  if (err) {
      console.error(err);
      return;
  }

  const messageText = rows.map(row => {
    return `ID: ${row.id}\nКатегория: ${row.type}\nОписание: ${row.commentary}\nСтатус: ${row.status}\n\n`;
  }).join('');

  ctx.reply(messageText);
  console.log(chalk.bgGreen(`${ctx.from.first_name} ${ctx.from.last_name}`), 'has requested in_progress issues');
});
  }
});

bot.hears('1С', (ctx) => {
  currentIssue = "1С";
  categoryChat = dealer.categories.category1.mainChat;
  commandUsed = true;
  ctx.reply('Пожалуйста, опишите вашу проблему:', Markup.removeKeyboard());
});

bot.hears('Прочее П.О.', (ctx) => {
  currentIssue = "Прочее П.О.";
  categoryChat = dealer.categories.category1.mainChat;
  commandUsed = true;
  ctx.reply('Пожалуйста, опишите вашу проблему:', Markup.removeKeyboard());
});

bot.hears('Железо', (ctx) => {
  currentIssue = "Железо";
  categoryChat = dealer.categories.category1.mainChat;
  commandUsed = true;
  ctx.reply('Пожалуйста, опишите вашу проблему:', Markup.removeKeyboard());
});

bot.hears('Сеть', (ctx) => {
  currentIssue = "Сеть";
  categoryChat = dealer.categories.category1.mainChat;
  commandUsed = true;
  ctx.reply('Пожалуйста, опишите вашу проблему:', Markup.removeKeyboard());
});

bot.command('id', (ctx) => {
  ctx.reply(`chat id: ${ctx.chat.id} \nuser id: ${ctx.from.id}`)
  console.log(chalk.bgGreen(`${ctx.from.first_name} ${ctx.from.last_name}`), 'has requested id');
});

bot.command('issue', (ctx) => {
  if (ctx.chat.id == dealer.categories.category1.mainChat || ctx.chat.id == dealer.categories.category1.masterChat) {
    const commandText = ctx.message.text;
    const parameters = commandText.split(' ');

    if (parameters.length === 2 && /^\d+$/.test(parameters[1])) {
      const issueNumber = parseInt(parameters[1]);

      db.get(`SELECT * FROM main WHERE id = ?`, [issueNumber], (err, row) => {
        if (err) {
          console.error(err);
          return;
        }

        if (row) {
          const message = `(ID: ${row.id}): ${row.type} \n${row.commentary} \nСтатус: ${row.status}`;
          bot.telegram.sendMessage(ctx.chat.id, message, issueKeyboard);

          console.log(chalk.bgGreen(`${ctx.from.first_name} ${ctx.from.last_name}`), `has requested an issue with id ${chalk.cyan(row.id)}`)
        } else {
          ctx.reply('Запрос с указанным номером не найдена');
        }
      });
    } else {
      ctx.reply(`Укажите айди проблемы \nПример: /issue 10`);
    }
  } else {
    ctx.reply('Вы не можете использовать эту команду');
  }
});

bot.on('text', (ctx) => {
  if (currentIssue == "1С" || currentIssue == "Прочее П.О." || currentIssue == "Железо" || currentIssue == "Сеть") {
    if (commandUsed) {
      const insertQuery = "INSERT INTO main (chatId, type, commentary) VALUES (?, ?, ?)";
      db.run(insertQuery, [ctx.message.chat.id, currentIssue, ctx.message.text], (err) => {
        if (err) {
          return ctx.reply("Не удалось отправить запрос.");
        }
        ctx.reply(`Запрос отправлен успешно.`);
        commandUsed = false;

        const selectQuery = "SELECT * FROM main WHERE type = ? AND commentary = ? AND status = 'ОЖИДАНИЕ'";
        db.get(selectQuery, [currentIssue, ctx.message.text], (err, row) => {
          if (err) {
            return console.error(err.message);
          }
        
          if (row) {
            bot.telegram.sendMessage(categoryChat,
              `(ID: ${row.id}): ${row.type} \n${row.commentary} \nСтатус: ${row.status}`,
              issueKeyboard
            );

            bot.telegram.sendMessage(dealer.categories.category1.updateChat,
              `(ID: ${row.id}): ${row.type} \n${row.commentary} \nСтатус: ${row.status}`,
              issueKeyboard
            );

            console.log(chalk.bgGreen(`${ctx.from.first_name} ${ctx.from.last_name}`), 'has created a new issue with id:', chalk.cyan(`${row.id}`));
          } else {
            console.log("Запрос не найден в базе данных.");
          }
        });
      });
    }
  }
});

bot.action('acceptIssue', (ctx) => {
  const messageText = ctx.update.callback_query.message.text;
  const lines = messageText.split('\n');
  const lastLineIndex = lines.length - 1;

  const issueIdMatch = messageText.match(/\(ID: (\d+)\)/);
  const issueId = parseInt(issueIdMatch[1]);

  if(lines[lastLineIndex] !== `Статус: ${status.categories.accepted}`) {
    ctx.answerCbQuery(`Вы приняли работу над этой проблемой`);

    lines[lastLineIndex] = `Статус: ${status.categories.accepted}`;
    const updatedMessageText = lines.join('\n');

    const updateIssue = "UPDATE main SET status = ?, workerChatId = ?, workerName = ? WHERE id = ?";

    db.run(updateIssue, [status.categories.accepted, ctx.chat.id, `${ctx.from.first_name} ${ctx.from.last_name}`, issueId], (err) => {
      if (err) {
        ctx.reply('Произошла ошибка при обновлении статуса заявки')
      }
      ctx.editMessageText(updatedMessageText, issueKeyboard);

      bot.telegram.sendMessage(dealer.categories.category1.updateChat, updatedMessageText, issueKeyboard);

      console.log(chalk.bgGreen(`${ctx.from.first_name} ${ctx.from.last_name}`), 'has accepted issue with id', chalk.cyan(`${issueId}`) );
    });
  } else {
    ctx.answerCbQuery('Эта проблема уже принята в обработку');
  }
});

bot.action('completeIssue', (ctx) => {
  const messageText = ctx.update.callback_query.message.text;
  const lines = messageText.split('\n');
  const lastLineIndex = lines.length - 1;

  const issueIdMatch = messageText.match(/\(ID: (\d+)\)/);
  const issueId = parseInt(issueIdMatch[1]);

  if(lines[lastLineIndex] !== `Статус: ${status.categories.completed}`) {
    ctx.answerCbQuery(`Вы приняли работу над этой проблемой`);

    lines[lastLineIndex] = `Статус: ${status.categories.completed}`;
    const updatedMessageText = lines.join('\n');

    const updateIssue = "UPDATE main SET status = ?, workerChatId = ?, workerName = ? WHERE id = ?";

    db.run(updateIssue, [status.categories.completed, ctx.chat.id, `${ctx.from.first_name} ${ctx.from.last_name}`, issueId], (err) => {
      if (err) {
        ctx.reply('Произошла ошибка при обновлении статуса заявки');
      } else {
        ctx.editMessageText(updatedMessageText, issueKeyboard);

        const selectQuery = "SELECT * FROM main WHERE id = ?";
        db.get(selectQuery, [issueId], (err, row) => {
          if (err) {
            return console.error(err.message);
          }

          if (row) {
            bot.telegram.sendMessage(row.chatId, 'Ваш запрос был завершён');

            bot.telegram.sendMessage(dealer.categories.category1.updateChat, updatedMessageText, issueKeyboard);

            console.log(chalk.bgGreen(`${ctx.from.first_name} ${ctx.from.last_name}`), 'has completed issue with id', chalk.cyan(`${issueId}`) );
          } else {
            console.log("Запрос не найден в базе данных.");
          }
        });
      }
    });
  } else {
    ctx.answerCbQuery('Эта проблема уже решена');
  }
});

bot.action('redirectIssue', (ctx) => {
ctx.editMessageText(ctx.update.callback_query.message.text, redirectKeyboard);
});

bot.action('master', (ctx) => {
  ctx.answerCbQuery('Вы отправили этот запрос МАСТЕРУ ♂');
  bot.telegram.sendMessage(dealer.categories.category1.masterChat, ctx.update.callback_query.message.text, issueKeyboard);
  console.log('issue has been redirected to', chalk.green('master'));
});

bot.action(/^slave_(\d+)$/, (ctx) => {
  const userKey = ctx.match[1];
  const slave = dealer.categories.category1[`slave${userKey}`];

  if (slave) {
    bot.telegram.sendMessage(slave.chatId, ctx.update.callback_query.message.text, issueKeyboard);
    console.log('issue has been redirected to', chalk.green(`slave${userKey}`));
  }
});

bot.action('goBack', (ctx) => {
  ctx.editMessageText(ctx.update.callback_query.message.text, issueKeyboard);
});

bot.launch();