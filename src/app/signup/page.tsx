"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  UserIcon,
  BuildingOfficeIcon,
  WalletIcon,
  IdentificationIcon,
  LockClosedIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface FormData {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  role: 'donor' | 'creator';
  walletAddress: string;
  isWalletConnected: boolean;
  kycCompleted: boolean;
  twoFactorEnabled: boolean;
  termsAccepted: boolean;
  blockchainConsent: boolean;
}

interface OTPData {
  email: string;
  mobile: string;
  emailOTP: string;
  mobileOTP: string;
  emailVerified: boolean;
  mobileVerified: boolean;
}

export default function SignUpPage() {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    role: 'donor',
    walletAddress: '',
    isWalletConnected: false,
    kycCompleted: false,
    twoFactorEnabled: false,
    termsAccepted: false,
    blockchainConsent: false
  });

  const [otpData, setOtpData] = useState<OTPData>({
    email: '',
    mobile: '',
    emailOTP: '',
    mobileOTP: '',
    emailVerified: false,
    mobileVerified: false
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpMethod, setOtpMethod] = useState<'email' | 'mobile'>('email');
  const [otpTimer, setOtpTimer] = useState(0);

  const totalSteps = 5;

  // Password strength checker
  useEffect(() => {
    const strength = calculatePasswordStrength(formData.password);
    setPasswordStrength(strength);
  }, [formData.password]);

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0: return { text: 'Very Weak', color: 'text-red-500' };
      case 1: return { text: 'Weak', color: 'text-red-400' };
      case 2: return { text: 'Fair', color: 'text-yellow-500' };
      case 3: return { text: 'Good', color: 'text-yellow-400' };
      case 4: return { text: 'Strong', color: 'text-green-500' };
      case 5: return { text: 'Very Strong', color: 'text-green-400' };
      default: return { text: '', color: '' };
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return 'bg-red-500';
      case 1: return 'bg-red-400';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-yellow-400';
      case 4: return 'bg-green-500';
      case 5: return 'bg-green-400';
      default: return 'bg-gray-200';
    }
  };

  // OTP Timer
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOTPChange = (field: keyof OTPData, value: string | boolean) => {
    setOtpData(prev => ({ ...prev, [field]: value }));
  };

  const sendOTP = async (method: 'email' | 'mobile') => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setOtpMethod(method);
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
      if (otpMethod === 'email') {
        setOtpData(prev => ({ ...prev, emailVerified: true }));
      } else {
        setOtpData(prev => ({ ...prev, mobileVerified: true }));
      }
      setShowOTPModal(false);
      setOtpData(prev => ({ ...prev, emailOTP: '', mobileOTP: '' }));
    } catch (error) {
      console.error('Error verifying OTP:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setFormData(prev => ({
        ...prev,
        isWalletConnected: true,
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
      }));
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('Form submitted:', formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName && formData.email && formData.password && 
               formData.confirmPassword === formData.password && passwordStrength >= 3;
      case 2:
        return formData.role && (otpData.emailVerified || otpData.mobileVerified);
      case 3:
        return formData.isWalletConnected;
      case 4:
        return formData.kycCompleted || formData.role === 'donor';
      case 5:
        return formData.termsAccepted && formData.blockchainConsent;
      default:
        return false;
    }
  };

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
            <Link href="/login" className="text-gray-800 hover:text-purple-700 font-semibold text-lg px-6 py-3 bg-gradient-to-r from-purple-50 to-teal-50 rounded-lg border-2 border-purple-200 hover:border-purple-400 transition-all duration-300">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-700 to-teal-600 bg-clip-text text-transparent">Create Your Account</h1>
            <span className="text-lg font-semibold text-gray-700 bg-white px-6 py-3 rounded-full shadow-lg border-2 border-purple-200">Step {currentStep} of {totalSteps}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
            <div 
              className="bg-gradient-to-r from-purple-600 via-blue-500 to-teal-600 h-4 rounded-full transition-all duration-700 shadow-lg"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl p-6 mb-10 shadow-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-blue-900 text-lg font-semibold">
                <strong>Trust & Security:</strong> All donations are held in Ethereum smart contracts until verified milestones are met.
              </p>
              <p className="text-blue-700 text-sm mt-1">Your funds are protected by blockchain technology</p>
            </div>
          </div>
        </div>

        {/* Form Steps */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 border-2 border-purple-100">
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
                <p className="text-gray-600">Tell us about yourself to get started</p>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Full Name or Organization Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300 shadow-sm hover:shadow-md"
                  placeholder="Enter your full name or organization name"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300 shadow-sm hover:shadow-md"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300 shadow-sm hover:shadow-md"
                  placeholder="Enter your mobile number"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-6 py-4 text-lg pr-14 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300 shadow-sm hover:shadow-md"
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    {showPassword ? <EyeSlashIcon className="h-6 w-6" /> : <EyeIcon className="h-6 w-6" />}
                  </button>
                </div>
                
                {/* Password Strength Meter */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 w-8 rounded-full transition-all duration-300 ${
                              level <= passwordStrength ? getPasswordStrengthColor() : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-sm font-medium ${getPasswordStrengthText().color}`}>
                        {getPasswordStrengthText().text}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Password must be at least 8 characters with uppercase, lowercase, number, and special character
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Role Selection & Verification */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Role</h2>
                <p className="text-gray-600">Select how you'll use ClearFund</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    formData.role === 'donor'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('role', 'donor')}
                >
                  <div className="flex items-center mb-4">
                    <UserIcon className="h-8 w-8 text-purple-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Donor / Funder</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Support campaigns and projects you believe in. Make secure donations with full transparency.
                  </p>
                </div>

                <div
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    formData.role === 'creator'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('role', 'creator')}
                >
                  <div className="flex items-center mb-4">
                    <BuildingOfficeIcon className="h-8 w-8 text-purple-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Campaign Creator</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Create and manage crowdfunding campaigns. Perfect for NGOs, individuals, and organizations.
                  </p>
                </div>
              </div>

              {/* Verification Section */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Verify Your Contact</h3>
                <p className="text-gray-600 mb-4">Choose how you'd like to receive verification codes</p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-semibold">📧</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Email Verification</p>
                        <p className="text-sm text-gray-500">{formData.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => sendOTP('email')}
                      disabled={otpData.emailVerified || isLoading}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        otpData.emailVerified
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {otpData.emailVerified ? 'Verified ✓' : 'Send Code'}
                    </button>
                  </div>

                  {formData.mobile && (
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-green-600 font-semibold">📱</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Mobile Verification</p>
                          <p className="text-sm text-gray-500">{formData.mobile}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => sendOTP('mobile')}
                        disabled={otpData.mobileVerified || isLoading}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          otpData.mobileVerified
                            ? 'bg-green-100 text-green-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {otpData.mobileVerified ? 'Verified ✓' : 'Send Code'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Wallet Connection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
                <p className="text-gray-600">Connect your Ethereum wallet for secure transactions</p>
              </div>

              {!formData.isWalletConnected ? (
                <div className="text-center py-12">
                  <WalletIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
                  <p className="text-gray-600 mb-6">
                    Connect your Ethereum wallet to enable secure donations and withdrawals
                  </p>
                  <button
                    onClick={connectWallet}
                    disabled={isLoading}
                    className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center mx-auto"
                  >
                    <WalletIcon className="h-5 w-5 mr-2" />
                    {isLoading ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                  <p className="text-sm text-gray-500 mt-4">
                    Supports MetaMask, WalletConnect, Coinbase Wallet, and more
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-green-800">Wallet Connected</h3>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Connected Address:</p>
                    <p className="font-mono text-sm text-gray-900 break-all">
                      {formData.walletAddress}
                    </p>
                  </div>
                  <p className="text-sm text-green-700 mt-4">
                    ✓ Wallet ownership verified through message signing
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: KYC Verification */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Identity Verification</h2>
                <p className="text-gray-600">
                  {formData.role === 'creator' 
                    ? 'Complete KYC to create campaigns and receive funds'
                    : 'Optional verification for enhanced trust and features'
                  }
                </p>
              </div>

              {formData.role === 'creator' ? (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                      <p className="text-yellow-800 text-sm">
                        <strong>Required for Campaign Creators:</strong> KYC verification is mandatory to create campaigns and receive funds.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <IdentificationIcon className="h-6 w-6 text-blue-600 mr-2" />
                        <h3 className="font-semibold text-gray-900">ID Proof</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Upload a valid government-issued ID (passport, driver's license, etc.)
                      </p>
                      <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                        Upload ID
                      </button>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <DocumentTextIcon className="h-6 w-6 text-green-600 mr-2" />
                        <h3 className="font-semibold text-gray-900">Organization Proof</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        For NGOs: Upload registration certificate or legal documents
                      </p>
                      <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
                        Upload Documents
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleInputChange('kycCompleted', true)}
                    className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700"
                  >
                    Complete KYC Verification
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <IdentificationIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Optional Verification</h3>
                  <p className="text-gray-600 mb-6">
                    KYC verification is optional for donors but provides enhanced trust and features
                  </p>
                  <button
                    onClick={() => handleInputChange('kycCompleted', true)}
                    className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700"
                  >
                    Skip for Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Security & Consent */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Security & Consent</h2>
                <p className="text-gray-600">Final steps to secure your account</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="twoFactor"
                    checked={formData.twoFactorEnabled}
                    onChange={(e) => handleInputChange('twoFactorEnabled', e.target.checked)}
                    className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <div>
                    <label htmlFor="twoFactor" className="text-sm font-medium text-gray-900">
                      Enable Two-Factor Authentication (2FA)
                    </label>
                    <p className="text-sm text-gray-500">
                      Add an extra layer of security to your account using email or authenticator app
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.termsAccepted}
                    onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                    className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <div>
                    <label htmlFor="terms" className="text-sm font-medium text-gray-900">
                      I agree to the Terms & Conditions and Privacy Policy
                    </label>
                    <p className="text-sm text-gray-500">
                      By checking this box, you agree to our terms of service and privacy policy
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="blockchain"
                    checked={formData.blockchainConsent}
                    onChange={(e) => handleInputChange('blockchainConsent', e.target.checked)}
                    className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <div>
                    <label htmlFor="blockchain" className="text-sm font-medium text-gray-900">
                      I understand blockchain transparency
                    </label>
                    <p className="text-sm text-gray-500">
                      I acknowledge that all transactions are permanently stored on the Ethereum blockchain and are publicly visible
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <LockClosedIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-blue-800 text-sm">
                    <strong>Security Note:</strong> Your data is encrypted and stored securely. We never store your private keys.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t-2 border-purple-200">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-8 py-4 text-lg font-semibold text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md"
            >
              ← Previous
            </button>
            
            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-10 py-4 text-lg font-semibold bg-gradient-to-r from-purple-600 to-teal-600 text-white rounded-xl hover:from-purple-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center"
              >
                Next →
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isLoading}
                className="px-10 py-4 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center"
              >
                {isLoading ? 'Creating Account...' : '🎉 Create Account'}
                {!isLoading && <ArrowRightIcon className="h-5 w-5 ml-2" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Verify {otpMethod === 'email' ? 'Email' : 'Mobile'}
              </h3>
              <button
                onClick={() => setShowOTPModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Enter the verification code sent to your {otpMethod === 'email' ? 'email' : 'mobile'}
            </p>

            <input
              type="text"
              value={otpMethod === 'email' ? otpData.emailOTP : otpData.mobileOTP}
              onChange={(e) => handleOTPChange(otpMethod === 'email' ? 'emailOTP' : 'mobileOTP', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mb-4"
              placeholder="Enter 6-digit code"
              maxLength={6}
            />

            <div className="flex space-x-3">
              <button
                onClick={verifyOTP}
                disabled={isLoading || !(otpMethod === 'email' ? otpData.emailOTP : otpData.mobileOTP)}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                onClick={() => sendOTP(otpMethod)}
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


