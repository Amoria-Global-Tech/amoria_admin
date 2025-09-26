// app/api/auth/send-otp/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { sendOTPEmail } from '../../utils/brevo';

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

    // Use administrator as the default user
    const adminUser = {
      email: email,
      full_name: 'Administrator',
      username: 'admin'
    };

    // Send OTP email using Brevo
    try {
      await sendOTPEmail(adminUser.email, adminUser.full_name, otp, false);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return NextResponse.json(
        { success: false, message: 'Failed to send OTP email. Please try again.' },
        { status: 500 }
      );
    }

    // Create masked email for frontend display
    const emailParts = adminUser.email.split('@');
    const maskedEmail = emailParts[0].length > 2 
      ? emailParts[0].substring(0, 2) + '***@' + emailParts[1]
      : '***@' + emailParts[1];

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      maskedEmail: maskedEmail,
      email: adminUser.email,
      expirationMinutes: 2 // OTP expires in 2 minutes
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}