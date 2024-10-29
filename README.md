# BeanGoTown

## Introduction

BeanGo Town is a game built on the AELF blockchain. Inspired by Monopoly. Users need to obtain the NFT to start the game. Click the GO button to roll the dice to determine the number of steps to move, and receive corresponding point rewards based on the location the piece lands on after the move.

- The game supports multiple ways to log in or register (Web2/Web3).
- The BeanPass NFT required to play the game can be collected directly in the game.
- The number of points rolled in the game is determined by random numbers generated on the chain.

### Portkey SDK Usage:

- @portkey/did-ui-react
- @portkey/contracts
- @portkey/services
- @portkey/detect-provider
- @portkey/types
- @portkey/utils

### Portkey GitHub:

- https://github.com/Portkey-Wallet/portkey-web
- https://github.com/Portkey-Wallet/portkey-providers

### Smart contract functions:

- Action: Play, Bingo
- View: CheckBeanPass, getGetPlayerInformation, GetBoutInformation
- Admin: Initialize, changeAdmin, SetGameLimitSettings, GetAdmin, GetGameLimitSettings

## 📦 Getting Started

In the project directory, you can run:

### Install dependencies

If `yarn` is not available [install](https://classic.yarnpkg.com/lang/en/docs/install) it first.

```bash
yarn
```

### Starting the local development server

```bash
yarn dev
```

Runs the app on [aelf's testnet](https://explorer-test.aelf.io/) in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.
The page will reload when you make changes.\
You may also see any linting errors in the console.

### Building the application for production

```
yarn build
```

Builds the app for production to the `.next` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.
The build is minified and the each of the filenames includes the hash of their content.\
Your app is ready to be deployed!

### Starting the application in production

```
yarn start
```

Runs the app at [aelf's mainnet](https://explorer.aelf.io/).
Start the application in production mode. The application should be compiled with `yarn build or npm run build` first.

## Rewrite Config

Rewrites allow you to map an incoming request path to a different destination path.
Configure the following rewrite paths in `build.config/rewrite/test.js`:

```js
module.exports = [
	{
		source: '/connect/:path*',
		destination: 'https://auth-portkey-test.portkey.finance/connect/:path*',
	},
	{
		source: '/portkey/:path*',
		destination: 'https://did-portkey-test.portkey.finance/:path*',
	},
	{
		source: '/api/:path*',
		destination: 'https://test.beangotown.com/api/:path*',
	},
	{
		source: '/cms/:path*',
		destination: 'https://test-cms.beangotown.com/:path*',
	},
	{
		source: '/AElfIndexer_DApp/PortKeyIndexerCASchema/:path*',
		destination: 'http://192.168.67.51:8083/AElfIndexer_DApp/PortKeyIndexerCASchema/:path*',
	},
	{
		source: '/AElfIndexer_BeangoTown/BeangoTownIndexerPluginSchema/:path*',
		destination: 'https://test.beangotown.com/AElfIndexer_BeangoTown/BeangoTownIndexerPluginSchema/:path*',
	},
];
```

## Something you need to know about the configuration

BeanGo Town has incorporated general configurations into the interface to facilitate the functionality of the dApp. Feel free to customise these configurations based on your specific requirements.

TestNet:

| Url                                                     | Description            |
| ------------------------------------------------------- | ---------------------- |
| https://test.beangotown.com/cms/items/chessboard_config | configuration of Board |
| https://test.beangotown.com/cms/items/chessboard_data   | Board data             |
| https://test.beangotown.com/cms/items/notice_modal      | activity Modal         |
| https://test.beangotown.com/cms/items/config            | Basic configuration    |

MainNet:

| Url                                                    | Description            |
| ------------------------------------------------------ | ---------------------- |
| https://www.beangotown.com/cms/items/chessboard_config | configuration of Board |
| https://www.beangotown.com/cms/items/chessboard_data   | Board data             |
| https://www.beangotown.com/cms/items/notice_modal      | activity Modal         |
| https://www.beangotown.com/cms/items/config            | Basic configuration    |

### Config

Basic configuration
Url: https://\*.beangotown.com/cms/items/config

| Field                     | Description                                |
| ------------------------- | ------------------------------------------ |
| rpcUrl                    | rpcUrl                                     |
| curChain                  | The chain on which the dApp is deployed    |
| gameRules                 | Some rules                                 |
| graphqlServer             | Portkey indexer server address             |
| portkeyServer             | Portkey rewrite baseurl                    |
| discoverRpcUrl            | rpcUrl when you are using Chrome extension |
| explorerBaseUrl           | explorerBaseUrl                            |
| portkeyServiceUrl         | Portkey service address                    |
| BeanGoTownGraphqlServer   | BeanGo Town indexer server address         |
| forestNftDetailUrl        | Url of BeanPass details                    |
| BeanGoTownContractAddress | BeanGo Town contract address               |

### ChessBoard Data

Url: https://\*.beangotown.com/cms/items/chessboard_data

| Field              | Description               |
| ------------------ | ------------------------- |
| data               | Board data                |
| imageResources     | The picture of the board  |
| btnImageResources  | The picture of the button |
| checkerboardCounts | Number of squares         |

data
| Field | Description |
| ----------- | ----------- |
| id | id |
| type | Grid type |
| arrow | Arrow direction |
| image | Image of the grid|

### Notice Modal

Url: https://\*.beangotown.com/cms/items/notice_modal
| Field | Description |
| ------------------ | ------------------------- |
| key | anything you want |

### ChessBoard Config

Url: https://\*.beangotown.com/cms/items/notice_modal
| Field | Description |
| ------------------ | ------------------------- |
| key | anything you want |

## Other supporting services

### Sentry

Replace the **dsn** in `sentry.config.ts` with your own configuration:

```ts
import * as Sentry from '@sentry/nextjs';

export const init = () =>
  Sentry.init({
    // Should add your own dsn
    dsn: 'https://****.ingest.sentry.io/*****',
    ...
  });
```

### Firebase

Replace in `src/utils/firebase.ts` with your own configuration:

```ts
const firebaseConfig = {
	apiKey: '<update>',
	authDomain: '<update>',
	projectId: '<update>',
	storageBucket: '<update>',
	messagingSenderId: '<update>',
	appId: '<update>',
	measurementId: 'G-<update>',
};
```

### Lighthouse

- Install locally with `npm i -g @lhci/cli`
- Run lighthouse with `lhci collect`
- See the results with `npx serve .lighthouseci`