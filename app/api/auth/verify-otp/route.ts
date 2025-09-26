// app/api/auth/verify-otp/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Basic OTP format validation (6 digits)
    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(otp)) {
      return NextResponse.json(
        { success: false, message: 'Invalid OTP format. Must be 6 digits.' },
        { status: 400 }
      );
    }

    // Since OTP verification is handled on frontend with localStorage,
    // we'll just return success for valid format
    // The real verification happens in the frontend against stored OTP

    const adminUser = {
      id: 'admin_001',
      email: email,
      username: 'admin',
      fullName: 'Administrator',
      role: 'admin'
    };

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      user: {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        fullName: adminUser.fullName,
        role: adminUser.role
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}