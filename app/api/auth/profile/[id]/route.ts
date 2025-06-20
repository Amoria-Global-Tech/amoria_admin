// app/api/auth/profile/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import client from "@/app/api/utils/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params since they're wrapped in a Promise in Next.js 13+
    const { id } = await params;
    const userId = parseInt(id);

    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Fetch user profile from team_members table
    const userResult = await client.query(
      `SELECT 
        id,
        full_name,
        role,
        bio,
        email,
        phone_number,
        photo_url,
        username,
        last_login,
        status,
        created_at,
        updated_at
      FROM team_members 
      WHERE id = $1 AND status = true`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found or account is inactive' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Log profile access activity
    try {
      await client.query(
        `INSERT INTO activity_logs (action, resource_type, resource_id, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          'profile_viewed',
          'user',
          userId,
          JSON.stringify({
            username: user.username,
            timestamp: new Date().toISOString(),
            user_agent: request.headers.get('user-agent') || 'unknown'
          })
        ]
      );
    } catch (logError) {
      console.warn('Failed to log profile view activity:', logError);
    }

    // Return user profile data
    return NextResponse.json({
      success: true,
      message: 'Profile fetched successfully',
      user: {
        id: user.id,
        full_name: user.full_name,
        role: user.role,
        bio: user.bio,
        email: user.email,
        phone_number: user.phone_number,
        photo_url: user.photo_url,
        username: user.username,
        last_login: user.last_login,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    
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