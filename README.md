# ShopCAP

ShopCAP is an MVP marketplace with tokenized cashback on Solidity.

The project demonstrates:
- partner management on-chain
- marketplace item listing
- simulated purchases through smart contracts
- cashback distribution in `SCAP`
- a React frontend with wallet connection, regular email/password auth, and a local JSON user registry

## Stack

- Smart contracts: Solidity, Hardhat, OpenZeppelin, Ethers v6
- Frontend: React, React Router, Ethers v6
- Local off-chain layer: Node.js JSON API for connected users
- Testing:
  - contract tests with Hardhat
  - frontend smoke/user tests with React Testing Library
  - load test for the local JSON API with a Node script

## Repository Layout

```text
backend/
├── contracts/                  Solidity contracts
├── scripts/                    Deploy and utility scripts
├── test/                       Hardhat contract tests
├── server/                     Local JSON API for connected users
├── data/                       JSON storage for user registry
├── frontend/                   React application
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── hardhat.config.ts
├── package.json
└── README.md
```

## Environment Variables

### Root `.env`

Copy [`.env.example`](./.env.example) to `.env` and fill values:

```env
INFURA_ID=your_infura_project_id
SEPOLIA_TESTNET_PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
USER_REGISTRY_PORT=3001
```

### Frontend `.env`

Copy [`frontend/.env.example`](./frontend/.env.example) to `frontend/.env`:

```env
REACT_APP_USER_REGISTRY_API_BASE=http://localhost:3001
REACT_APP_COINGECKO_DEMO_API_KEY=
REACT_APP_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

`REACT_APP_COINGECKO_DEMO_API_KEY` is optional. If it is empty, the frontend still tries to fetch the public rate endpoint and falls back to cache/default rate when needed.
`REACT_APP_SEPOLIA_RPC_URL` allows read-only Sepolia access, so the marketplace can render even without MetaMask.

## Installation

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

## Quick Start Commands

Run all commands from:

```bash
cd backend
```

### Project Run Commands

```bash
# start local JSON API for connected users
npm run users-api

# start the React frontend on localhost:3000
npm run frontend:dev

# start local Hardhat blockchain node
npm run chain

# deploy contracts to the local Hardhat node
npm run deploy:local

# create a production frontend build
npm run frontend:build

# deploy contracts to Sepolia
npm run deploy:sepolia
```

What these commands give you:
- `npm run users-api`
  Starts the local backend API on `localhost:3001` for saving and reading connected users from `data/users.json`.
- `npm run frontend:dev`
  Starts the website in development mode on `localhost:3000`.
- `npm run chain`
  Launches a local Hardhat blockchain for local smart contract development and testing.
- `npm run deploy:local`
  Deploys the contracts into the local Hardhat node and generates frontend config/ABI files.
- `npm run frontend:build`
  Produces the production-ready static frontend build in `frontend/build`.
- `npm run deploy:sepolia`
  Deploys the contracts to the Sepolia testnet and prints verification commands.

### Test Commands

```bash
# compile contracts
npm run compile

# run Hardhat smart contract tests
npm run test:contracts

# run React frontend tests
npm run test:frontend

# run load test for the local user registry API
npm run test:load

# run contract tests + frontend tests together
npm run test:all
```

What these commands give you:
- `npm run compile`
  Checks that Solidity contracts compile successfully before deployment or testing.
- `npm run test:contracts`
  Runs automated smart contract tests from `backend/test`.
- `npm run test:frontend`
  Runs frontend smoke/user tests for UI behavior and rendering.
- `npm run test:load`
  Stress-tests the local JSON API with concurrent requests and prints latency metrics.
- `npm run test:all`
  Runs the main automated checks for contracts and frontend in one command.

## Local Development

### Option A. Frontend + local JSON user registry

Run the local user registry API:

```bash
cd backend
npm run users-api
```

In another terminal run the frontend:

```bash
cd backend
npm run frontend:dev
```

Open:

```text
http://localhost:3000
```

### Option B. Full local blockchain flow

Start a local Hardhat node:

```bash
cd backend
npm run chain
```

Deploy contracts to the local node:

```bash
cd backend
npm run deploy:local
```

Then run:

```bash
cd backend
npm run users-api
```

And in another terminal:

```bash
cd backend
npm run frontend:dev
```

## Contract Commands

Compile contracts:

```bash
cd backend
npm run compile
```

Run contract tests:

```bash
cd backend
npm run test:contracts
```

## Frontend Tests

Run automatic frontend smoke/user tests:

```bash
cd backend
npm run test:frontend
```

Current frontend tests include:
- marketplace rendering with ruble prices
- user purchases rendering from local storage with ruble prices

Relevant files:
- [Home.test.js](./frontend/src/components/pages/Home.test.js)
- [UserDashboard.test.js](./frontend/src/components/Dashboard/UserDashboard.test.js)

## Load Testing

Run the local JSON API first:

```bash
cd backend
npm run users-api
```

Then in another terminal run the load test:

```bash
cd backend
npm run test:load
```

The script sends concurrent `POST /api/users/upsert` requests and prints:
- successful requests
- failed requests
- total wall time
- average latency
- P95 latency
- P99 latency

Load test variables:

```bash
LOAD_TEST_BASE_URL=http://localhost:3001
LOAD_TEST_REQUESTS=100
LOAD_TEST_CONCURRENCY=10
```

Implementation:
- [load-user-registry.js](./scripts/load-user-registry.js)

## Run All Available Automated Tests

```bash
cd backend
npm run test:all
```

This runs:
- contract tests
- frontend tests

## Sepolia Deployment

Make sure root `.env` is configured first.

Deploy to Sepolia:

```bash
cd backend
npm run deploy:sepolia
```

What the deploy script does:
- deploys `ShopCAPToken`
- deploys `PartnerRegistry`
- deploys `CashbackManager`
- deploys `ShopCAPPlatform`
- transfers `CashbackManager` ownership to `ShopCAPPlatform`
- generates frontend contract config
- copies ABI artifacts into the frontend
- prints Etherscan verification commands

Deploy script:
- [deploy.ts](./scripts/deploy.ts)

## Frontend Production Build

Create a production build:

```bash
cd backend
npm run frontend:build
```

The build output is generated inside:

```text
backend/frontend/build
```

## Website Deployment

### Vercel

The easiest way to deploy the React site is Vercel.

Recommended flow:

1. Push the repository to GitHub
2. Import the `frontend` directory as a Vercel project
3. Set environment variables in Vercel:
   - `REACT_APP_USER_REGISTRY_API_BASE`
   - `REACT_APP_COINGECKO_DEMO_API_KEY` if you use one
   - `REACT_APP_SEPOLIA_RPC_URL`
4. Build command:

```text
npm install && npm run build
```

5. Output directory:

```text
build
```

Important:
- if you deploy only the frontend, the local JSON registry API will not exist in Vercel automatically
- ordinary auth now falls back to browser storage when the local API is unavailable
- for production you should still replace the local JSON registry with a hosted backend or database

### Static Hosting

You can also deploy `frontend/build` to any static hosting platform:
- Vercel
- Netlify
- GitHub Pages
- Nginx

## Production Notes

Current price display works like this:
- item prices are shown to users in rubles
- before writing to the contract, the frontend converts rubles to ETH
- contract storage still keeps price in ETH

This means:
- the displayed ruble value can move with the live `ETH/RUB` rate
- if you want strictly fixed ruble prices, you need separate ruble price storage off-chain or contract changes

Current rate update model:
- frontend polling with cached fallback
- source: CoinGecko simple price endpoint
- user-facing rate logic:
  - [exchangeRateService.js](./frontend/src/services/exchangeRateService.js)
  - [useEthRubRate.js](./frontend/src/hooks/useEthRubRate.js)

## Useful Commands Summary

```bash
# local JSON API
npm run users-api

# local frontend
npm run frontend:dev

# hardhat node
npm run chain

# local deploy
npm run deploy:local

# sepolia deploy
npm run deploy:sepolia

# contract tests
npm run test:contracts

# frontend tests
npm run test:frontend

# load test
npm run test:load

# all automated tests
npm run test:all

# production frontend build
npm run frontend:build
```
