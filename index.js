const crypto = require('crypto');
const axios = require('axios');
const prompt = require('prompt-sync')();

class Block {
    constructor(index, transactions, timestamp, previousHash, nonce = 0) {
        this.index = index;
        this.transactions = transactions;
        this.timestamp = timestamp;
        this.previousHash = previousHash;
        this.nonce = nonce;
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
        console.log("Welcome to CodersCoin Miner!");
        console.log("\n");
        console.log(" -------------------------------------------- ");
        console.log("\n");
    }

    async mine() {
        console.log("Looking for a block to mine...");
        try {
            const dt = await axios.get(`${this.serverUrl}/api/get/latestblock`);
            const block = dt.data;

            const mineableBlock = new Block(block.index, block.transactions, block.timestamp, block.previousHash, block.nonce);
            console.log(mineableBlock);
            const latestHash = mineableBlock.computeHash();
            console.log("Latest hash: ", latestHash);

            const now = Math.floor(Date.now() / 1000);
            const newBlock = new Block(mineableBlock.index + 1, mineableBlock.transactions, now, latestHash);
            const proof = this.proofofwork(newBlock);
            console.log("Proof:", proof);

            if (!this.isValidProof(newBlock, proof)) {
                console.log("Not valid proof");
            } else {
                console.log("Good to go");
            }

            const crafted = this.craftResponse(latestHash, [mineableBlock.index + 1, mineableBlock.transactions, now, latestHash], proof, this.minerAddress);

            const response = await axios.post(`${this.serverUrl}/mine/`, crafted);
            if (response.status === 200) {
                console.log("Block mined and added to the blockchain!");
            } else {
                console.log("Mining failed.");
            }
        } catch (error) {
            console.error("An error occurred during mining:", error.message, " CSC has different meanings for error messages, check the README file on Github!");
        }
    }

    proofofwork(block) {
        console.log("Pow: ", block.nonce);
        block.nonce = 0;
        let computedHash = block.computeHash();
        const difficulty = 2; // Assuming 'difficulty' is a property of the block object

        while (!computedHash.startsWith('0'.repeat(difficulty))) {
            block.nonce++;
            computedHash = block.computeHash();
        }

        return computedHash;
    }

    isValidProof(block, blockHash) {
        return blockHash.startsWith('0'.repeat(2)) && blockHash === block.computeHash();
    }

    craftResponse(latestHash, newBlock, proof, miner) {
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
const miner = new Miner("https://csc.onrender.com", prompt('What is your username? > '));
miner.mine();
