// app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from 'next/server';
import client from "@/app/api/utils/db";

export async function POST(request: NextRequest) {
  try {
    const { username, userId } = await request.json();

    // Log the logout activity if user information is provided
    if (username || userId) {
      try {
        // If we have userId, use it directly, otherwise find user by username
        let userIdToLog = userId;
        
        if (!userIdToLog && username) {
          const userResult = await client.query(
            'SELECT id FROM team_members WHERE username = $1',
            [username.toLowerCase()]
          );
          
          if (userResult.rows.length > 0) {
            userIdToLog = userResult.rows[0].id;
          }
        }

        if (userIdToLog) {
          // Log successful logout activity
          await client.query(
            `INSERT INTO activity_logs (action, resource_type, resource_id, details, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [
              'logout_success',
              'auth',
              userIdToLog,
              JSON.stringify({
                username: username || 'unknown',
                logout_method: 'manual',
                timestamp: new Date().toISOString(),
                user_agent: request.headers.get('user-agent') || 'unknown'
              })
            ]
          );
        }
      } catch (logError) {
        console.warn('Failed to log logout activity:', logError);
        // Continue with logout even if logging fails
      }
    }

    // Successful logout response
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if there's an error, we should still return success
    // because the client-side logout (localStorage clearing) is more important
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
      warning: 'Server-side cleanup may have failed'
    });
  }
}

// Handle GET requests (optional - for logout via URL)
export async function GET(request: NextRequest) {
  try {
    // For GET requests, we can't get user info from body
    // Just return success and let client handle localStorage clearing
    
    const response = NextResponse.json({
      success: true,
      message: 'Logout endpoint reached',
      redirect: '/auth'
    });

    // Clear any remaining cookies as a fallback
    response.cookies.set('authenticated', '', {
      expires: new Date(0),
      path: '/'
    });
    
    response.cookies.set('userId', '', {
      expires: new Date(0),
      path: '/'
    });
    
    response.cookies.set('userInfo', '', {
      expires: new Date(0),
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('GET logout error:', error);
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}