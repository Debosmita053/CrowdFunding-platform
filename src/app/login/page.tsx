"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBlockchain } from '@/hooks/useBlockchain';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  ShieldCheckIcon,
  WalletIcon,
  UserIcon,
  LockClosedIcon,
  ArrowRightIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface WalletLogin {
  isConnected: boolean;
  walletAddress: string;
}

interface OTPData {
  email: string;
  emailOTP: string;
  emailVerified: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const blockchainContext = useBlockchain();
  const { isConnected, account, connectWallet, disconnectWallet, isLoading: blockchainLoading, error } = blockchainContext || {};
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: '',
    password: '',
    rememberMe: false
  });

  const [walletLogin, setWalletLogin] = useState<WalletLogin>({
    isConnected: false,
    walletAddress: ''
  });

  const [otpData, setOtpData] = useState<OTPData>({
    email: '',
    emailOTP: '',
    emailVerified: false
  });

  const [loginMethod, setLoginMethod] = useState<'email' | 'wallet'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);

  const [otpTimer, setOtpTimer] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [userRole, setUserRole] = useState<'donor' | 'creator' | null>(null);
  const [showRoleBanner, setShowRoleBanner] = useState(false);

  // OTP Timer
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);



  const handleInputChange = (field: keyof LoginForm, value: string | boolean) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
  };

  const handleOTPChange = (field: keyof OTPData, value: string | boolean) => {
    setOtpData(prev => ({ ...prev, [field]: value }));
  };

  const handleConnectWallet = async () => {
    setIsLoading(true);
    try {
      console.log('Attempting to connect wallet...');
      await connectWallet();
      console.log('Connect wallet called, checking account:', account);
      if (account) {
        console.log('Account found, updating wallet login state');
        setWalletLogin({
          isConnected: true,
          walletAddress: account
        });
        setLoginMethod('wallet');
      } else {
        console.log('No account found after connection attempt');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowOTPModal(true);
      setOtpTimer(60);
    } catch (error) {
      console.error('Error sending OTP:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setOtpData(prev => ({ ...prev, emailVerified: true }));
      setShowOTPModal(false);
      setOtpData(prev => ({ ...prev, emailOTP: '' }));
      // Simulate successful login
      setUserRole('donor');
      setShowRoleBanner(true);
    } catch (error) {
      console.error('Error verifying OTP:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Simulate successful login
      setUserRole('creator');
      setShowRoleBanner(true);
    } catch (error) {
      console.error('Error logging in:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    setIsLoading(true);
    try {
      console.log('Wallet login started. Current state:', { isConnected, account });
      
      // If not connected, connect first
      if (!isConnected) {
        console.log('Wallet not connected, attempting to connect...');
        await handleConnectWallet();
        // Wait a bit for the connection to be established
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('After connection attempt:', { isConnected, account });
      }

      // Check if connection was successful by checking the context again
      if (blockchainContext?.isConnected && blockchainContext?.account) {
        console.log('Wallet connected successfully, checking user in database...');
        
        // Check if user exists in database
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: blockchainContext.account
          }),
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok) {
          console.log('User found in database:', loginData.user);
          setUserRole(loginData.user.role);
          setShowRoleBanner(true);
          // Redirect to home page after successful wallet login
            window.location.href = '/'; // Wait 1.5 seconds to show the success banner before redirecting
        } else {
          console.log('User not found in database, redirecting to signup...');
          alert('Account not found. Please sign up first.');
          router.push('/signup');
        }
      } else {
        console.log('Wallet connection failed. Context state:', blockchainContext);
        throw new Error('Wallet connection failed. Please try again.');
      }
    } catch (error) {
      console.error('Error logging in with wallet:', error);
      alert(error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      alert('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Password reset link has been sent to your email');
      setShowForgotPassword(false);
      setForgotEmail('');
    } catch (error) {
      console.error('Error sending reset email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state if blockchain context is not ready
  if (!blockchainContext) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blockchain connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-teal-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-2 border-purple-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <Link href="/" className="text-4xl font-bold flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-purple-600 rounded-full flex items-center justify-center mr-3 shadow-lg">
                <ShieldCheckIcon className="h-7 w-7 text-white" />
              </div>
              <span className="text-purple-700">Clear</span>
              <span className="text-teal-600">Fund</span>
            </Link>
            <Link href="/signup" className="text-gray-800 hover:text-purple-700 font-semibold text-lg px-6 py-3 bg-gradient-to-r from-purple-50 to-teal-50 rounded-lg border-2 border-purple-200 hover:border-purple-400 transition-all duration-300">
              Don't have an account? Sign up
            </Link>
          </div>
        </div>
      </div>

      {/* Role Banner */}
      {showRoleBanner && userRole && (
        <div className="bg-green-50 border border-green-200 rounded-lg mx-4 mt-4 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800 text-sm">
                <strong>Successfully signed in as:</strong> {userRole === 'donor' ? 'Donor / Funder' : 'Campaign Creator'}
              </p>
            </div>
            <button
              onClick={() => setShowRoleBanner(false)}
              className="text-green-600 hover:text-green-800"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Blockchain Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg mx-4 mt-4 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800 text-sm">
                <strong>Blockchain Error:</strong> {error}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-red-600 hover:text-red-800"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Trust Indicators */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl p-6 mb-10 shadow-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-blue-900 text-lg font-semibold">
                <strong>Secure Login:</strong> All transactions are protected by Ethereum smart contracts and blockchain transparency.
              </p>
              <p className="text-blue-700 text-sm mt-1">Your account is secured with blockchain-level protection</p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 border-2 border-purple-100">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-700 to-teal-600 bg-clip-text text-transparent mb-4">Welcome Back</h1>
            <p className="text-xl text-gray-600">Sign in to your ClearFund account</p>
          </div>

          {/* Login Method Tabs */}
          <div className="flex mb-8 bg-gray-100 rounded-xl p-2 shadow-inner">
            <button
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-4 px-6 rounded-lg text-lg font-semibold transition-all duration-300 ${
                loginMethod === 'email'
                  ? 'bg-white text-purple-600 shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <UserIcon className="h-5 w-5 inline mr-3" />
              Email & Password
            </button>
            <button
              onClick={() => setLoginMethod('wallet')}
              className={`flex-1 py-4 px-6 rounded-lg text-lg font-semibold transition-all duration-300 ${
                loginMethod === 'wallet'
                  ? 'bg-white text-purple-600 shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <WalletIcon className="h-5 w-5 inline mr-3" />
              Wallet Login
            </button>
          </div>

          {/* Email & Password Login */}
          {loginMethod === 'email' && (
            <div className="space-y-8">
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300 shadow-sm hover:shadow-md"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-6 py-4 text-lg pr-14 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300 shadow-sm hover:shadow-md"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    {showPassword ? <EyeSlashIcon className="h-6 w-6" /> : <EyeIcon className="h-6 w-6" />}
                  </button>
                </div>
              </div>



              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={loginForm.rememberMe}
                    onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <button
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  Forgot password?
                </button>
              </div>

              <button
                onClick={handleEmailLogin}
                disabled={isLoading || !loginForm.email || !loginForm.password}
                className="w-full bg-gradient-to-r from-purple-600 to-teal-600 text-white py-4 rounded-xl text-lg font-semibold hover:from-purple-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
                {!isLoading && <ArrowRightIcon className="h-5 w-5 ml-3" />}
              </button>
            </div>
          )}

          {/* Wallet Login */}
          {loginMethod === 'wallet' && (
            <div className="space-y-6">
              {!isConnected ? (
                <div className="text-center py-8">
                  <WalletIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
                  <p className="text-gray-600 mb-6">
                    Connect your Ethereum wallet to sign in securely
                  </p>
                  <button
                    onClick={handleConnectWallet}
                    disabled={isLoading || blockchainLoading}
                    className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center mx-auto"
                  >
                    <WalletIcon className="h-5 w-5 mr-2" />
                    {isLoading || blockchainLoading ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                  <p className="text-sm text-gray-500 mt-4">
                    Supports MetaMask, WalletConnect, Coinbase Wallet, and more
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                      <h3 className="text-sm font-semibold text-green-800">Wallet Connected</h3>
                    </div>
                    <p className="text-sm text-green-700 font-mono break-all">
                      {account}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <p className="text-blue-800 text-sm">
                        <strong>Multi-Factor Authentication:</strong> You may be prompted to verify your identity.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleWalletLogin}
                    disabled={isLoading}
                    className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? 'Signing in...' : 'Sign In with Wallet'}
                    {!isLoading && <ArrowRightIcon className="h-4 w-4 ml-2" />}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>
          </div>

          {/* Alternative Login Options */}
          <div className="space-y-4">
            <button
              onClick={() => sendOTP()}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              Sign in with Email OTP
            </button>

          </div>

          {/* Security Note */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <LockClosedIcon className="h-5 w-5 text-gray-600 mr-2" />
              <p className="text-gray-700 text-sm">
                <strong>Security:</strong> Your login is protected by blockchain-level security and encryption.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mb-4"
              placeholder="Enter your email address"
            />

            <div className="flex space-x-3">
              <button
                onClick={handleForgotPassword}
                disabled={isLoading || !forgotEmail}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Verify Email
              </h3>
              <button
                onClick={() => setShowOTPModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Enter the verification code sent to your email
            </p>

            <input
              type="text"
              value={otpData.emailOTP}
              onChange={(e) => handleOTPChange('emailOTP', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mb-4"
              placeholder="Enter 6-digit code"
              maxLength={6}
            />

            <div className="flex space-x-3">
              <button
                onClick={verifyOTP}
                disabled={isLoading || !otpData.emailOTP}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button
                onClick={() => sendOTP()}
                disabled={otpTimer > 0 || isLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {otpTimer > 0 ? `${otpTimer}s` : 'Resend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
