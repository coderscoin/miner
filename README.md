# CodersCoin Miner
This is the official mining software for CSC cryptocurrency. CodersCoin uses the Proof of Work consensus algorithm to validate blocks, but due to the lightweight nature of the blockchain, hashing and the proof of work process do not require too much computing capacity unlike other cryptocurrencies.

[![Available](https://img.shields.io/badge/Available-Testnet-blue)](https://choosealicense.com/licenses/mit/)
[![Release](https://img.shields.io/badge/Release-None-red)](https://opensource.org/licenses/)
## Features

- Light/dark mode toggle
- Live previews
- Fullscreen mode
- Cross platform
## Mining API reference

### Get the latest block

```https
  GET /api/get/latestblock
```
This returns the latest block on the chain in JSON format.
#### Example Response
```json
{"index":12,"transactions":[{"fromAddress":"user1","toAddress":"user2","amount":10}],"timestamp":1688201520,"previousHash":"00329e3f7babcfc4dece5d7e2052b7eadf901b208e305d31f971145a85a5fe2c","nonce":270}
```
### Submit mined block

```https
  POST /mine/
```
#### Request
| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `latesthash` | `string` | **Required**. The computed hash of the latest block |
| `proof` | `string` | **Required**. The proof returned from the PoW algorithm |
| `newblock` | `list` | **Required**. The newly mined block's details |
| `miner` | `string` | **Required**. The username of the miner |

#### Response
| Code | Description                       |
| :-------- | :-------------------------------- |
| `200` | The mining is successful and has been accepted by the network. |
| `500` | Mining failed, the network rejected the request because it is incorrect. |

## Run Locally

Clone the project

```bash
  git clone https://link-to-project
```

Go to the project directory

```bash
  cd my-project
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start
```
## Contributing

Contributions are always welcome!

See `contributing.md` for ways to get started.

Please adhere to this project's `code of conduct`.
## Authors

- [@petertill](https://www.github.com/petertill)
