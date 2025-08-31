import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { walletAddress } = body;

    // Validate required fields
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Find user by wallet address
    const user = await User.findOne({ 
      walletAddress: walletAddress.toLowerCase(),
      isActive: true 
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found or account is inactive' },
        { status: 404 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Return user data
    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role,
      kycCompleted: user.kycCompleted,
      profileImage: user.profileImage,
      lastLogin: user.lastLogin,
    };

    return NextResponse.json(
      { 
        message: 'Login successful',
        user: userResponse 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
