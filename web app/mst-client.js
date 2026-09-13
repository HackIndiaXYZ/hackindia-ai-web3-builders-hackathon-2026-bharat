// MST Blockchain Client
const CHAIN_ID = 56001; // MST Chain ID for Bharat Aapda Prabandhan
const MST_RPC_URL = 'https://rpc.mst-blockchain.network'; // Replace with actual RPC

class MSTClient {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
    }

    async connectWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                // Request account access
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.userAddress = accounts[0];
                
                // Set up ethers provider
                this.provider = new ethers.BrowserProvider(window.ethereum);
                this.signer = await this.provider.getSigner();

                // Check network
                const network = await this.provider.getNetwork();
                if (Number(network.chainId) !== CHAIN_ID) {
                    await this.switchToMSTNetwork();
                }

                console.log("Connected to wallet:", this.userAddress);
                return this.userAddress;
            } catch (error) {
                console.error("User denied account access or error occurred:", error);
                throw error;
            }
        } else {
            alert('Please install MetaMask or a Web3 wallet to use this feature.');
            throw new Error('No web3 provider found');
        }
    }

    async switchToMSTNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: ethers.toBeHex(CHAIN_ID) }],
            });
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: ethers.toBeHex(CHAIN_ID),
                                chainName: 'MST Blockchain',
                                rpcUrls: [MST_RPC_URL],
                                nativeCurrency: {
                                    name: 'MST Token',
                                    symbol: 'MST',
                                    decimals: 18
                                },
                            },
                        ],
                    });
                } catch (addError) {
                    console.error("Failed to add MST network:", addError);
                    throw addError;
                }
            } else {
                console.error("Failed to switch network:", switchError);
                throw switchError;
            }
        }
    }

    // Example function to broadcast an alert to the blockchain
    async broadcastAlert(alertHex) {
        if (!this.signer) throw new Error("Wallet not connected");
        
        try {
            // Send a zero-value transaction with hex payload
            const tx = await this.signer.sendTransaction({
                to: this.userAddress, // Sending to self for anchoring
                value: 0,
                data: alertHex // The hex encoded alert data
            });
            
            console.log("Alert broadcasted. Tx Hash:", tx.hash);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error("Failed to broadcast alert:", error);
            throw error;
        }
    }
}

// Make globally available
window.mstClient = new MSTClient();
