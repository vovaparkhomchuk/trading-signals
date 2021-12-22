const fs = require("fs");
const util = require("util");
const asyncReadFile = util.promisify(fs.readFile);
const { isEqual } = require("lodash");
const { sendTelegramMessage } = require("./src/TelegramBot");
const Parser = require("./src/Parser");
const PositionTracker = require("./src/PositionTracker");

const INSTRUMENTS = ["NQ", "MNQ", "ES"];
// const filePath =
//   "C:\\Users\\Goodrobot\\AppData\\Roaming\\VolFix.NET\\order_log.txt";
const priceFile = "C:\\Users\\Goodrobot\\Documents\\";
const filePath = "C:\\order_log.txt";
// const filePath = "./order_log copy.txt";
// const priceFile = "./";

const parser = new Parser();
const positionTracker = new PositionTracker();
let lastPositions = {};

const getChangeSeconds = (filename) => {
  const stats = fs.statSync(filename);
  const seconds = +stats.mtime;
  return seconds;
};

function App() {
  sendTelegramMessage("Hello, I'm alive again");
  const actionDone = {};

  // Subscribe on file change
  fs.watch(filePath, async (eventName, filename) => {
    const seconds = getChangeSeconds(filePath);
    if (actionDone[filename] == seconds) return;
    actionDone[filename] = seconds;

    if (filename) {
      try {
        const fileAsString = await asyncReadFile(filePath, "utf8");
        const file = fileAsString.split(/\r?\n/);
        const currentPositions = positionTracker.getPositions();
        const lastPrices = positionTracker.getPrices();
        parser.currentPositions = currentPositions;
        parser.lastPrices = lastPrices;
        const actions = parser.saveNewData(file, positionTracker).getActions();
        const positions = positionTracker.checkActions(actions).getPositions();
        console.log({ positions });
      } catch (e) {
        console.error({ e });
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
            positionTracker.checkLimitOrders(ticker);
            const positions = positionTracker.getPositions();
            if (Object.keys(positions).length > 0) {
              if (!isEqual(positions, lastPositions)) {
                console.log({ positions });
                // sendTelegramMessage(JSON.stringify(positions));

                for (let id in positions) {
                  const sideEmoji =
                    positions[id].side > 0
                      ? "📈"
                      : positions[id].side < 0
                      ? "📉"
                      : "";
                  const message = `
                  ${id} ${sideEmoji}\nPrice: ${positions[id].price}\nSize: ${positions[id].size}\nTakeProfit: ${positions[id].takeProfit}\nStopLoss: ${positions[id].stopLoss}`;
                  sendTelegramMessage(message);
                }
                lastPositions = { ...positions };
              }
            }
          }
        } catch (e) {
          console.error({ e });
        }
      } else {
        console.log("filename not provided or check file access permissions");
      }
    });
  });
}

App();
