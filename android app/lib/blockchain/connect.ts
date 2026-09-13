import 'react-native-get-random-values';
import { ethers } from 'ethers';
import * as SecureStore from 'expo-secure-store';

const CHAIN_ID = 56001;
const RPC_URL = process.env.EXPO_PUBLIC_RPC_URL || 'https://rpc.mstblockchain.com:443';

const KEYSTORE_PATH = 'mst_wallet_private_key';

export async function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
}

export async function getOrCreateWallet(): Promise<ethers.Wallet> {
  const provider = await getProvider();
  
  // Using the provided user wallet instead of local generation
  const privateKey = process.env.EXPO_PUBLIC_SYSTEM_PRIVATE_KEY || '0x2ce95cca0260b63efd1c38b6b0136797d0e10d9ebea2d1cc6689623431490b35';
  
  return new ethers.Wallet(privateKey, provider);
}
