# Mango v3 Client Library

JavaScript client library for interacting with Mango Markets DEX v3.

## Installation

Using npm:

```
npm install @blockworks-foundation/mango-client
```

Using yarn:

```
yarn add @blockworks-foundation/mango-client
```

## Usage Example

This example assumes that you have a wallet that is already setup with devnet tokens. The private key should be stored in `~/.config/solana/devnet.json`. Visit https://v3.mango.markets/ and connect with the wallet to fund your margin account so that you can place orders. You can find the full source code in [example.ts](./src/example.ts).

```js
// Fetch orderbooks
const bids = await perpMarket.loadBids(connection);
const asks = await perpMarket.loadAsks(connection);

// L2 orderbook data
for (const [price, size] of bids.getL2(20)) {
  console.log(price, size);
}

// L3 orderbook data
for (const order of asks) {
  console.log(
    order.owner.toBase58(),
    order.orderId.toString('hex'),
    order.price,
    order.size,
    order.side, // 'buy' or 'sell'
  );
}

// Place order
await client.placePerpOrder(
  mangoGroup,
  mangoAccount,
  mangoGroup.mangoCache,
  perpMarket,
  owner,
  'buy', // or 'sell'
  39000,
  0.0001,
  'limit', // or 'ioc' or 'postOnly'
);

// retrieve open orders for account
const openOrders = await perpMarket.loadOrdersForAccount(
  connection,
  mangoAccount,
);

// cancel orders
for (const order of openOrders) {
  await client.cancelPerpOrder(
    mangoGroup,
    mangoAccount,
    owner,
    perpMarket,
    order,
  );
}

// Retrieve fills
for (const fill of await perpMarket.loadFills(connection)) {
  console.log(
    fill.owner.toBase58(),
    fill.maker ? 'maker' : 'taker',
    fill.baseChange.toNumber(),
    fill.quoteChange.toNumber(),
    fill.longFunding.toFixed(3),
    fill.shortFunding.toFixed(3),
  );
}
```

## CLI for testing

Create a new mango group on devnet:
```
init-group <group> <mangoProgramId> <serumProgramId> <quote_mint>
```
```
yarn cli init-group mango_test_v2.2 66DFouNQBY1EWyBed3WPicjhwD1FoyTtNCzAowcR8vad DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY EMjjdsqERN4wJUR9jMBax2pzqQPeGLNn5NeucbHpDUZK
```


Create a new mango group on devnet with new USDC:
```
init-group <group> <mangoProgramId> <serumProgramId> <quote_mint>
```
```
yarn cli init-group mango_test_v3.1 Hm3U4wFaR66SmuXj66u9AuUNUqa6T8Ldb5D9uHBs3SHd DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY 3u7PfrgTAKgEtNhNdAD4DDmNGfYfv5djGAPixGgepsPp
```


Add a stub oracle:
```
add-oracle <group> <symbol>
```
```
yarn cli add-oracle mango_test_v2.2 BTC
```


Add a pyth oracle:
```
add-oracle <group> <symbol>
```
```
yarn cli add-oracle mango_test_v3.1 BTC --provider pyth
```


Set stub oracle value = base_price \* quote_unit / base_unit:
```
set-oracle <group> <symbol> <value>
```
```
yarn cli set-oracle mango_test_v2.2 BTC 40000
```


Add a spot-market with existing serum market
```
add-spot-market <group> <symbol> <mint_pk> --market_pk <market_pk>
```
```
yarn cli add-spot-market mango_test_v2.2 BTC bypQzRBaSDWiKhoAw3hNkf35eF3z3AZCU8Sxks6mTPP --market_pk E1mfsnnCcL24JcDQxr7F2BpWjkyy5x2WHys8EL2pnCj9
```

List and add a spot-market
```
add-spot-market <group> <symbol> <mint_pk> --base_lot_size <number> --quote_lot_size <number>
```
```
yarn cli add-spot-market mango_test_v2.2 BTC bypQzRBaSDWiKhoAw3hNkf35eF3z3AZCU8Sxks6mTPP --base_lot_size 100 --quote_lot_size 10
```


Enable a perp-maket
```
add-perp-market <group> <symbol>
```
```
yarn cli add-perp-market mango_test_v2.2 BTC
```

## Run the Keeper
Update the `groupName` in `src/keeper.ts` and then run:

```
yarn keeper
```

## Run the Liquidator
### Prerequisites
To run the liquidator you will need:
* A Solana account with some SOL deposited to cover transaction fees
* A Mango Account with some collateral deposited

### Setup
Configure the environment variables below to your liking, or add them to a `.env` file in the project root to load automatically on liquidator startup. Default values are shown:
```bash
CLUSTER="mainnet"
CLUSTER_URL="https://solana-api.projectserum.com"
KEYPAIR=${HOME}/.config/solana/id.json
GROUP="mainnet.1"
TARGETS="0 0 0 0 0 0 0 0 0" # Space separated list of the amount of each asset to maintain when rebalancing
INTERVAL=3500 # Milliseconds to wait before checking for sick accounts
INTERVAL_ACCOUNTS=120000 # Milliseconds to wait before reloading all Mango accounts
INTERVAL_WEBSOCKET=300000 # Milliseconds to wait before reconnecting to the websocket
LIQOR_PK="" # Liqor Mango account PK, by default uses the largest value account owned by the keypair
WEBHOOK_URL="" # Discord webhook URL to post liquidation events and errors to
```

The liquidator will attempt to close all perp positions, and balance the tokens in the liqor account after each liquidation. By default it will sell all token assets into USDC. You can choose to maintain a certain amount of each asset through this process by editing the value in the `TARGETS` environment variable at the position of the asset. The program will attempt to make buy/sell orders during balancing to maintain this level.

### Run
```
yarn install
yarn liquidator
```
