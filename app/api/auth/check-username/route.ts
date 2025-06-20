// app/api/auth/check-username/route.ts

import { NextRequest, NextResponse } from 'next/server';
import client from "@/app/api/utils/db";
import { sendOTPEmail } from '../../utils/brevo';


// Function to mask email
function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  const maskedUsername = username.length > 2 
    ? username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1)
    : username.charAt(0) + '*';
  return `${maskedUsername}@${domain}`;
}

export async function POST(request: NextRequest) {
  try {
    const { username, otp } = await request.json();

    if (!username) {
      return NextResponse.json(
        { success: false, message: 'Username is required' },
        { status: 400 }
      );
    }

    if (!otp) {
      return NextResponse.json(
        { success: false, message: 'OTP is required' },
        { status: 400 }
      );
    }

    // Find user by username in team_members table
    const userResult = await client.query(
      'SELECT id, username, email, full_name FROM team_members WHERE username = $1 AND status = true',
      [username.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Username not found or account is inactive' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Send OTP email using Brevo
    try {
      await sendOTPEmail(user.email, user.full_name || user.username, otp, false);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return NextResponse.json(
        { success: false, message: 'Failed to send OTP email. Please try again.' },
        { status: 500 }
      );
    }

    // Log the activity in services table (reusing existing structure)
    try {
      await client.query(
        `INSERT INTO activity_logs (action, resource_type, resource_id, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          'otp_requested',
          'auth',
          user.id,
          JSON.stringify({
            username: user.username,
            email: maskEmail(user.email),
            timestamp: new Date().toISOString()
          })
        ]
      );
    } catch (logError) {
      console.warn('Failed to log OTP request activity:', logError);
      // Continue execution even if logging fails
    }

    // Return masked email and actual email (for localStorage)
    return NextResponse.json({
      success: true,
      maskedEmail: maskEmail(user.email),
      email: user.email,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('Username check error:', error);
    
    // Handle specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === '42P01') {
        return NextResponse.json(
          { success: false, message: 'Database tables not found. Please contact support.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}