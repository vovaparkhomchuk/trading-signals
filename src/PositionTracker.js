const instrumentInfo = require("./instrumentInfo");

class PositionTracker {
  #positions = {};
  #prices = {};

  checkActions(actions) {
    actions.map((action) => {
      const positionTickers = Object.keys(this.#positions);
      const { ticker, type, size, side, price, stopLoss, takeProfit, old } =
        action;
      if (positionTickers.includes(ticker)) {
        switch (type) {
          case "TRADE OUT":
            this.#tradeOut(action);
            return this;
          case "MARKET":
            this.#saveNewPosition(action, false);
            return this;
          case "MOVE TAKE":
            this.#positions[ticker].takeProfit = takeProfit;
            return this;
          case "MOVE STOP":
            this.#positions[ticker].stopLoss = stopLoss;
            return this;
        }
      } else {
        switch (type) {
          case "MARKET":
            this.#saveNewPosition(action);
        }
      }
    });

    return this;
  }

  checkStopAndTake(ticker) {
    if (!Object.keys(this.#positions).includes(ticker)) return;
    if (!Object.keys(this.#prices).includes(ticker)) return;

    const price = this.#prices[ticker];
    const position = this.#positions[ticker];
    if (
      (position.side > 0 &&
        (price <= position.stopLoss || price >= position.takeProfit)) ||
      (position.side < 0 &&
        (price >= position.stopLoss || price <= position.takeProfit))
    ) {
      this.#tradeOut({ ticker });
    }

    return this;
  }

  getPositions() {
    return this.#positions;
  }

  setPrices(ticker, price) {
    this.#prices[ticker] = price;
    return this;
  }

  getPrices() {
    return this.#prices;
  }

  #saveNewPosition(action, isNew = true) {
    const { ticker, type, size, side, price, stopLoss, takeProfit, old } =
      action;
    const marketPrice = Object.keys(this.#prices).includes(ticker)
      ? this.#prices[ticker]
      : 0;
    const positionPrice = type === "MARKET" ? marketPrice : price;
    let stopLossPrice = 0,
      takeProfitPrice = 0;

    if (side > 0) {
      stopLossPrice =
        positionPrice - stopLoss / instrumentInfo[ticker].ticksInPoint;
      takeProfitPrice =
        positionPrice + takeProfit / instrumentInfo[ticker].ticksInPoint;
    } else if (side < 0) {
      stopLossPrice =
        positionPrice + stopLoss / instrumentInfo[ticker].ticksInPoint;
      takeProfitPrice =
        positionPrice - takeProfit / instrumentInfo[ticker].ticksInPoint;
    }

    if (
      isNew ||
      (Object.keys(this.#positions).includes(ticker) &&
        this.#positions[ticker].size === 0)
    ) {
      this.#positions[ticker] = {
        ticker,
        side,
        takeProfit: takeProfitPrice,
        stopLoss: stopLossPrice,
        price: positionPrice,
        size: size * side,
        time: new Date().toLocaleString(),
      };
    } else {
      this.#positions[ticker].size += size * side;
      this.#positions[ticker].time = new Date().toLocaleString();
      if (this.#positions[ticker].size === 0) this.#tradeOut(action);
      else
        this.#positions[ticker].side =
          this.#positions[ticker].size / Math.abs(this.#positions[ticker].size);
    }
    return this;
  }

  #tradeOut(action) {
    const { ticker } = action;
    this.#positions[ticker] = {
      price: 0,
      takeProfit: 0,
      stopLoss: 0,
      size: 0,
      time: new Date().toLocaleString(),
      ticker,
    };
    return this;
  }
}

module.exports = PositionTracker;
