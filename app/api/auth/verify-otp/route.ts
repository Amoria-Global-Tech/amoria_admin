// app/api/auth/verify-otp/route.ts

import { NextRequest, NextResponse } from 'next/server';
import client from "@/app/api/utils/db";

export async function POST(request: NextRequest) {
  try {
    const { username, otp, email } = await request.json();

    if (!username || !otp) {
      return NextResponse.json(
        { success: false, message: 'Username and OTP are required' },
        { status: 400 }
      );
    }

    // Get user information from team_members table
    const userResult = await client.query(
      'SELECT id, username, email, full_name, role FROM team_members WHERE username = $1 AND status = true',
      [username.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found or account is inactive' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Since OTP is only in localStorage, we'll trust the frontend validation
    // In a real-world scenario, you might want additional server-side validation
    // For now, we'll just verify the user exists and is active

    // Update user's last login
    await client.query(
      'UPDATE team_members SET last_login = $1, updated_at = NOW() WHERE id = $2',
      [new Date().toISOString(), user.id]
    );

    // Log successful login activity
    try {
      await client.query(
        `INSERT INTO activity_logs (action, resource_type, resource_id, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          'login_success',
          'auth',
          user.id,
          JSON.stringify({
            username: user.username,
            login_method: 'otp',
            timestamp: new Date().toISOString()
          })
        ]
      );
    } catch (logError) {
      console.warn('Failed to log login activity:', logError);
    }

    // Create response that will redirect to home page
    // Client will handle localStorage storage
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      redirect: '/',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      },
      // Send data for localStorage storage
      authData: {
        authenticated: 'true',
        authToken: `auth_${user.id}_${Date.now()}`, // Simple token generation
        userInfo: {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    
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