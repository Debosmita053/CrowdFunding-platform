'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  HeartIcon,
  ShareIcon,
  UserIcon,
  CalendarIcon,
  MapPinIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useBlockchain } from '../../../hooks/useBlockchain';

// Campaign interface for database data
interface DBCampaign {
  _id: string;
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  goalAmount: number;
  currentAmount: number;
  currency: string;
  images: Array<{ url: string; publicId: string; caption: string }>;
  mainImage: { url: string; publicId: string } | null;
  creator: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  };
  creatorWalletAddress: string;
  status: string;
  startDate: string;
  endDate: string;
  location: {
    country: string;
    city: string;
    address: string;
  };
  tags: string[];
  milestones: Array<{
    title: string;
    description: string;
    targetAmount: number;
    isCompleted: boolean;
    completedAt?: string;
  }>;
  blockchainData: {
    contractAddress: string;
    campaignId: number;
    totalTransactions: number;
  };
  isVerified: boolean;
  totalDonors: number;
  createdAt: string;
  updatedAt: string;
  progressPercentage: number;
  daysRemaining: number;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;
  
  const { 
    isConnected, 
    account, 
    connectWallet, 
    donate, 
    requestVerification,
    resetCircuitBreaker,
    getCampaign,
    createCampaign,
    getCurrentCampaignCounter,
    error: blockchainError
  } = useBlockchain();
  
  const [campaign, setCampaign] = useState<DBCampaign | null>(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDonating, setIsDonating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockchainExists, setBlockchainExists] = useState<boolean | null>(null);
  const [isCheckingBlockchain, setIsCheckingBlockchain] = useState(false);
  const [isRedeploying, setIsRedeploying] = useState(false);

  useEffect(() => {
    if (campaignId) {
      loadCampaignData();
    }
  }, [campaignId]);

  const loadCampaignData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch campaign from database API
      const response = await fetch(`/api/campaigns/${campaignId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Campaign not found');
      }
      
      setCampaign(data.campaign);
      
      // Check if campaign exists on blockchain
      if (data.campaign?.blockchainData?.campaignId) {
        await checkBlockchainCampaign(data.campaign.blockchainData.campaignId);
      }
    } catch (error) {
      console.error('Error loading campaign data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const checkBlockchainCampaign = async (blockchainCampaignId: number) => {
    if (!isConnected) return;
    
    setIsCheckingBlockchain(true);
    try {
      await getCampaign(blockchainCampaignId);
      setBlockchainExists(true);
    } catch (error) {
      console.log('Campaign does not exist on blockchain:', error);
      setBlockchainExists(false);
    } finally {
      setIsCheckingBlockchain(false);
    }
  };

  const handleDonate = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      alert('Please enter a valid donation amount');
      return;
    }

    // Check if campaign has blockchain data
    if (!campaign?.blockchainData?.campaignId) {
      alert('This campaign is not yet deployed on blockchain. Please try again later.');
      return;
    }

    // Check if campaign exists on blockchain
    if (blockchainExists === false) {
      alert('This campaign no longer exists on the blockchain (likely due to a blockchain reset). Please contact the campaign creator to redeploy it.');
      return;
    }

    setIsDonating(true);
    try {
      // Use the blockchain campaign ID, not the MongoDB ID
      const result = await donate(campaign.blockchainData.campaignId, donationAmount);
      
      // Check if this was a simulated donation
      if (result.simulated) {
        // Update the database for simulated donations
        try {
          const response = await fetch(`/api/campaigns/${campaign._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              currentAmount: campaign.currentAmount + parseFloat(donationAmount),
              donors: [
                ...campaign.donors,
                {
                  walletAddress: account,
                  amount: parseFloat(donationAmount),
                  transactionHash: result.hash,
                  donatedAt: new Date().toISOString()
                }
              ]
            })
          });
          
          if (response.ok) {
            alert('Simulated donation successful! Campaign updated in database.');
          } else {
            alert('Donation simulated but database update failed.');
          }
        } catch (dbError) {
          console.error('Database update error:', dbError);
          alert('Donation simulated but database update failed.');
        }
      } else {
        alert('Donation successful!');
      }
      
      setDonationAmount('');
      // Refresh campaign data to update total raised
      await loadCampaignData();
    } catch (error) {
      console.error('Error donating:', error);
      alert('Donation failed. Please try again.');
    } finally {
      setIsDonating(false);
    }
  };

  const handleRequestVerification = async (milestoneId: number) => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    // Check if campaign has blockchain data
    if (!campaign?.blockchainData?.campaignId) {
      alert('This campaign is not yet deployed on blockchain. Please try again later.');
      return;
    }

    try {
      await requestVerification(campaign.blockchainData.campaignId, milestoneId);
      alert('Verification requested successfully!');
      // Refresh milestones data
      await loadCampaignData();
    } catch (error) {
      console.error('Error requesting verification:', error);
      alert('Failed to request verification. Please try again.');
    }
  };



  const handleRedeployCampaign = async () => {
    if (!campaign) return;
    
    setIsRedeploying(true);
    try {
      // Prepare milestone data for blockchain
      const milestoneDescriptions = campaign.milestones.map(m => m.description);
      const milestoneAmounts = campaign.milestones.map(m => m.targetAmount.toString());
      
      // Create campaign on blockchain
      const result = await createCampaign(
        campaign.goalAmount.toString(),
        Math.ceil((new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24)),
        milestoneDescriptions,
        milestoneAmounts
      );
      
      // Get the new campaign ID from the result
      const newCampaignId = result.campaignId || Date.now();
      
      // Update the campaign in the database with the new blockchain ID
      const response = await fetch(`/api/campaigns/${campaign._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blockchainData: {
            ...campaign.blockchainData,
            campaignId: newCampaignId,
            totalTransactions: 0
          }
        })
      });
      
      if (response.ok) {
        alert(`Campaign successfully redeployed on blockchain with ID: ${newCampaignId}`);
        // Refresh campaign data
        await loadCampaignData();
      } else {
        throw new Error('Failed to update campaign in database');
      }
      
    } catch (error) {
      console.error('Error redeploying campaign:', error);
      alert('Failed to redeploy campaign. Please try again.');
    } finally {
      setIsRedeploying(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error loading campaign</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/campaigns" className="text-blue-600 hover:underline">
            Back to campaigns
          </Link>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Campaign not found</h1>
          <Link href="/campaigns" className="text-blue-600 hover:underline">
            Back to campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation - Same as before */}
      {/* ... existing navigation ... */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Blockchain Status Warning */}
        {blockchainExists === false && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Blockchain Campaign Not Found
                </h3>
                <p className="text-yellow-700 mb-4">
                  This campaign exists in our database but is no longer available on the blockchain. 
                  This typically happens when the local blockchain network is reset. 
                  Donations are currently disabled for this campaign.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => checkBlockchainCampaign(campaign.blockchainData.campaignId)}
                    disabled={isCheckingBlockchain}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {isCheckingBlockchain ? 'Checking...' : 'Check Again'}
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const counter = await getCurrentCampaignCounter();
                        alert(`Current blockchain campaign counter: ${counter}\nCampaign ID in database: ${campaign.blockchainData.campaignId}`);
                      } catch (error) {
                        alert('Error getting counter: ' + error);
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                  >
                    Debug Counter
                  </button>
                  {campaign.creatorWalletAddress.toLowerCase() === account?.toLowerCase() && (
                    <button
                      onClick={handleRedeployCampaign}
                      disabled={isRedeploying || !isConnected}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {isRedeploying ? 'Redeploying...' : 'Redeploy Campaign'}
                    </button>
                  )}
                  <Link
                    href="/campaigns"
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
                  >
                    Browse Other Campaigns
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Campaign Image */}
            <div className="relative">
              <img
                src={campaign.mainImage?.url || campaign.images[0]?.url || "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=500&fit=crop"}
                alt={campaign.title}
                className="w-full h-96 object-cover rounded-2xl"
              />
              {campaign.status === 'active' && (
                <div className="absolute top-6 right-6 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center shadow-lg">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Active
                </div>
              )}
              {campaign.isVerified && (
                <div className="absolute top-6 left-6 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center shadow-lg">
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  Verified
                </div>
              )}
            </div>

            {/* Campaign Info */}
            <div className="bg-white rounded-2xl shadow-xl p-10">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {campaign.title}
                  </h1>
                  <p className="text-xl text-gray-600 leading-relaxed">
                    {campaign.description}
                  </p>
                </div>
                <div className="flex space-x-4">
                  <button className="p-4 text-gray-400 hover:text-red-500 transition-colors border border-gray-200 rounded-xl hover:border-red-200">
                    <HeartIcon className="h-7 w-7" />
                  </button>
                  <button className="p-4 text-gray-400 hover:text-blue-600 transition-colors border border-gray-200 rounded-xl hover:border-blue-200">
                    <ShareIcon className="h-7 w-7" />
                  </button>
                </div>
              </div>

              {/* Creator Info */}
              <div className="flex items-center space-x-6 p-6 bg-gray-50 rounded-2xl mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  {campaign.creator.profileImage ? (
                    <img 
                      src={campaign.creator.profileImage} 
                      alt={`${campaign.creator.firstName} ${campaign.creator.lastName}`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-8 w-8 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="text-base text-gray-500">Created by</p>
                  <p className="text-xl font-semibold text-gray-900">{campaign.creator.firstName} {campaign.creator.lastName}</p>
                  <p className="text-sm text-gray-600">{campaign.creator.email}</p>
                </div>
              </div>

              {/* Campaign Details */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-base text-gray-500">Funding Goal</p>
                  <p className="text-2xl font-bold text-gray-900">{campaign.currency} {campaign.goalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-base text-gray-500">Raised</p>
                  <p className="text-2xl font-bold text-gray-900">{campaign.currency} {campaign.currentAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-base text-gray-500">Deadline</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {new Date(campaign.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-base text-gray-500">Status</p>
                  <p className="text-xl font-semibold text-gray-900 capitalize">
                    {campaign.status}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                {(() => {
                  const progressPercentage = campaign.goalAmount > 0 
                    ? Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100)
                    : 0;
                  return (
                    <>
                      <div className="flex justify-between text-base mb-3">
                        <span className="text-gray-600">{campaign.currency} {campaign.currentAmount.toLocaleString()} raised</span>
                        <span className="text-gray-900 font-bold">{Math.round(progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                        <div 
                          className="bg-blue-600 h-4 rounded-full" 
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-base text-gray-500">
                        of {campaign.currency} {campaign.goalAmount.toLocaleString()} goal
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Milestones */}
            <div className="bg-white rounded-2xl shadow-xl p-10">
              <h3 className="text-3xl font-bold text-gray-900 mb-8">Project Milestones</h3>
              <div className="space-y-8">
                {campaign.milestones.map((milestone, index) => (
                  <div key={index} className="flex items-start space-x-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium ${
                      milestone.isCompleted ? 'bg-green-500 text-white' :
                      'bg-gray-300 text-gray-600'
                    }`}>
                      {milestone.isCompleted ? '✓' : index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xl font-semibold text-gray-900">{milestone.title}</h4>
                        <span className="text-base text-gray-500">{campaign.currency} {milestone.targetAmount.toLocaleString()}</span>
                      </div>
                      <p className="text-gray-600 text-base mb-3">{milestone.description}</p>
                      <div className="flex space-x-4">
                        {campaign.creatorWalletAddress.toLowerCase() === account?.toLowerCase() && !milestone.isCompleted && blockchainExists !== false && (
                          <button
                            onClick={() => handleRequestVerification(index)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                          >
                            Request Verification
                          </button>
                        )}
                        {/* Admin functionality would go here */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Donation Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 sticky top-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Support this project</h3>
              
              {/* Progress */}
              <div className="mb-8">
                {(() => {
                  const progressPercentage = campaign.goalAmount > 0 
                    ? Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100)
                    : 0;
                  return (
                    <>
                      <div className="flex justify-between text-base mb-3">
                        <span className="text-gray-600">{campaign.currency} {campaign.currentAmount.toLocaleString()}</span>
                        <span className="text-gray-900 font-bold">{Math.round(progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                        <div 
                          className="bg-blue-600 h-4 rounded-full" 
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-base text-gray-500">
                        raised of {campaign.currency} {campaign.goalAmount.toLocaleString()} goal
                      </p>
                    </>
                  );
                })()}
              </div>

              {/* Donation Form */}
              <div className="space-y-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-3">
                    Donation amount (ETH)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                      placeholder="0.1"
                      disabled={blockchainExists === false}
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleDonate}
                  disabled={isDonating || !isConnected || blockchainExists === false}
                  className="w-full bg-blue-600 text-white py-5 px-8 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDonating ? 'Processing...' : 
                   blockchainExists === false ? 'Donations Disabled' :
                   isConnected ? 'Donate Now' : 'Connect Wallet to Donate'}
                </button>
                
                {blockchainError && blockchainError.includes('circuit breaker') && (
                  <div className="space-y-2 mt-3">
                    <button
                      onClick={resetCircuitBreaker}
                      className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-600 transition-colors text-sm"
                    >
                      Reset MetaMask Circuit Breaker
                    </button>
                    <button
                      onClick={() => {
                        alert('Please wait 2-3 minutes for the circuit breaker to reset automatically, then try donating again.');
                        window.location.reload();
                      }}
                      className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors text-xs"
                    >
                      Wait & Retry Later
                    </button>
                  </div>
                )}
                
                <p className="text-sm text-gray-500 text-center">
                  Your donation will be held in escrow until milestones are verified.
                </p>
              </div>
            </div>

            {/* Project Info */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-6">Project Info</h4>
              <div className="space-y-4">
                <div className="flex items-center text-base text-gray-600">
                  <CalendarIcon className="h-5 w-5 mr-4" />
                  <span>Created {new Date(campaign.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-base text-gray-600">
                  <UserIcon className="h-5 w-5 mr-4" />
                  <span>{campaign.creator.firstName} {campaign.creator.lastName}</span>
                </div>
                <div className="flex items-center text-base text-gray-600">
                  <MapPinIcon className="h-5 w-5 mr-4" />
                  <span>{campaign.location.city}, {campaign.location.country}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}