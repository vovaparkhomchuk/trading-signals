const TelegramBot = require("node-telegram-bot-api");

const token = "5022655680:AAGO-IR7udv60M8qvpC83AWx3fiIuwVyQYs";
const chatIds = [
  -671062154,
  -729027263, // Volfix Copy chat
];
const bot = new TelegramBot(token, { polling: false });

const sendTelegramMessage = (msg) => {
  for (let id of chatIds) bot.sendMessage(id, msg);
};

module.exports = { sendTelegramMessage };
