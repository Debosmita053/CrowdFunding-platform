import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MilestoneApproval from '@/models/MilestoneApproval';
import Campaign from '@/models/Campaign';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get pending approvals with campaign and creator details
    const pendingApprovals = await MilestoneApproval.find({ status: 'pending' })
      .populate('campaignId', 'title description goal currentAmount milestones')
      .sort({ createdAt: -1 });

    // Get stats
    const [totalPending, totalApproved, totalRejected, totalAutoVerified] = await Promise.all([
      MilestoneApproval.countDocuments({ status: 'pending' }),
      MilestoneApproval.countDocuments({ status: 'approved' }),
      MilestoneApproval.countDocuments({ status: 'rejected' }),
      MilestoneApproval.countDocuments({ status: 'auto_verified' })
    ]);

    // Calculate average processing time (for approved/rejected)
    const processedApprovals = await MilestoneApproval.find({
      status: { $in: ['approved', 'rejected'] },
      approvedAt: { $exists: true }
    }).select('createdAt approvedAt');

    let averageProcessingTime = 0;
    if (processedApprovals.length > 0) {
      const totalTime = processedApprovals.reduce((sum, approval) => {
        const processingTime = approval.approvedAt.getTime() - approval.createdAt.getTime();
        return sum + processingTime;
      }, 0);
      averageProcessingTime = Math.round(totalTime / processedApprovals.length / (1000 * 60 * 60)); // Convert to hours
    }

    // Format approvals with additional details
    const formattedApprovals = await Promise.all(
      pendingApprovals.map(async (approval) => {
        const campaign = approval.campaignId as any;
        const creator = await User.findOne({ walletAddress: approval.creatorWallet });

        // Get milestone details from campaign
        const milestone = campaign?.milestones?.[approval.milestoneIndex];
        
        return {
          id: approval._id.toString(),
          campaignId: approval.campaignId.toString(),
          campaignTitle: campaign?.title || 'Unknown Campaign',
          creatorName: creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown Creator',
          creatorWallet: approval.creatorWallet,
          milestoneIndex: approval.milestoneIndex,
          milestoneTitle: milestone?.title || `Milestone ${approval.milestoneIndex + 1}`,
          milestoneDescription: milestone?.description || `Milestone completion for ${campaign?.title || 'campaign'}`,
          requestedAmount: approval.requestedAmount,
          documents: approval.documents || [],
          status: approval.status,
          requestedAt: approval.createdAt,
          adminNotes: approval.adminNotes,
          campaign: campaign
        };
      })
    );

    return NextResponse.json({
      success: true,
      approvals: formattedApprovals,
      stats: {
        totalPending,
        totalApproved,
        totalRejected,
        totalAutoVerified,
        averageProcessingTime
      }
    });

  } catch (error) {
    console.error('Error fetching approvals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
