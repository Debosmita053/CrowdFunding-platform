import { ethers } from 'ethers';
import ClearFundABI from '../contracts/ClearFundABI.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xc1567832dE21b7d55d7D59C967f79c8e9c288090';

export const getContract = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ClearFundABI, signer);
  }
  return null;
};

export const getContractWithProvider = () => {
  if (typeof window !== 'undefined') {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.infura.io/v3/');
    return new ethers.Contract(CONTRACT_ADDRESS, ClearFundABI, provider);
  }
  return null;
};