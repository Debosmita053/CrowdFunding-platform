import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    // Check if MongoDB URI is properly configured
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI || MONGODB_URI.includes('your_actual_password')) {
      return NextResponse.json(
        { error: 'Database not configured. Please set up your .env.local file with the correct MONGODB_URI. See SETUP.md for instructions.' },
        { status: 500 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { firstName, lastName, email, walletAddress, role = 'donor' } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !walletAddress) {
      return NextResponse.json(
        { error: 'All fields are required. Please ensure you have entered your full name, email, and connected your wallet.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { walletAddress: walletAddress.toLowerCase() }]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or wallet address already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      walletAddress: walletAddress.toLowerCase(),
      role,
    });

    await user.save();

    // Return user data (without sensitive information)
    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role,
      kycCompleted: user.kycCompleted,
      createdAt: user.createdAt,
    };

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: userResponse 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
