import { useState } from 'react';
import { useBlockchain } from './useBlockchain';

export const useVerification = () => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const { requestVerification, isConnected, connectWallet } = useBlockchain();

  const requestMilestoneVerification = async (campaignId: number, milestoneId: number) => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    setIsRequesting(true);
    setVerificationError(null);

    try {
      const receipt = await requestVerification(campaignId, milestoneId);
      return receipt;
    } catch (error: any) {
      setVerificationError(error.message || 'Verification request failed');
      throw error;
    } finally {
      setIsRequesting(false);
    }
  };

  return {
    isRequesting,
    verificationError,
    requestMilestoneVerification,
    clearError: () => setVerificationError(null)
  };
};