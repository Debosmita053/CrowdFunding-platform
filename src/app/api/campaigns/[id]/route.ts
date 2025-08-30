import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Campaign from '@/models/Campaign';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const campaign = await Campaign.findById(id)
      .populate('creator', 'firstName lastName email profileImage')
      .lean({ virtuals: true });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ campaign });

  } catch (error) {
    console.error('Get campaign error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const body = await request.json();
    const { status, currentAmount, donors } = body;

    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Update campaign fields
    if (status !== undefined) campaign.status = status;
    if (currentAmount !== undefined) campaign.currentAmount = currentAmount;
    if (donors) {
      campaign.donors = donors;
      campaign.totalDonors = donors.length;
    }

    await campaign.save();

    // Populate creator info for response
    await campaign.populate('creator', 'firstName lastName email profileImage');

    return NextResponse.json({
      message: 'Campaign updated successfully',
      campaign
    });

  } catch (error) {
    console.error('Update campaign error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
