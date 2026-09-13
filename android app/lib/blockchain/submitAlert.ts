import { getOrCreateWallet } from './connect';

export async function submitAlertToMST(alertPayload: any): Promise<string> {
  const wallet = await getOrCreateWallet();
  
  // We stringify the alert and send a zero-value transaction with the alert data as hex payload.
  // This acts as a tamper-evident anchor on the MST PoSA chain.
  const data = Buffer.from(JSON.stringify(alertPayload)).toString('hex');
  
  const tx = {
    to: wallet.address, // send to self to just store data
    value: 0,
    data: '0x' + data,
  };

  try {
    const transaction = await wallet.sendTransaction(tx);
    const receipt = await transaction.wait();
    return receipt?.hash || transaction.hash;
  } catch (err) {
    console.error("Failed to anchor alert to MST Blockchain", err);
    throw err;
  }
}
