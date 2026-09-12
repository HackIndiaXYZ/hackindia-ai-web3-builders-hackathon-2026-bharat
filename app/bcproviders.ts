import React, { createContext, useContext, useEffect, useState } from 'react';
import { flushOfflineAlerts } from '../lib/blockchain/verifyStaleAlerts';

type BlockchainContextType = {
  isAnchoring: boolean;
  setAnchoring: (val: boolean) => void;
  flushQueue: () => Promise<void>;
};

const BlockchainContext = createContext<BlockchainContextType>({
  isAnchoring: false,
  setAnchoring: () => {},
  flushQueue: async () => {},
});

export function BlockchainProvider({ children }: { children: React.ReactNode }) {
  const [isAnchoring, setAnchoring] = useState(false);

  const flushQueue = async () => {
    setAnchoring(true);
    await flushOfflineAlerts();
    setAnchoring(false);
  };

  useEffect(() => {
    flushQueue();
  }, []);

  return React.createElement(
    BlockchainContext.Provider,
    { value: { isAnchoring, setAnchoring, flushQueue } },
    children
  );
}

export const useBlockchain = () => useContext(BlockchainContext);
