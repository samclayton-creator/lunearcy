# Lunearcy — Raise dragons. Wake the valley.

**[Play Lunearcy](https://lunearcy.xyz/)** · [NEAR testnet contract](https://testnet.nearblocks.io/address/lunearcy-mw6wrkww.testnet) · [Deployment and transaction receipts](contracts/economy/deployment.testnet.json)

Lunearcy is an illustrated browser game for NEAR Hackathon’s **Games With Real Economies** track. Hatch dragons, harvest berries and crystals, and sell them to Lucy to fund new eggs, expeditions, and the restoration of the valley.

**Every player trades with the same Lucy.** Her wallet and inventory are balances held by the NEAR contract. A sale pays out coins from her wallet and adds goods to her shelf. More stock reduces the price she offers the next player. Spending coins in the valley puts them back into her wallet.

## Try the game

1. Select **Enter the valley → Play as guest**. No external wallet or gas prompt is needed.
2. Follow the tutorial to clear the fog, hatch your first egg, and feed the dragon. Collect its first harvest, then sell the berries to Lucy.
3. Open **Market** to see the stock and the price breakdown. Use the **NEAR** button in the game to see whether the valley is synced, inspect Lucy’s balances, or open the contract in the explorer.

The game offers optional email or Google sign-in through Privy. Guest saves are tied to a browser key. **Saved on NEAR** indicates a synced testnet session. If the sponsor or network is unavailable, the game can run locally and the local save does not affect the shared market. [Play offline](https://lunearcy.xyz/?offline&session=offline-demo) to try the local mode separately.

## The economy is the gameplay

| What you do | What changes |
| --- | --- |
| Raise and upgrade dragons | Their nests produce berries or crystals. Berries also feed dragons and supply expeditions. |
| Sell to Lucy | You earn coins. Her stock grows and her coin balance falls. Later sales can pay less as her shelves fill. |
| Buy eggs and restore the valley | Coins return to Lucy’s wallet. New dragon species, nests, and regions open as you progress. |
| Time a sale around the eclipse | Daylight and eclipse alternate on the contract’s clock every two minutes. Lucy’s eclipse multiplier for crystals is 1.25× before integer rounding, and some dragons produce more under the red sky. |
| Send dragons on expeditions | They spend berries and stop producing at home until they return with coins and crystals. |

Neighbour demand is modeled by contract rules. At 20-second intervals it can drain stock and replenish Lucy’s wallet. Elapsed intervals settle when the contract processes an applicable game action. The **A week of the market in a minute** view replays a local market simulation with those pricing rules.

## What runs on NEAR

- [Economy contract](contracts/economy/src/lib.rs) handles the player state, harvests, sales, upgrades, land, and expeditions. The [contract rules](contracts/economy/src/rules.rs) are mirrored by the [browser engine](src/engine.js) and [pricing rules](src/market-rules.js). The browser shows an immediate result, then reconciles with the contract.
- [NEP-245 implementation](contracts/economy/src/mt.rs) tracks coins, berries, crystals, and individual dragon tokens in one contract. The contract account holds Lucy’s balances. Dragons carry game state, and the generic token transfer methods apply to goods and coins.
- [Browser connection](src/chain.js) submits game actions using the guest’s browser key or a [Privy embedded NEAR wallet](src/privy.js). The [sponsor](server/sponsor-core.mjs) checks proof of key ownership before topping up an eligible account with testnet NEAR.
- [Deployment record](contracts/economy/deployment.testnet.json) links to live testnet receipts for contract initialization, joining, and foraging. The separate [dragon registry prototype](contracts/market/README.md) has its own receipts and is outside the current shared economy.

Read Lucy’s live market and her three token balances without a wallet. Run this after `npm ci` from the repository root.

```bash
node --input-type=module <<'JS'
import {JsonRpcProvider} from 'near-api-js';

const contractId = 'lunearcy-mw6wrkww.testnet';
const rpc = new JsonRpcProvider({url: 'https://test.rpc.fastnear.com'});
const market = await rpc.callFunction({contractId, method: 'get_market', args: {}});
const balances = await rpc.callFunction({
  contractId,
  method: 'mt_batch_balance_of',
  args: {account_id: contractId, token_ids: ['coins', 'berries', 'crystals']}
});
console.log({market, balances});
JS
```

The tokens are game items on NEAR testnet. The hosted sponsor is served at [`/api/health`](https://lunearcy.xyz/api/health) and `/api/fund` on the game domain.

## Run and test locally

Use Node 24 or newer. Use a current Rust and Cargo toolchain to run the contract tests.

```bash
npm ci
npm test
cargo test --locked --manifest-path contracts/economy/Cargo.toml
npm run build
```

Run `npm run dev`, then open [http://127.0.0.1:5180/?offline](http://127.0.0.1:5180/?offline) for a local game without credentials. For local testnet play, create the git-ignored `.local` directory before running `node tools/near/create-sponsor.mjs`. Fund the resulting testnet sponsor, then run `node tools/near/relayer-local.mjs` alongside Vite. Netlify deployments use the settings in [`netlify.toml`](netlify.toml) and require `SPONSOR_ACCOUNT_ID` and `SPONSOR_PRIVATE_KEY` in the Functions environment.

- [Game tests](tests) cover the gameplay loop, pricing, market simulation, and browser/contract parity. The [Rust parity tests](contracts/economy/tests/parity.rs) use the same rule vectors.
- `?session=your-test-name` gives a guest a separate browser save and key. `?cutscene` replays the first eclipse after entering the valley.
- `npm run build` writes the static game to `dist/`. `python3 tools/package-release.py` packages an existing build for static hosting.

The game supports English and Ukrainian, mouse or touch map controls, keyboard navigation, and reduced motion. The art uses illustrated and AI-generated layers made for the project. See [art notes](docs/ART.md) and the [project license](LICENSE).
