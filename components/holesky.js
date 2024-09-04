import React, { useEffect, useState } from 'react';
import { useSDK } from "@metamask/sdk-react";
import { ethers } from 'ethers';

const HOLESKY_CHAIN_ID = '0x4268'; // Chain ID for Holesky in hexadecimal

const HoleskyNetworkSwitcher = () => {
  const { sdk, connected, provider } = useSDK();
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (connected && provider) {
      checkAndSwitchToHolesky();
    }
  }, [connected, provider]);

  const checkAndSwitchToHolesky = async () => {
    try {
      const currentChainId = await provider.request({ method: 'eth_chainId' });
      
      if (currentChainId !== HOLESKY_CHAIN_ID) {
        setStatus('Switching to Holesky network...');
        await switchToHolesky();
      } else {
        setStatus('Already connected to Holesky network');
      }
    } catch (error) {
      console.error('Error checking or switching network:', error);
      setStatus('Error checking or switching network');
    }
  };

  const switchToHolesky = async () => {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: HOLESKY_CHAIN_ID }],
      });
      setStatus('Successfully switched to Holesky network');
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await addHoleskyNetwork();
        } catch (addError) {
          console.error('Error adding Holesky network:', addError);
          setStatus('Error adding Holesky network');
        }
      } else {
        console.error('Error switching to Holesky network:', switchError);
        setStatus('Error switching to Holesky network');
      }
    }
  };

  const addHoleskyNetwork = async () => {
    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: HOLESKY_CHAIN_ID,
          chainName: 'Holesky Testnet',
          nativeCurrency: {
            name: 'Holesky ETH',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['https://ethereum-holesky.publicnode.com'],
          blockExplorerUrls: ['https://holesky.etherscan.io']
        }],
      });
      setStatus('Holesky network added successfully');
    } catch (error) {
      console.error('Error adding Holesky network:', error);
      setStatus('Error adding Holesky network');
    }
  };

  return (
    <div>
      <h2>Holesky Network Switcher</h2>
      <p>Status: {status}</p>
      <button onClick={checkAndSwitchToHolesky}>
        Check and Switch to Holesky
      </button>
    </div>
  );
};

export default HoleskyNetworkSwitcher;