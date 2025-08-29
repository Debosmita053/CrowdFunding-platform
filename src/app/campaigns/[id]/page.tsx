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
  CurrencyDollarIcon,
  ArrowRightIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useBlockchain } from '../../../hooks/useBlockchain';
import { Campaign, Milestone } from '../../../types/blockchain';

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = Number(params.id);
  
  const { 
    isConnected, 
    account, 
    connectWallet, 
    donate, 
    requestVerification,
    approveMilestone,
    getCampaign,
    getMilestones,
    isLoading: blockchainLoading
  } = useBlockchain();
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [donationAmount, setDonationAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDonating, setIsDonating] = useState(false);

  useEffect(() => {
    loadCampaignData();
  }, [campaignId]);

  const loadCampaignData = async () => {
    try {
      setIsLoading(true);
      const [campaignData, milestonesData] = await Promise.all([
        getCampaign(campaignId),
        getMilestones(campaignId)
      ]);
      
      setCampaign(campaignData);
      setMilestones(milestonesData);
    } catch (error) {
      console.error('Error loading campaign data:', error);
    } finally {
      setIsLoading(false);
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

    setIsDonating(true);
    try {
      await donate(campaignId, donationAmount);
      alert('Donation successful!');
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

    try {
      await requestVerification(campaignId, milestoneId);
      alert('Verification requested successfully!');
      // Refresh milestones data
      await loadCampaignData();
    } catch (error) {
      console.error('Error requesting verification:', error);
      alert('Failed to request verification. Please try again.');
    }
  };

  const handleApproveMilestone = async (milestoneId: number) => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    try {
      await approveMilestone(campaignId, milestoneId);
      alert('Milestone approved successfully!');
      // Refresh milestones data
      await loadCampaignData();
    } catch (error) {
      console.error('Error approving milestone:', error);
      alert('Failed to approve milestone. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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

  const progressPercentage = campaign && campaign.goal !== "0.0" 
    ? (parseFloat(campaign.totalRaised) / parseFloat(campaign.goal)) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation - Same as before */}
      {/* ... existing navigation ... */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Campaign Image */}
            <div className="relative">
              <img
                src={campaign.image || "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=500&fit=crop"}
                alt={campaign.title}
                className="w-full h-96 object-cover rounded-2xl"
              />
              {campaign.isActive && (
                <div className="absolute top-6 right-6 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center shadow-lg">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Active
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
                  <UserIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-base text-gray-500">Created by</p>
                  <p className="text-xl font-semibold text-gray-900">{campaign.creator}</p>
                </div>
              </div>

              {/* Campaign Details */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-base text-gray-500">Funding Goal</p>
                  <p className="text-2xl font-bold text-gray-900">${campaign.goal}</p>
                </div>
                <div>
                  <p className="text-base text-gray-500">Raised</p>
                  <p className="text-2xl font-bold text-gray-900">${campaign.totalRaised}</p>
                </div>
                <div>
                  <p className="text-base text-gray-500">Deadline</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {new Date(campaign.deadline * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-base text-gray-500">Status</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {campaign.isActive ? 'Active' : 'Completed'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between text-base mb-3">
                  <span className="text-gray-600">${campaign.totalRaised} raised</span>
                  <span className="text-gray-900 font-bold">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                  <div 
                    className="bg-blue-600 h-4 rounded-full" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-base text-gray-500">
                  of ${campaign.goal} goal
                </p>
              </div>
            </div>

            {/* Milestones */}
            <div className="bg-white rounded-2xl shadow-xl p-10">
              <h3 className="text-3xl font-bold text-gray-900 mb-8">Project Milestones</h3>
              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex items-start space-x-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium ${
                      milestone.isCompleted ? 'bg-green-500 text-white' :
                      milestone.isApproved ? 'bg-yellow-500 text-white' :
                      'bg-gray-300 text-gray-600'
                    }`}>
                      {milestone.isCompleted ? '✓' : index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xl font-semibold text-gray-900">Milestone {index + 1}</h4>
                        <span className="text-base text-gray-500">${milestone.amount}</span>
                      </div>
                      <p className="text-gray-600 text-base mb-3">{milestone.description}</p>
                      <div className="flex space-x-4">
                        {campaign.creator.toLowerCase() === account?.toLowerCase() && !milestone.isCompleted && (
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
                <div className="flex justify-between text-base mb-3">
                  <span className="text-gray-600">${campaign.totalRaised}</span>
                  <span className="text-gray-900 font-bold">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                  <div 
                    className="bg-blue-600 h-4 rounded-full" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-base text-gray-500">
                  raised of ${campaign.goal} goal
                </p>
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
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleDonate}
                  disabled={isDonating || !isConnected}
                  className="w-full bg-blue-600 text-white py-5 px-8 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDonating ? 'Processing...' : isConnected ? 'Donate Now' : 'Connect Wallet to Donate'}
                </button>
                
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
                  <span>Created {new Date(campaign.deadline * 1000).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-base text-gray-600">
                  <UserIcon className="h-5 w-5 mr-4" />
                  <span>{campaign.creator}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}