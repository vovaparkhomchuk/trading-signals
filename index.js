const fs = require("fs");
const util = require("util");
const asyncReadFile = util.promisify(fs.readFile);
const Parser = require("./src/Parser");
const PositionTracker = require("./src/PositionTracker");
const _ = require("lodash");
const TelegramBot = require("node-telegram-bot-api");
const { last } = require("lodash");

const token = "5022655680:AAGO-IR7udv60M8qvpC83AWx3fiIuwVyQYs";
const chatIds = [-671062154];
const INSTRUMENTS = ["NQ", "MNQ", "ES"];
const filePath =
  "C:\\Users\\Goodrobot\\AppData\\Roaming\\VolFix.NET\\order_log.txt";
const priceFile = "C:\\Users\\Goodrobot\\Documents\\";
// const filePath = "C:\\order_log.txt";
// const filePath = "./order_log copy.txt";
// const priceFile = "./";

const bot = new TelegramBot(token, { polling: false });
const parser = new Parser();
const positionTracker = new PositionTracker();
let lastPositions = {};

const sendTelegramMessage = (msg) => {
  for (let id of chatIds) bot.sendMessage(id, msg);
};

const main = async () => {
  sendTelegramMessage("Hello, I'm alive again");
  const actionDone = {};

  fs.watch(filePath, async (eventName, filename) => {
    const seconds = getChangeSeconds(filePath);
    if (actionDone[filename] == seconds) return;
    actionDone[filename] = seconds;

    if (filename) {
      try {
        const fileAsString = await asyncReadFile(filePath, "utf8");
        const file = fileAsString.split(/\r?\n/);
        const actions = parser.saveNewData(file).getActions();
        const positions = positionTracker.checkActions(actions).getPositions();
        console.log({ positions });
      } catch (e) {
        console.log({ e });
      }
    } else {
      console.log("filename not provided or check file access permissions");
    }
  });

  INSTRUMENTS.map((ticker) => {
    const path = priceFile + ticker + ".txt";
    fs.watch(path, async (eventName, filename) => {
      const seconds = getChangeSeconds(path);
      if (actionDone[filename] == seconds) return;
      actionDone[filename] = seconds;

      if (filename) {
        try {
          const fileAsString = await asyncReadFile(path, "utf8");
          const price = parseFloat(fileAsString.split(/\r?\n/)[0]);
          if (!isNaN(price)) {
            positionTracker.setPrices(ticker, price);
            positionTracker.checkStopAndTake(ticker);
            const positions = positionTracker.getPositions();
            if (Object.keys(positions).length > 0) {
              if (!_.isEqual(positions, lastPositions)) {
                console.log({ positions });
                sendTelegramMessage(JSON.stringify(positions));
                lastPositions = { ...positions };
              }
            }
          }
        } catch (e) {
          console.log({ e });
        }
      } else {
        console.log("filename not provided or check file access permissions");
      }
    });
  });
};

main();

const getChangeSeconds = (filename) => {
  const path = filename;
  const stats = fs.statSync(path);
  const seconds = +stats.mtime;
  return seconds;
};

// POSITION TRACKER
// Subscribe on price file change
// If we have position(s) - campare last price and stop loss/take profit
// LATER: save limit orders in position tracker and track it filled

// PARSER
// Save actions with last price and send it to position tracker
