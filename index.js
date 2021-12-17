const fs = require("fs");
const util = require("util");
const asyncReadFile = util.promisify(fs.readFile);
const Parser = require("./src/Parser");
const PositionTracker = require("./src/PositionTracker");

// const filePath = "C:\\Users\\simp\\AppData\\Roaming\\VolFix.NET\\order_log.txt";
const filePath = "./order_log copy.txt";
// const priceFile = "C:\\Users\\Goodrobot\\Documents\\";
const priceFile = "./";

const INSTRUMENTS = ["NQ", "ES"];

const parser = new Parser();
const positionTracker = new PositionTracker();

const main = async () => {
  const actionDone = {};

  fs.watch(filePath, async (eventName, filename) => {
    const seconds = getChangeSeconds(filePath);
    if (actionDone[filename] == seconds) return;
    actionDone[filename] = seconds;

    if (filename) {
      const fileAsString = await asyncReadFile(filePath, "utf8");
      const file = fileAsString.split(/\r?\n/);
      const actions = parser.saveNewData(file).getActions();
      const positions = positionTracker.checkActions(actions).getPositions();
      console.log({ positions });
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
        const fileAsString = await asyncReadFile(path, "utf8");
        const price = parseFloat(fileAsString.split(/\r?\n/)[0]);
        if (!isNaN(price)) {
          positionTracker.setPrices(ticker, price);
          positionTracker.checkStopAndTake(ticker);
          const positions = positionTracker.getPositions();
          console.log({ positions });
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
