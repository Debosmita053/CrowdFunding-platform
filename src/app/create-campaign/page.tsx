'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  UserIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  FlagIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  PhotoIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useBlockchain } from '../../hooks/useBlockchain';

const steps = [
  { id: 1, name: 'Campaign Details', icon: DocumentTextIcon },
  { id: 2, name: 'KYC/KYB Verification', icon: UserIcon },
  { id: 3, name: 'Milestones', icon: FlagIcon },
  { id: 4, name: 'Review & Submit', icon: CheckCircleIcon }
];

export default function CreateCampaignPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<number | null>(null);
  
  const { 
    isConnected, 
    account, 
    connectWallet, 
    createCampaign, 
    isLoading: blockchainLoading,
    error: blockchainError
  } = useBlockchain();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    goal: '',
    endDate: '',
    image: '',
    longDescription: '',
    creatorName: '',
    creatorEmail: '',
    creatorPhone: '',
    businessName: '',
    businessType: '',
    taxId: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    milestones: [
      { title: '', description: '', amount: '', dueDate: '' }
    ]
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMilestoneChange = (index: number, field: string, value: string) => {
    const newMilestones = [...formData.milestones];
    newMilestones[index] = { ...newMilestones[index], [field]: value };
    setFormData(prev => ({ ...prev, milestones: newMilestones }));
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { title: '', description: '', amount: '', dueDate: '' }]
    }));
  };

  const removeMilestone = (index: number) => {
    if (formData.milestones.length > 1) {
      const newMilestones = formData.milestones.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, milestones: newMilestones }));
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitCampaign = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate duration in days from end date
      const endDate = new Date(formData.endDate);
      const today = new Date();
      const durationInDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      // Prepare milestone data
      const milestoneDescriptions = formData.milestones.map(m => m.description);
      const milestoneAmounts = formData.milestones.map(m => m.amount);
      
      // Create campaign on blockchain
      const receipt = await createCampaign(
        formData.goal,
        durationInDays,
        milestoneDescriptions,
        milestoneAmounts
      );
      
      // Extract campaign ID from events
      if (receipt.events) {
        for (const event of receipt.events) {
          if (event.event === "CampaignCreated") {
            setCampaignId(Number(event.args.campaignId));
            setTransactionHash(receipt.transactionHash);
            break;
          }
        }
      }
      
      // Move to success state
      setCurrentStep(5); // Success step
      
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Campaign Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                placeholder="Enter your campaign title"
              />
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
              >
                <option value="">Select a category</option>
                <option value="Technology">Technology</option>
                <option value="Design">Design</option>
                <option value="Education">Education</option>
                <option value="Arts">Arts</option>
                <option value="Health">Health</option>
                <option value="Community">Community</option>
                <option value="Fashion">Fashion</option>
                <option value="Film & Video">Film & Video</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  Funding Goal (₴) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">₴</span>
                  <input
                    type="number"
                    value={formData.goal}
                    onChange={(e) => handleInputChange('goal', e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                    placeholder="50000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Campaign Image *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-400 transition-colors">
                <PhotoIcon className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                <div className="text-2xl text-gray-600 mb-3">
                  Upload your campaign image
                </div>
                <p className="text-lg text-gray-500">
                  PNG, JPG up to 10MB
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleInputChange('image', e.target.files?.[0]?.name || '')}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="mt-6 inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-blue-700 bg-blue-100 hover:bg-blue-200 cursor-pointer">
                  Choose File
                </label>
              </div>
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Short Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                placeholder="Brief description of your campaign"
              />
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Detailed Description *
              </label>
              <textarea
                value={formData.longDescription}
                onChange={(e) => handleInputChange('longDescription', e.target.value)}
                rows={6}
                className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                placeholder="Tell your story in detail..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <UserIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-blue-800">
                    Identity Verification Required
                  </h3>
                  <div className="mt-3 text-base text-blue-700">
                    <p>To ensure the security and trust of our platform, we require identity verification for all campaign creators.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.creatorName}
                  onChange={(e) => handleInputChange('creatorName', e.target.value)}
                  className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.creatorEmail}
                  onChange={(e) => handleInputChange('creatorEmail', e.target.value)}
                  className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.creatorPhone}
                onChange={(e) => handleInputChange('creatorPhone', e.target.value)}
                className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="border-t pt-8">
              <h4 className="text-2xl font-medium text-gray-900 mb-6 flex items-center">
                <BuildingOfficeIcon className="h-6 w-6 mr-3" />
                Business Information (if applicable)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                    placeholder="Business name"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Business Type
                  </label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                  >
                    <option value="">Select business type</option>
                    <option value="Individual">Individual</option>
                    <option value="LLC">LLC</option>
                    <option value="Corporation">Corporation</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Non-profit">Non-profit</option>
                  </select>
                </div>
              </div>

              <div className="mt-8">
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  Tax ID / EIN
                </label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                  placeholder="Tax ID or EIN"
                />
              </div>

              <div className="mt-8">
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                    placeholder="State"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                    placeholder="ZIP code"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FlagIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-yellow-800">
                    Milestone Planning
                  </h3>
                  <div className="mt-3 text-base text-yellow-700">
                    <p>Define clear milestones to build trust with your backers and track progress transparently.</p>
                  </div>
                </div>
              </div>
            </div>

            {formData.milestones.map((milestone, index) => (
              <div key={index} className="border border-gray-200 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-2xl font-medium text-gray-900">Milestone {index + 1}</h4>
                  {formData.milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMilestone(index)}
                      className="text-red-600 hover:text-red-800 text-base font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-3">
                      Milestone Title *
                    </label>
                    <input
                      type="text"
                      value={milestone.title}
                      onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                      className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                      placeholder="e.g., Prototype Development"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-3">
                      Target Amount (₴) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">₴</span>
                      <input
                        type="number"
                        value={milestone.amount}
                        onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                        placeholder="15000"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Description *
                  </label>
                  <textarea
                    value={milestone.description}
                    onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                    rows={3}
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                    placeholder="Describe what will be accomplished in this milestone..."
                  />
                </div>

                <div className="mt-8">
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={milestone.dueDate}
                    onChange={(e) => handleMilestoneChange(index, 'dueDate', e.target.value)}
                    className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addMilestone}
              className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <FlagIcon className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <span className="text-2xl font-medium text-gray-600">Add Another Milestone</span>
            </button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-green-800">
                    Review Your Campaign
                  </h3>
                  <div className="mt-3 text-base text-green-700">
                    <p>Please review all information before submitting. You can go back to make changes if needed.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h4 className="text-2xl font-medium text-gray-900 mb-6">Campaign Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-base text-gray-500">Title</p>
                  <p className="text-xl font-medium text-gray-900">{formData.title || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-base text-gray-500">Category</p>
                  <p className="text-xl font-medium text-gray-900">{formData.category || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-base text-gray-500">Funding Goal</p>
                  <p className="text-xl font-medium text-gray-900">
                    {formData.goal ? `₴${parseInt(formData.goal).toLocaleString()}` : 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-base text-gray-500">End Date</p>
                  <p className="text-xl font-medium text-gray-900">{formData.endDate || 'Not provided'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h4 className="text-2xl font-medium text-gray-900 mb-6">Creator Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-base text-gray-500">Full Name</p>
                  <p className="text-xl font-medium text-gray-900">{formData.creatorName || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-base text-gray-500">Email</p>
                  <p className="text-xl font-medium text-gray-900">{formData.creatorEmail || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-base text-gray-500">Phone</p>
                  <p className="text-xl font-medium text-gray-900">{formData.creatorPhone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-base text-gray-500">Location</p>
                  <p className="text-xl font-medium text-gray-900">
                    {[formData.city, formData.state, formData.zipCode].filter(Boolean).join(', ') || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h4 className="text-2xl font-medium text-gray-900 mb-6">Milestones ({formData.milestones.length})</h4>
              <div className="space-y-6">
                {formData.milestones.map((milestone, index) => (
                  <div key={index} className="border-l-4 border-blue-200 pl-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="text-xl font-medium text-gray-900">{milestone.title || 'Untitled Milestone'}</h5>
                        <p className="text-base text-gray-600">{milestone.description || 'No description'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-medium text-gray-900">
                          {milestone.amount ? `₴${parseInt(milestone.amount).toLocaleString()}` : 'No amount'}
                        </p>
                        <p className="text-base text-gray-500">{milestone.dueDate || 'No due date'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-yellow-800">
                    Important Notice
                  </h3>
                  <div className="mt-3 text-base text-yellow-700">
                    <p>Your campaign will be reviewed by our team within 2-3 business days. You'll receive an email notification once the review is complete.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center py-12">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Campaign Created Successfully!</h2>
            <p className="text-lg text-gray-600 mb-6">
              Your campaign has been created on the blockchain. It will be reviewed by our team.
            </p>
            {campaignId && (
              <p className="text-md text-gray-700 mb-2">
                Campaign ID: <span className="font-mono">{campaignId}</span>
              </p>
            )}
            {transactionHash && (
              <p className="text-md text-gray-700 mb-6">
                Transaction Hash: <span className="font-mono break-all">{transactionHash}</span>
              </p>
            )}
            <div className="flex justify-center space-x-4">
              <Link 
                href={`/campaigns/${campaignId}`}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                View Campaign
              </Link>
              <Link 
                href="/campaigns"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
              >
                Browse Campaigns
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Link href="/" className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-teal-500">
                  <ShieldCheckIcon className="h-5 w-5 text-white" />
                </span>
                ClearFund
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              {/* Explore Dropdown */}
              <div className="relative group">
                <button className="text-gray-700 hover:text-blue-600 font-medium flex items-center gap-1">
                  Explore
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link href="/campaigns" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                      Browse Campaigns
                    </Link>
                    <Link href="/campaigns" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                      Featured Projects
                    </Link>
                    <Link href="/campaigns" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                      Categories
                    </Link>
                  </div>
                </div>
              </div>

              {/* Events Dropdown */}
              <div className="relative group">
                <button className="text-gray-700 hover:text-blue-600 font-medium flex items-center gap-1">
                  Events
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link href="/events" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                      All Events
                    </Link>
                    <Link href="/events" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                      Upcoming Events
                    </Link>
                    <Link href="/events" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                      Past Events
                    </Link>
                  </div>
                </div>
              </div>

              {/* Pages Dropdown */}
              <div className="relative group">
                <button className="text-gray-700 hover:text-blue-600 font-medium flex items-center gap-1">
                  Pages
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link href="/about" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                      Company Overview
                    </Link>
                    <Link href="/about" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                      Our Team
                    </Link>
                    <Link href="/about" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                      Our Values
                    </Link>
                  </div>
                </div>
              </div>

              {/* News Dropdown */}
              <div className="relative group">
                <button className="text-gray-700 hover:text-blue-600 font-medium flex items-center gap-1">
                  News
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link href="/news" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                      Latest News
                    </Link>
                    <Link href="/news" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                      Industry Updates
                    </Link>
                    <Link href="/news" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                      Success Stories
                    </Link>
                  </div>
                </div>
              </div>

              {/* Contact Dropdown */}
              <div className="relative group">
                <button className="text-gray-700 hover:text-blue-600 font-medium flex items-center gap-1">
                  Contact
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link href="/contact" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                      Contact Us
                    </Link>
                    <Link href="/contact" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                      Get Support
                    </Link>
                    <Link href="/contact" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                      Location
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-700 hover:text-blue-600 font-medium">
                Sign in
              </Link>
              <Link href="/create-campaign" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Create A Project
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Create Your Campaign</h1>
          <p className="text-xl text-gray-600">Follow these steps to launch your crowdfunding project</p>
        </div>

        {/* Wallet Connection Status */}
        {!isConnected && currentStep !== 5 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Wallet Not Connected</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>You need to connect your wallet to create a campaign.</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={connectWallet}
                    disabled={blockchainLoading}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    {blockchainLoading ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {blockchainError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{blockchainError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps - Only show if not on success step */}
        {currentStep !== 5 && (
          <div className="mb-10">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                    currentStep >= step.id 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircleIcon className="h-7 w-7" />
                    ) : (
                      <step.icon className="h-6 w-6" />
                    )}
                  </div>
                  <span className={`ml-3 text-base font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-20 h-0.5 mx-6 ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-10">
          {renderStepContent()}

          {/* Navigation Buttons - Only show if not on success step */}
          {currentStep !== 5 && (
            <div className="flex items-center justify-between mt-10 pt-8 border-t border-gray-200">
              <button
                onClick={prevStep}
                disabled={currentStep === 1 || isSubmitting}
                className={`flex items-center px-8 py-4 rounded-xl font-medium transition-colors ${
                  currentStep === 1 || isSubmitting
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ArrowLeftIcon className="h-5 w-5 mr-3" />
                Previous
              </button>

              <div className="text-base text-gray-500">
                Step {currentStep} of {steps.length}
              </div>

              {currentStep < steps.length ? (
                <button
                  onClick={nextStep}
                  disabled={isSubmitting || !isConnected}
                  className="flex items-center px-8 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRightIcon className="h-5 w-5 ml-3" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitCampaign}
                  disabled={isSubmitting || !isConnected}
                  className="flex items-center px-8 py-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-3" />
                      Submit Campaign
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}