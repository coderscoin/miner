const net = require('net');
const crypto = require('crypto');
const axios = require('axios');


class Block {
    constructor(index, transactions, timestamp, previousHash, nonce = 0, data = {}, publicKey = "") {
        this.index = index;
        this.transactions = transactions;
		this.data = data;
        this.timestamp = timestamp;
        this.previousHash = previousHash;
        this.nonce = nonce;
		this.previousHash = previousHash;
        this.publicKey = publicKey;
    }

    computeHash() {
        const blockString = JSON.stringify(this, Object.keys(this).sort());
		return crypto.createHash('sha256').update(blockString).digest('hex');
    }

    toJSON() {
        return {
          index: this.index,
          transactions: this.transactions,
          timestamp: this.timestamp,
          previousHash: this.previousHash,
          nonce: this.nonce,
          data: this.data,
          publicKey: this.publicKey
        };
    }
    static fromJSON(json) {
		const { index, transactions, timestamp, previousHash, nonce, data, publicKey } = json;
		return new Block(index, transactions, timestamp, previousHash, nonce, data, publicKey);
	}
}

// ANSI escape codes for background colors
const backgroundColors = {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    reset: '\x1b[0m' // Reset to default color
};

function colorText(text, color) {
    return backgroundColors[color] + text + ' ' + backgroundColors.reset;
}

console.log("\x1b[33m Welcome to CodersCoin Miner! \x1b[0m");
console.log("\n");
console.log(" -------------------------------------------- ");
console.log("\n");




function proofofwork(block) {
    block.nonce = 0;
    let computedHash = block.computeHash();
    const difficulty = 2; // Assuming 'difficulty' is a property of the block object

    while (!computedHash.startsWith('0'.repeat(difficulty))) {
        block.nonce++;
        computedHash = block.computeHash();
    }

    console.log(colorText("CLIENT", "magenta"), "Mining with difficulty: ", block.nonce, "...");
    return computedHash;
}

function isValidProof(block, blockHash) {
    return blockHash.startsWith('0'.repeat(2)) && blockHash === block.computeHash();
}

const PEERLIST = [
	{host:"localhost", port:3000}
];

(async function() {
	try {
		await peerDiscovery();
	} catch (err) {
		console.log("Cannot connect to peers: ", err.message);
	}
})();

// PEER DISCOVERY FUNCTIONS



async function peerDiscovery() {
	const randomPeer = await getRandomPeer();

	console.log(randomPeer);

	if (randomPeer) {
		const { host, port } = randomPeer;
		const client = net.connect(port, host, () => {
			client.write(JSON.stringify({
				type: 'getPeers', 
				requester: {
					host: "wallet", // Your own host
					port: 3000, // Your own port
			  	}
			}));
		});

		client.on('data', (data) => {
			const receivedData = JSON.parse(data);
			if (receivedData.type === 'sendPeers') {
			  // Update your list of known peers with the information received
			  const newPeers = receivedData.peers;
			  newPeers.forEach((peer) => {
				if (!PEERLIST.some((knownPeer) => knownPeer.host === peer.host && knownPeer.port === peer.port)) {
						PEERLIST.push(peer);
				}
			  });
			  console.log('Updated the list of known peers!');
	  
			  // Attempt to connect to the newly discovered peers
			  
			}
			client.end();
		  });
	  
		  client.on('error', (error) => {
			console.error('Error during peer discovery: Could not connect to seed peer');
		  });
	}
}

function removePeer(peerSocket) {
	const peerIndex = connectedPeers.indexOf(peerSocket);
	if (peerIndex !== -1) {
		connectedPeers.splice(peerIndex, 1);
	}
}

async function getRandomPeer() {
	const randomIndex = Math.floor(Math.random() * PEERLIST.length);

	return PEERLIST[randomIndex];
}

function broadcastBlocks(latestBlock, newBlock, proof, minerUser, peer) {
    const data = {
        latestblock: latestBlock,
        newblock: newBlock,
        proof: proof,
        miner: minerUser
    }
    console.log(colorText("NETWORK", "yellow"), " Submitting the new block to the network...");
    const client = net.connect(peer.port, peer.host, () => {
        console.log(colorText("NETWORK", "blue"), "Connected to peer:", peer.host + ':' + peer.port);
        const requestData = { type: 'newBlock', blocks: data };
        client.write(JSON.stringify(requestData));
    });
    client.on('error', error => {
		broadcastBlocks(latestBlock, newBlock, proof, minerUser, getRandomPeer());
	});

}

// Usage example
//const miner = new Miner("https://csc.onrender.com", prompt('What is your username? > '));
//miner.mine();
//MINER: requests "mineRequest" receives "mineResponse" then returns "newBlock"

async function requestTransaction(peer) {
    const client = net.connect(peer.port, peer.host, () => {
        console.log(colorText("NETWORK", "blue"), "Connected to peer:", peer.host + ':' + peer.port);
        const requestData = { type: 'mineRequest' };
        client.write(JSON.stringify(requestData));
    });
    client.on('data', async data => {
        const receivedData = JSON.parse(data.toString());
        if (receivedData.type === 'mineResponse') {
            tx = receivedData.transaction;
            if(!tx) {
                console.log('Transaction pool is empty. Requesting a new peer...', receivedData);
                await requestTransaction(await getRandomPeer());
                return;
            }

            //Get latest blocks hash
            const latestBlockRaw = receivedData.latestBlock;
            const latestBlock = Block.fromJSON(latestBlockRaw);

            console.log(colorText("NETWORK", "yellow"), " Received a new job: ", latestBlock.index +1);

            const latestHash = latestBlock.computeHash();

            const now = Math.floor(Date.now() / 1000);
            const firsttransaction = tx.transaction;

            const newBlock = new Block(latestBlock.index + 1, [
                firsttransaction,
                { fromAddress:firsttransaction.fromAddress, toAddress:tx.node, amount:(firsttransaction.amount * 0.15) / 2 },
                { fromAddress:firsttransaction.fromAddress, toAddress:"mineruser", amount:(firsttransaction.amount * 0.15) / 2 },
            ], now, latestHash, 0, {}, tx.publicKey);

            const proof = proofofwork(newBlock);
            console.log("Proof:", proof);

            if (!isValidProof(newBlock, proof)) {
                console.log(colorText("CLIENT", "red"), "Invalid proof!");
            } else {
                console.log(colorText("CLIENT", "green"), "Proof seems to be valid!");
            }

            broadcastBlocks(latestBlock.toJSON(), newBlock.toJSON(), proof, "mineruser", {host:"localhost", port:3000});


        }else {
            client.end();
            return false;
        }
        
    });
}

const miningInterval = 10000; // Set the interval in milliseconds (e.g., 60 seconds)

(async function() {
    setInterval(async () => {
        await requestTransaction(await getRandomPeer());
    }, miningInterval);
})();

