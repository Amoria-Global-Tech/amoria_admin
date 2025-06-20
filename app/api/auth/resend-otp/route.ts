// app/api/auth/resend-otp/route.ts

import { NextRequest, NextResponse } from 'next/server';
import client from "@/app/api/utils/db";
import { sendOTPEmail } from '../../utils/brevo';

export async function POST(request: NextRequest) {
  try {
    const { username, otp, email } = await request.json();

    if (!username || !otp) {
      return NextResponse.json(
        { success: false, message: 'Username and OTP are required' },
        { status: 400 }
      );
    }

    // Check rate limiting - max 3 resends per 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    try {
      const resendCount = await client.query(
        `SELECT COUNT(*) as count FROM activity_logs 
         WHERE action = 'otp_resent' 
         AND details->>'username' = $1 
         AND created_at > $2`,
        [username.toLowerCase(), fifteenMinutesAgo]
      );

      if (parseInt(resendCount.rows[0].count) >= 3) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Too many resend attempts. Please wait 15 minutes before trying again.' 
          },
          { status: 429 }
        );
      }
    } catch (rateError) {
      console.warn('Rate limiting check failed, continuing:', rateError);
      // Continue execution if rate limiting check fails
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
      await sendOTPEmail(user.email, user.full_name || user.username, otp, true);
    } catch (emailError) {
      console.error('Failed to resend OTP email:', emailError);
      return NextResponse.json(
        { success: false, message: 'Failed to resend OTP email. Please try again.' },
        { status: 500 }
      );
    }

    // Log the resend activity
    try {
      await client.query(
        `INSERT INTO activity_logs (action, resource_type, resource_id, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          'otp_resent',
          'auth',
          user.id,
          JSON.stringify({
            username: user.username,
            email: user.email.split('@')[0] + '***@' + user.email.split('@')[1],
            timestamp: new Date().toISOString()
          })
        ]
      );
    } catch (logError) {
      console.warn('Failed to log OTP resend activity:', logError);
    }

    // Calculate remaining attempts (if rate limiting worked)
    let attemptsRemaining = 2; // Default safe value
    try {
      const resendCount = await client.query(
        `SELECT COUNT(*) as count FROM activity_logs 
         WHERE action = 'otp_resent' 
         AND details->>'username' = $1 
         AND created_at > $2`,
        [username.toLowerCase(), fifteenMinutesAgo]
      );
      const attemptsUsed = parseInt(resendCount.rows[0].count);
      attemptsRemaining = 3 - attemptsUsed;
    } catch (countError) {
      console.warn('Failed to calculate remaining attempts:', countError);
    }

    return NextResponse.json({
      success: true,
      message: 'OTP resent successfully',
      attemptsRemaining: Math.max(0, attemptsRemaining)
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    
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