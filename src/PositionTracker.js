class PositionTracker {
  #positions = {};

  check(actions) {
    const positionTickers = Object.keys(this.#positions);
    actions.map((action) => {
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

  getPositions() {
    return this.#positions;
  }

  #saveNewPosition(action, isNew = true) {
    const { ticker, type, size, side, price, stopLoss, takeProfit, old } =
      action;
    if (isNew)
      this.#positions[ticker] = {
        ticker,
        price,
        takeProfit,
        stopLoss,
        side,
        size: size * side,
      };
    else {
      this.#positions[ticker].size += size * side;
      if (this.#positions[ticker].size === 0) this.#positions[ticker].side = 0;
      else
        this.#positions[ticker].side =
          this.#positions[ticker].size / Math.abs(this.#positions[ticker].size);
    }
  }

  #tradeOut(action) {
    const { ticker, type, size, side, price, stopLoss, takeProfit, old } =
      action;
    this.#positions[ticker] = {
      price: 0,
      takeProfit: 0,
      stopLoss: 0,
      size: 0,
      ticker,
    };
  }
}

module.exports = PositionTracker;
