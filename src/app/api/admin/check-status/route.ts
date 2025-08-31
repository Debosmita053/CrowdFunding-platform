import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    console.log('Admin check request for wallet:', walletAddress);

    if (!walletAddress) {
      console.log('No wallet address provided');
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected');

    console.log('Searching for user...');
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('User not found in database');
      return NextResponse.json(
        { isAdmin: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has admin role
    const isAdmin = user.role === 'admin' || user.isAdmin === true;
    console.log('User role:', user.role, 'isAdmin:', user.isAdmin, 'Final isAdmin:', isAdmin);

    return NextResponse.json({
      success: true,
      isAdmin,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
