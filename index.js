const crypto = require('crypto');
const axios = require('axios');
const prompt = require('prompt-sync')();

class Block {
    constructor(index, transactions, timestamp, previousHash, nonce = 0, data = [{}]) {
        this.index = index;
        this.transactions = transactions;
		this.data = data;
        this.timestamp = timestamp;
        this.previousHash = previousHash;
        this.nonce = nonce;
		this.previousHash = previousHash;
    }

    computeHash() {
        const blockString = JSON.stringify(this, Object.keys(this).sort());
		return crypto.createHash('sha256').update(blockString).digest('hex');
    }
}

class Miner {
    constructor(serverUrl, minerAddress) {
        this.serverUrl = serverUrl;
        this.minerAddress = minerAddress;
        console.log("\x1b[33m Welcome to CodersCoin Miner! \x1b[0m");
        console.log("\n");
        console.log(" -------------------------------------------- ");
        console.log("\n");
    }

    async mine() {
        console.log("Looking for a block to mine...");
        try {
            const dt = await axios.get(`${this.serverUrl}/api/get/latestblock`);
            const block = dt.data;

            const mineableBlock = new Block(block.index, block.transactions, block.timestamp, block.previousHash,block.nonce, block.data);
            console.log("\x1b[34m Received a new job: ", block.index, "\x1b[0m");
            const latestHash = mineableBlock.computeHash();
            console.log("Latest hash: ", latestHash);

            const now = Math.floor(Date.now() / 1000);
            const newBlock = new Block(mineableBlock.index + 1, mineableBlock.transactions, now, latestHash);
            const proof = this.proofofwork(newBlock);
            console.log("Proof:", proof);

            if (!this.isValidProof(newBlock, proof)) {
                console.log("\x1b[31m Not valid proof \x1b[0m");
            } else {
                console.log("\x1b[92m Proof seems to be valid! \x1b[0m");
            }

            const crafted = this.craftResponse(latestHash, [mineableBlock.index + 1, mineableBlock.transactions, now, latestHash], proof, this.minerAddress);

            const response = await axios.post(`${this.serverUrl}/mine/`, crafted);
            if (response.status === 200) {
                console.log("Block mined and added to the blockchain!");
                prompt("Press enter to mine again...");
            } else {
                console.log("\x1b[31m Mining failed. \x1b[0m");
            }
        } catch (error) {
            console.error("\x1b[31m An error occurred during mining:", error.message, " CSC has different meanings for error messages, check the README file on Github! \x1b[0m");
            prompt("Press enter to mine again...");
        }
    }

    proofofwork(block) {
        block.nonce = 0;
        let computedHash = block.computeHash();
        const difficulty = 2; // Assuming 'difficulty' is a property of the block object

        while (!computedHash.startsWith('0'.repeat(difficulty))) {
            block.nonce++;
            computedHash = block.computeHash();
        }
		console.log("\x1b[93m Mining with difficulty: ", block.nonce, "... \x1b[0m")
        return computedHash;
    }

    isValidProof(block, blockHash) {
        return blockHash.startsWith('0'.repeat(2)) && blockHash === block.computeHash();
    }

    craftResponse(latestHash, newBlock, proof, miner) {
		console.log("\x1b[93m Submitting block to the network... \x1b[0m");
        const data = {
            latesthash: latestHash,
            proof: proof,
            newblock: newBlock,
            miner: miner
        };
        return data;
    }
}

// Usage example
const miner = new Miner("TESTNET URL IS SECRET", prompt('What is your username? > '));
miner.mine();
