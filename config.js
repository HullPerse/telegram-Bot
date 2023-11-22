import { Markup } from 'telegraf';

export const TOKEN = 'BOT_TOKEN';

export class fixik {
  constructor() {
    this.categories = {
      category1: {
        mainChat: 'CHAT_ID_HERE',
        updateChat: 'CHAT_ID_HERE',
        masterChat: 'CHAT_ID_HERE',
        slave1: {
          chatId: 'CHAT_ID_HERE',
          name: "Slave 1"
        },
        slave2: {
          chatId: 'CHAT_ID_HERE',
          name: "Slave 2"
        },
        slave3: {
          chatId: 'CHAT_ID_HERE',
          name: "Slave 3"
        },
        slave4: {
          chatId: 'CHAT_ID_HERE',
          name: "Slave 4"
        },
      }
    };
  }
}

export class state {
  constructor() {
    this.categories = {
      not_assigned: "ОЖИДАНИЕ",
      accepted: "ПРИНЯТО В ОБРАБОТКУ",
      completed: "ЗАВЕРШЕНО",
    };
  }
}

export const issueKeyboard = Markup.inlineKeyboard([
  Markup.button.callback('Принять', 'acceptIssue'),
  Markup.button.callback('Решено ', 'completeIssue'),
  Markup.button.callback('Перенаправить', 'redirectIssue'),
]);

export const redirectKeyboard = Markup.inlineKeyboard([
  Markup.button.callback('Master ♂', 'master'),
  Markup.button.callback('Slave 1 ', 'slave_1'),
  Markup.button.callback('Slave 2', 'slave_2'),
  Markup.button.callback('Slave 3', 'slave_3'),
  Markup.button.callback('Slave 4', 'slave_4'),
  Markup.button.callback('Назад', 'goBack'),
]);