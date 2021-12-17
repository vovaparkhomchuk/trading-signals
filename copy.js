const TelegramBot = require("node-telegram-bot-api");
const { Client } = require("node-scp");
const fs = require("fs");

// telegram bot
const token = "2120991142:AAHooCgy3U5FZ4vr2XsqvgkDJtQ0t8DsfeI";
const bot = new TelegramBot(token, { polling: false });
const chatIds = [
  // -1001322700888, // GR trading chat
  -729027263, // Volfix Copy chat
];
const ERROR_MSG = "Error happened😱😱😱";
const SENT_MSG = "File copied🥳🥳🥳";

const config = {
  host: "195.201.167.164",
  port: 22,
  username: "Administrator",
  password: "J2yG2n3sh",
};

const filePath =
  "C:\\Users\\Goodrobot\\AppData\\Roaming\\VolFix.NET\\order_log.txt";
const remoteFile = "C:\\order_log_dev.txt";
let file = fs.readFileSync(filePath);

const SendFile = async (client, localPath, remotePath) => {
  while (true) {
    try {
      await client.uploadFile(localPath, remotePath);
      // sendTelegramMessage(SENT_MSG);
      break;
    } catch (e) {
      console.log({ e });
      sendTelegramMessage(ERROR_MSG);
      continue;
    }
  }
};

const sendTelegramMessage = (msg) => {
  for (let id of chatIds) bot.sendMessage(id, msg);
};

const main = async () => {
  fs.watch(filePath, async (eventName, filename) => {
    if (filename) {
      try {
        const client = await Client(config);
        console.log(filename + " file Changed ...");
        file = fs.readFileSync(filePath);
        await SendFile(client, filePath, remoteFile);
        client.close();
      } catch (e) {
        console.log({ e });
        sendTelegramMessage(ERROR_MSG);
      }
    } else {
      console.log("filename not provided or check file access permissions");
    }
  });
};

main();
