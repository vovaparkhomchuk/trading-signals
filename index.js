const fs = require("fs");
const util = require("util");
const asyncReadFile = util.promisify(fs.readFile);
const Parser = require("./src/Parser");
const PositionTracker = require("./src/PositionTracker");

// const filePath = "C:\\Users\\simp\\AppData\\Roaming\\VolFix.NET\\order_log.txt";
const filePath = "./order_log copy.txt";

const parser = new Parser();
const positionTracker = new PositionTracker();

const main = async () => {
  const actionDone = {};

  fs.watch(filePath, async (eventName, filename) => {
    const seconds = getChangeSeconds(filename);
    if (actionDone[filename] == seconds) return;
    actionDone[filename] = seconds;

    if (filename) {
      const fileAsString = await asyncReadFile("./order_log copy.txt", "utf8");
      const file = fileAsString.split(/\r?\n/);
      const actions = parser.saveNewData(file).getActions();
      console.log({ actions });
      const positions = positionTracker.check(actions).getPositions();
      console.log({ positions });
    } else {
      console.log("filename not provided or check file access permissions");
    }
  });
};

main();

const getChangeSeconds = (filename) => {
  const path = "./" + filename;
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
