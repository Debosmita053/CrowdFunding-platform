'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { BlockchainContextType, Web3State, Campaign, Milestone } from '../types/blockchain';
import { getProvider, getSigner, switchToSepolia, formatEther, parseEther } from '../utils/web3';
import { getContract, getContractWithProvider } from '../utils/contracts';

export const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

interface BlockchainProviderProps {
  children: ReactNode;
}

export const BlockchainProvider: React.FC<BlockchainProviderProps> = ({ children }) => {
  const [state, setState] = useState<Web3State>({
    isConnected: false,
    account: null,
    contract: null,
    provider: null,
    signer: null,
    chainId: null,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0) {
          const provider = getProvider();
          const signer = await getSigner();
          const contract = await getContract();
          const network = await provider?.getNetwork();
          
          setState({
            isConnected: true,
            account: accounts[0],
            contract,
            provider,
            signer,
            chainId: Number(network?.chainId) || null,
          });
        }
      } catch (err) {
        console.error('Error checking connection:', err);
      }
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      setState({
        isConnected: false,
        account: null,
        contract: null,
        provider: null,
        signer: null,
        chainId: null,
      });
    } else {
      setState(prev => ({
        ...prev,
        account: accounts[0],
      }));
    }
  };

  const handleChainChanged = (chainId: string) => {
    window.location.reload();
  };

  const connectWallet = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install it to use this application.');
      }
      
      // Switch to Sepolia network
      const switched = await switchToSepolia();
      if (!switched) {
        throw new Error('Failed to switch to Sepolia network');
      }
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      const provider = getProvider();
      const signer = await getSigner();
      const contract = await getContract();
      const network = await provider?.getNetwork();
      
      setState({
        isConnected: true,
        account: accounts[0],
        contract,
        provider,
        signer,
        chainId: Number(network?.chainId) || null,
      });
      
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Error connecting wallet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setState({
      isConnected: false,
      account: null,
      contract: null,
      provider: null,
      signer: null,
      chainId: null,
    });
  };

  const createCampaign = async (
    goal: string, 
    durationInDays: number, 
    milestoneDescriptions: string[], 
    milestoneAmounts: string[]
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!state.contract) {
        throw new Error('Contract not initialized');
      }
      
      const goalWei = parseEther(goal);
      const milestoneAmountsWei = milestoneAmounts.map(amount => parseEther(amount));
      
      const transaction = await state.contract.createCampaign(
        goalWei,
        durationInDays,
        milestoneDescriptions,
        milestoneAmountsWei
      );
      
      const receipt = await transaction.wait();
      return receipt;
      
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
      console.error('Error creating campaign:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const donate = async (campaignId: number, amount: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!state.contract) {
        throw new Error('Contract not initialized');
      }
      
      const amountWei = parseEther(amount);
      
      const transaction = await state.contract.donate(campaignId, {
        value: amountWei,
      });
      
      const receipt = await transaction.wait();
      return receipt;
      
    } catch (err: any) {
      setError(err.message || 'Failed to donate');
      console.error('Error donating:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const requestVerification = async (campaignId: number, milestoneId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!state.contract) {
        throw new Error('Contract not initialized');
      }
      
      const transaction = await state.contract.requestVerification(campaignId, milestoneId);
      const receipt = await transaction.wait();
      return receipt;
      
    } catch (err: any) {
      setError(err.message || 'Failed to request verification');
      console.error('Error requesting verification:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const approveMilestone = async (campaignId: number, milestoneId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!state.contract) {
        throw new Error('Contract not initialized');
      }
      
      const transaction = await state.contract.approveMilestone(campaignId, milestoneId);
      const receipt = await transaction.wait();
      return receipt;
      
    } catch (err: any) {
      setError(err.message || 'Failed to approve milestone');
      console.error('Error approving milestone:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getCampaign = async (campaignId: number): Promise<Campaign> => {
    try {
      const contract = getContractWithProvider();
      if (!contract) {
        throw new Error('Contract not initialized');
      }
      
      const campaign = await contract.getCampaign(campaignId);
      
      return {
        id: campaignId,
        creator: campaign.creator,
        goal: formatEther(campaign.goal.toString()),
        totalRaised: formatEther(campaign.totalRaised.toString()),
        deadline: Number(campaign.deadline),
        isActive: campaign.isActive,
        description: campaign.description,
        title: campaign.title,
        image: campaign.image,
      };
      
    } catch (err: any) {
      console.error('Error getting campaign:', err);
      throw err;
    }
  };

  const getMilestones = async (campaignId: number): Promise<Milestone[]> => {
    try {
      const contract = getContractWithProvider();
      if (!contract) {
        throw new Error('Contract not initialized');
      }
      
      const milestones = await contract.getMilestones(campaignId);
      
      return milestones.map((milestone: any) => ({
        description: milestone.description,
        amount: formatEther(milestone.amount.toString()),
        isApproved: milestone.isApproved,
        isCompleted: milestone.isCompleted,
      }));
      
    } catch (err: any) {
      console.error('Error getting milestones:', err);
      throw err;
    }
  };

  // GET CAMPAIGN COUNTER
  const getCampaignCounter = async (): Promise<number> => {
    try {
      const contract = getContractWithProvider();
      if (!contract) {
        throw new Error('Contract not initialized');
      }
      
      const counter = await contract.campaignCounter();
      return Number(counter);
    } catch (err: any) {
      console.error('Error getting campaign counter:', err);
      throw err;
    }
  };

  // GET ALL CAMPAIGNS
  const getAllCampaigns = async (): Promise<Campaign[]> => {
    try {
      const contract = getContractWithProvider();
      if (!contract) {
        throw new Error('Contract not initialized');
      }
      
      const counter = await getCampaignCounter();
      const campaigns: Campaign[] = [];
      
      for (let i = 1; i <= counter; i++) {
        try {
          const campaign = await getCampaign(i);
          campaigns.push(campaign);
        } catch (error) {
          // Campaign might not exist or other error, skip it
          console.warn(`Campaign ${i} not found or error:`, error);
        }
      }
      
      return campaigns;
    } catch (err: any) {
      console.error('Error getting all campaigns:', err);
      throw err;
    }
  };

  // CHECK IF USER IS ADMIN
  const isAdmin = async (): Promise<boolean> => {
    try {
      if (!state.contract || !state.account) {
        return false;
      }
      
      const adminAddress = await state.contract.admin();
      return adminAddress.toLowerCase() === state.account.toLowerCase();
    } catch (err: any) {
      console.error('Error checking admin status:', err);
      return false;
    }
  };

  // CHECK IF USER IS CAMPAIGN CREATOR
  const isCampaignCreator = async (campaignId: number): Promise<boolean> => {
    try {
      if (!state.contract || !state.account) {
        return false;
      }
      
      const campaign = await getCampaign(campaignId);
      return campaign.creator.toLowerCase() === state.account.toLowerCase();
    } catch (err: any) {
      console.error('Error checking campaign creator status:', err);
      return false;
    }
  };

  // CHECK VERIFICATION STATUS
  const getVerificationStatus = async (campaignId: number, milestoneId: number): Promise<boolean> => {
    try {
      const contract = getContractWithProvider();
      if (!contract) {
        throw new Error('Contract not initialized');
      }
      
      const status = await contract.verificationRequests(campaignId, milestoneId);
      return status;
    } catch (err: any) {
      console.error('Error getting verification status:', err);
      throw err;
    }
  };

  // GET CAMPAIGN DEADLINE STATUS
  const isCampaignActive = async (campaignId: number): Promise<boolean> => {
    try {
      const campaign = await getCampaign(campaignId);
      const currentTime = Math.floor(Date.now() / 1000);
      return campaign.isActive && campaign.deadline > currentTime;
    } catch (err: any) {
      console.error('Error checking campaign status:', err);
      throw err;
    }
  };

  // GET TOTAL MILESTONES FOR CAMPAIGN
  const getTotalMilestones = async (campaignId: number): Promise<number> => {
    try {
      const milestones = await getMilestones(campaignId);
      return milestones.length;
    } catch (err: any) {
      console.error('Error getting total milestones:', err);
      throw err;
    }
  };

  // LISTEN FOR EVENTS
  const listenForCampaignCreated = (callback: (campaignId: number, creator: string, goal: string, deadline: number) => void) => {
    if (!state.contract) return;
    
    state.contract.on('CampaignCreated', (campaignId: bigint, creator: string, goal: bigint, deadline: bigint) => {
      callback(Number(campaignId), creator, formatEther(goal.toString()), Number(deadline));
    });
  };

  const listenForDonationReceived = (callback: (campaignId: number, donor: string, amount: string) => void) => {
    if (!state.contract) return;
    
    state.contract.on('DonationReceived', (campaignId: bigint, donor: string, amount: bigint) => {
      callback(Number(campaignId), donor, formatEther(amount.toString()));
    });
  };

  const listenForVerificationRequested = (callback: (campaignId: number, milestoneId: number) => void) => {
    if (!state.contract) return;
    
    state.contract.on('VerificationRequested', (campaignId: bigint, milestoneId: bigint) => {
      callback(Number(campaignId), Number(milestoneId));
    });
  };

  const listenForMilestoneApproved = (callback: (campaignId: number, milestoneId: number) => void) => {
    if (!state.contract) return;
    
    state.contract.on('MilestoneApproved', (campaignId: bigint, milestoneId: bigint) => {
      callback(Number(campaignId), Number(milestoneId));
    });
  };

  // REMOVE EVENT LISTENERS
  const removeAllListeners = () => {
    if (!state.contract) return;
    
    state.contract.removeAllListeners();
  };

  const value: BlockchainContextType = {
    ...state,
    connectWallet,
    disconnectWallet,
    createCampaign,
    donate,
    requestVerification,
    approveMilestone,
    getCampaign,
    getMilestones,
    getCampaignCounter,
    getAllCampaigns,
    isAdmin,
    isCampaignCreator,
    getVerificationStatus,
    isCampaignActive,
    getTotalMilestones,
    listenForCampaignCreated,
    listenForDonationReceived,
    listenForVerificationRequested,
    listenForMilestoneApproved,
    removeAllListeners,
    isLoading,
    error,
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};