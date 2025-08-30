import { useState } from 'react';
import { useBlockchain } from './useBlockchain';

export const useMilestone = () => {
  const [isApproving, setIsApproving] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const { approveMilestone, isConnected, connectWallet, isAdmin } = useBlockchain();

  const approveCampaignMilestone = async (campaignId: number, milestoneId: number) => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      setApprovalError('Only admin can approve milestones');
      return;
    }

    setIsApproving(true);
    setApprovalError(null);

    try {
      const receipt = await approveMilestone(campaignId, milestoneId);
      return receipt;
    } catch (error: any) {
      setApprovalError(error.message || 'Milestone approval failed');
      throw error;
    } finally {
      setIsApproving(false);
    }
  };

  return {
    isApproving,
    approvalError,
    approveCampaignMilestone,
    clearError: () => setApprovalError(null)
  };
};