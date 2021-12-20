const instrumentInfo = require("./instrumentInfo");

class Parser {
  #lastData = [];
  #newChanges = [];
  #marketPosition = 0;
  actions = [];
  #historyLoaded = false;
  currentPositions = null;
  lastPrices = {};

  constructor() {}

  saveNewData(newData) {
    // saving only new data = differnce
    this.#newChanges = newData.filter((x) => !this.#lastData.includes(x));
    //saving new data as last
    this.#lastData = newData;
    // calling parse method
    this.#parseNewData();
    return this;
  }

  #parseNewData() {
    if (this.#newChanges) {
      const actions = [];
      for (let row of this.#newChanges) {
        if (row === "") continue;
        const splitedRow = row.split(";");
        const cells = splitedRow.length;
        const parsed = {
          ticker:
            cells === 2 ? "ALL" : splitedRow[1].split("=")[1].split("(")[0],
          type: "",
          size: 0,
          side: 0,
          price: 0,
          stopLoss: 0,
          takeProfit: 0,
          old: false,
        };

        // trade out all
        if (cells === 2) {
          if (splitedRow[1].includes("TRADE OUT ALL")) {
            parsed.type = "TRADE OUT ALL";
          }
        }
        // trade out or cancel order
        else if (cells === 3) {
          if (splitedRow[2].includes("TRADE OUT")) {
            parsed.type = "TRADE OUT";
          } else {
            parsed.type = "CANCEL";
          }
        }
        // limit
        else if (cells === 9 || cells === 10) {
          parsed.type = "LIMIT";
          parsed.size = Number(splitedRow[2].split("=")[1].split("L")[0]);
          parsed.side = splitedRow[3].length === 4 ? 1 : -1;
          parsed.price = Number(splitedRow[5].split("=")[1]);
          parsed.stopLoss =
            cells === 10
              ? Number(splitedRow[7].split("L")[1])
              : cells === 9 && splitedRow[7].includes("S/L")
              ? Number(splitedRow[7].split("L")[1].split(":")[0])
              : 0;
          parsed.takeProfit =
            cells === 10
              ? Number(splitedRow[8].split("P")[1])
              : cells === 9 && splitedRow[7].includes("T/P")
              ? Number(splitedRow[7].split("P")[1].split(":")[0])
              : 0;
        }
        // market
        else if (cells === 7 || cells === 8) {
          parsed.type = "MARKET";
          parsed.size = Number(splitedRow[2].split("=")[1].split("L")[0]);
          parsed.side = splitedRow[3].length === 4 ? 1 : -1;
          parsed.stopLoss =
            cells === 8
              ? Number(splitedRow[6].split("L")[1])
              : cells === 7 && splitedRow[6].includes("S/L")
              ? Number(splitedRow[6].split("L")[1].split(":")[0])
              : 0;
          parsed.takeProfit =
            cells === 8
              ? Number(splitedRow[7].split("P")[1].split(":")[0])
              : cells === 7 && splitedRow[6].includes("T/P")
              ? Number(splitedRow[6].split("P")[1].split(":")[0])
              : 0;
        }
        // move order
        else if (cells === 5 && splitedRow[2].includes("MOVE ORDER ID")) {
          const price = Number(splitedRow[3].split("=")[1]);
          parsed.type = "MOVE";

          const position =
            this.currentPositions[parsed.ticker] &&
            this.currentPositions[parsed.ticker].size !== 0
              ? this.currentPositions[parsed.ticker].size
              : 0;

          if (position === 0) {
          }
          // changing OCO
          else {
            // long
            if (position > 0) {
              if (price > this.lastPrices[parsed.ticker]) {
                parsed.takeProfit = price;
                parsed.type += " TAKE";
              } else if (price < this.lastPrices[parsed.ticker]) {
                parsed.stopLoss = price;
                parsed.type += " STOP";
              }
            }
            // short
            else if (position < 0) {
              if (price < this.lastPrices[parsed.ticker]) {
                parsed.takeProfit = price;
                parsed.type += " TAKE";
              } else if (price > this.lastPrices[parsed.ticker]) {
                parsed.stopLoss = price;
                parsed.type += " STOP";
              }
            }
          }
        }

        actions.push(parsed);
      }

      if (this.#historyLoaded) this.actions = [...actions];
      else {
        this.actions = [...actions.slice(-1)];
        this.#historyLoaded = true;
      }
    }
    return this;
  }

  set currentPositions(currentPositions) {
    this.currentPositions = currentPositions;
  }

  set lastPrices(lastPrices) {
    this.lastPrices = lastPrices;
  }

  getActions() {
    const actions = [...this.actions];
    this.actions = [];
    return actions;
  }
}

module.exports = Parser;
