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
          case "MARKET":
            this.#saveNewPosition(action, false);
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
      position.side = 0;
      position.takeProfit = 0;
      position.stopLoss = 0;
      position.price = 0;
      position.size = 0;
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
      };
    } else {
      this.#positions[ticker].size += size * side;
      if (this.#positions[ticker].size === 0) this.#positions[ticker].side = 0;
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
      ticker,
    };
    return this;
  }
}

module.exports = PositionTracker;
