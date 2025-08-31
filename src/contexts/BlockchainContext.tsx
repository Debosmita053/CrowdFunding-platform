'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { BlockchainContextType, Web3State, Campaign, Milestone } from '../types/blockchain';
import { getProvider, getSigner, switchToSepolia, formatEther, parseEther, checkNetworkConnection, resetMetaMaskConnection } from '../utils/web3';
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
    // Check for existing connection on page load
    const initializeConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            // User has accounts available, restore connection
            await handleAccountsChanged(accounts);
          }
        } catch (err) {
          console.error('Error checking existing connection:', err);
        }
      }
    };

    // Set up event listeners
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      // Check for existing connection
      initializeConnection();
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

  const handleAccountsChanged = async (accounts: string[]) => {
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
      // User has accounts available - restore connection if we have a valid account
      try {
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
      } catch (err) {
        console.error('Error restoring wallet connection:', err);
      }
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

      // Check network connection first
      const isConnected = await checkNetworkConnection();
      if (!isConnected) {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
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
      // Handle circuit breaker errors specifically
      if (err.message?.includes('circuit breaker') || 
          err.message?.includes('Execution prevented') ||
          err.code === -32603) {
        setError('MetaMask is temporarily unavailable. Please try refreshing the page or restarting MetaMask.');
      } else {
        setError(err.message || 'Failed to connect wallet');
      }
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

  const resetConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await resetMetaMaskConnection();
      if (success) {
        await checkConnection();
      } else {
        throw new Error('Failed to reset connection');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset connection');
      console.error('Error resetting connection:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetCircuitBreaker = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Show detailed instructions to user
      const instructions = `
🚨 META MASK CIRCUIT BREAKER RESET 🚨

The circuit breaker is blocking transactions. Follow these steps EXACTLY:

STEP 1 - RESET META MASK:
1. Open MetaMask
2. Go to Settings → Advanced
3. Click "Reset Account" (this clears transaction history)
4. Click "Clear Activity Tab Data"
5. Click "Reset Settings"

STEP 2 - RESET NETWORK:
1. Go to Settings → Networks
2. Delete your current test network
3. Add it back with the same settings

STEP 3 - WAIT & RETRY:
1. Wait 2-3 minutes
2. Try donating again

ALTERNATIVE - BROWSER RESET:
1. Close ALL browser windows
2. Clear browser cache (Ctrl+Shift+Delete)
3. Restart computer
4. Reopen browser and MetaMask

The circuit breaker is a safety mechanism that blocks requests when there are too many failed transactions.
      `;
      
      alert(instructions);
      
      // Wait longer before resetting connection
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Reset connection after user acknowledges
      await resetConnection();
      
    } catch (error) {
      console.error('Error resetting circuit breaker:', error);
      setError('Failed to reset circuit breaker. Please manually reset MetaMask.');
    } finally {
      setIsLoading(false);
    }
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

      // Check network connection before proceeding
      const isConnected = await checkNetworkConnection();
      if (!isConnected) {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      }
      
      const goalWei = parseEther(goal);
      const milestoneAmountsWei = milestoneAmounts.map(amount => parseEther(amount));
      
      console.log('Creating campaign with parameters:', {
        goal: goalWei.toString(),
        durationInDays,
        milestoneDescriptions,
        milestoneAmounts: milestoneAmountsWei.map(amount => amount.toString())
      });
      
      // Get the current campaign counter before creating the campaign
      const currentCounter = await state.contract.campaignCounter();
      const expectedCampaignId = Number(currentCounter) + 1;
      console.log('Expected campaign ID:', expectedCampaignId);
      
      // Call the createCampaign function
      const transaction = await state.contract.createCampaign(
        goalWei,
        durationInDays,
        milestoneDescriptions,
        milestoneAmountsWei
      );
      
      console.log('Transaction sent:', transaction.hash);
      
      const receipt = await transaction.wait();
      console.log('Transaction confirmed:', receipt);
      
      // Verify the campaign was created by checking the new counter
      const newCounter = await state.contract.campaignCounter();
      const actualCampaignId = Number(newCounter);
      console.log('Actual campaign ID from counter:', actualCampaignId);
      
      // Use the actual campaign ID
      const campaignId = actualCampaignId;
      
      // Add campaign ID to the receipt for easier access
      return {
        ...receipt,
        campaignId: campaignId
      };
      
    } catch (err: any) {
      // Handle circuit breaker errors specifically
      if (err.message?.includes('circuit breaker') || 
          err.message?.includes('Execution prevented') ||
          err.code === -32603) {
        const errorMessage = 'MetaMask is temporarily unavailable. Please try refreshing the page or restarting MetaMask.';
        setError(errorMessage);
        throw new Error(errorMessage);
      } else if (err.code === 'ACTION_REJECTED') {
        const errorMessage = 'Transaction was rejected by user.';
        setError(errorMessage);
        throw new Error(errorMessage);
      } else if (err.code === 'INSUFFICIENT_FUNDS') {
        const errorMessage = 'Insufficient funds to create campaign. Please check your wallet balance.';
        setError(errorMessage);
        throw new Error(errorMessage);
      } else {
        const errorMessage = err.message || 'Failed to create campaign';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const donate = async (campaignId: number, amount: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const maxRetries = 3;
      let lastError: any = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          if (!state.contract) {
            throw new Error('Contract not initialized');
          }
          
          const amountWei = parseEther(amount);
          
          // Add delay between retries for circuit breaker
          if (attempt > 1) {
            const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 2s, 4s, 8s
            console.log(`Retry attempt ${attempt}, waiting ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const transaction = await state.contract.donate(campaignId, {
            value: amountWei,
          });
          
          const receipt = await transaction.wait();
          return receipt;
          
        } catch (err: any) {
          lastError = err;
          
          // Handle circuit breaker error specifically
          if (err?.data?.cause?.isBrokenCircuitError || err?.message?.includes('circuit breaker')) {
            if (attempt < maxRetries) {
              console.log(`Circuit breaker detected on attempt ${attempt}, retrying...`);
              continue; // Try again
            } else {
              // Offer simulated donation as fallback
              const shouldSimulate = confirm(
                'MetaMask circuit breaker is open. Would you like to simulate the donation for testing purposes? (This will update the database but not send actual ETH)'
              );
              
              if (shouldSimulate) {
                console.log('Simulating donation due to circuit breaker...');
                // Simulate a successful donation
                return {
                  hash: '0x' + Math.random().toString(16).substr(2, 64),
                  status: 1,
                  simulated: true
                };
              } else {
                const circuitBreakerError = 'MetaMask circuit breaker is still open after multiple attempts. Please try: 1) Reset MetaMask (Settings → Advanced → Reset Account), 2) Switch networks and back, 3) Restart your browser, or 4) Wait a few minutes and try again.';
                setError(circuitBreakerError);
                throw new Error(circuitBreakerError);
              }
            }
          }
          
          // Handle other common errors
          if (err?.code === 'INSUFFICIENT_FUNDS') {
            const insufficientFundsError = 'Insufficient funds in your wallet for this donation.';
            setError(insufficientFundsError);
            throw new Error(insufficientFundsError);
          }
          
          if (err?.code === 'USER_REJECTED') {
            const userRejectedError = 'Transaction was rejected by user.';
            setError(userRejectedError);
            throw new Error(userRejectedError);
          }
          
          // For other errors, don't retry
          setError(err.message || 'Failed to donate');
          console.error('Error donating:', err);
          throw err;
        }
      }
      
      // If we get here, all retries failed
      setError(lastError?.message || 'Failed to donate after multiple attempts');
      throw lastError;
      
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

  // GET CURRENT CAMPAIGN COUNTER (for debugging)
  const getCurrentCampaignCounter = async (): Promise<number> => {
    try {
      if (!state.contract) {
        throw new Error('Contract not initialized');
      }
      
      const counter = await state.contract.campaignCounter();
      console.log('Current campaign counter:', Number(counter));
      return Number(counter);
    } catch (err: any) {
      console.error('Error getting current campaign counter:', err);
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
      if (!state.account) {
        return false;
      }
      
      const response = await fetch(`/api/admin/check-status?walletAddress=${state.account}`);
      const data = await response.json();
      
      return response.ok && data.isAdmin;
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
    resetConnection,
    resetCircuitBreaker,
    createCampaign,
    donate,
    requestVerification,
    approveMilestone,
    getCampaign,
    getMilestones,
    getCampaignCounter,
    getCurrentCampaignCounter,
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