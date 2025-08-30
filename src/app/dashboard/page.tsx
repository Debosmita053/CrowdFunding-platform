"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  UserIcon,
  BuildingOfficeIcon,
  WalletIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  ArrowRightIcon,
  PlusIcon,
  HeartIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CalendarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useBlockchain } from '@/hooks/useBlockchain';

export default function DashboardPage() {
  const router = useRouter();
  const blockchainContext = useBlockchain();
  const { isConnected, account, connectWallet, disconnectWallet } = blockchainContext || {};
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState({
    firstName: 'User',
    lastName: 'Account',
    role: 'donor',
    isWalletConnected: false,
    kycCompleted: false,
    walletAddress: ''
  });

  useEffect(() => {
    // Check if wallet is connected
    if (isConnected && account) {
      setUser(prev => ({
        ...prev,
        isWalletConnected: true,
        walletAddress: account,
        firstName: account.slice(0, 6) + '...' + account.slice(-4)
      }));
    }
    setIsLoading(false);
  }, [isConnected, account]);

  const handleLogout = () => {
    disconnectWallet();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-teal-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-2 border-purple-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="text-3xl font-bold flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-purple-600 rounded-full flex items-center justify-center mr-3 shadow-lg">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-purple-700">Clear</span>
              <span className="text-teal-600">Fund</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-purple-600 transition-colors">
                <BellIcon className="h-6 w-6" />
              </button>
              <button className="p-2 text-gray-600 hover:text-purple-600 transition-colors">
                <CogIcon className="h-6 w-6" />
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-700 hover:text-red-600 font-medium transition-colors"
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-teal-600 bg-clip-text text-transparent mb-2">
                Welcome back, {user.firstName}! 👋
              </h1>
              <p className="text-gray-600 text-lg">
                Ready to make a difference? Explore campaigns or create your own.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-semibold text-purple-600 capitalize">{user.role}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-teal-600 rounded-full flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <HeartIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Campaigns Supported</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Donated</p>
                <p className="text-2xl font-bold text-gray-900">0 ETH</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <DocumentTextIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mr-4">
                <ChartBarIcon className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">0%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* For Donors */}
          {user.role === 'donor' && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                  <HeartIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Support Campaigns</h2>
                  <p className="text-gray-600">Find and support causes you care about</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <Link href="/campaigns" className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 group">
                  <div className="flex items-center">
                    <GlobeAltIcon className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <p className="font-semibold text-gray-900">Browse Campaigns</p>
                      <p className="text-sm text-gray-600">Discover amazing projects</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link href="/events" className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border-2 border-green-200 hover:border-green-400 transition-all duration-300 group">
                  <div className="flex items-center">
                    <CalendarIcon className="h-6 w-6 text-green-600 mr-3" />
                    <div>
                      <p className="font-semibold text-gray-900">Upcoming Events</p>
                      <p className="text-sm text-gray-600">Join fundraising events</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          )}

          {/* For Creators */}
          {user.role === 'creator' && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center mr-4">
                  <BuildingOfficeIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Manage Campaigns</h2>
                  <p className="text-gray-600">Create and manage your fundraising campaigns</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <Link href="/create-campaign" className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border-2 border-green-200 hover:border-green-400 transition-all duration-300 group">
                  <div className="flex items-center">
                    <PlusIcon className="h-6 w-6 text-green-600 mr-3" />
                    <div>
                      <p className="font-semibold text-gray-900">Create Campaign</p>
                      <p className="text-sm text-gray-600">Start a new fundraising project</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link href="/my-campaigns" className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 group">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <p className="font-semibold text-gray-900">My Campaigns</p>
                      <p className="text-sm text-gray-600">View and manage your campaigns</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          )}

          {/* Account & Security */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-100">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-4">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Account & Security</h2>
                <p className="text-gray-600">Manage your profile and security settings</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div className="flex items-center">
                  <UserIcon className="h-6 w-6 text-gray-600 mr-3" />
                  <div>
                    <p className="font-semibold text-gray-900">Profile</p>
                    <p className="text-sm text-gray-600">{user.firstName} {user.lastName}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">✓ Connected</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div className="flex items-center">
                  <WalletIcon className="h-6 w-6 text-gray-600 mr-3" />
                  <div>
                    <p className="font-semibold text-gray-900">Wallet</p>
                    <p className="text-sm text-gray-600">
                      {user.isWalletConnected ? user.walletAddress : 'Not connected'}
                    </p>
                  </div>
                </div>
                <span className={`text-sm ${user.isWalletConnected ? 'text-green-600' : 'text-gray-500'}`}>
                  {user.isWalletConnected ? '✓ Connected' : 'Not connected'}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-6 w-6 text-gray-600 mr-3" />
                  <div>
                    <p className="font-semibold text-gray-900">KYC Status</p>
                    <p className="text-sm text-gray-600">
                      {user.kycCompleted ? 'Completed' : 'Not completed'}
                    </p>
                  </div>
                </div>
                <span className={`text-sm ${user.kycCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                  {user.kycCompleted ? '✓ Verified' : 'Not verified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DocumentTextIcon className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No recent activity</p>
            <p className="text-sm text-gray-400">Your blockchain activity will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
