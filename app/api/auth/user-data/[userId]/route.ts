import { NextRequest, NextResponse } from 'next/server';
import client from "@/app/api/utils/db";

// Combined handler for all HTTP methods on the user-data route
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const userIdNum = parseInt(userId);

    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    // Fetch user profile
    let profile, notifications, security, loginActivities;
    
    try {
      const userResult = await client.query(
        `SELECT 
          id, full_name, role, bio, email, phone_number, photo_url, username
        FROM team_members 
        WHERE id = $1 AND status = true`,
        [userIdNum]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, message: 'User not found or account is inactive' },
          { status: 404 }
        );
      }
      profile = userResult.rows[0];
    } catch (e) {
      console.error('Error fetching user profile:', e);
      return NextResponse.json({ success: false, message: 'Failed to fetch user profile data' }, { status: 500 });
    }

    // Fetch user notification settings
    try {
      const notificationResult = await client.query(
        `SELECT 
          email_notifications, sms_notifications, new_booking_alerts, 
          new_listing_alerts, new_user_alerts, new_host_alerts, 
          new_field_agent_alerts
        FROM notification_settings 
        WHERE user_id = $1`,
        [userIdNum]
      );
      notifications = notificationResult.rows[0] || {}; 
    } catch (e) {
      console.error('Error fetching notifications:', e);
      // Return 500 but still send other data if possible
      notifications = {}; 
    }
    
    // Fetch user security settings
    try {
      const securityResult = await client.query(
        `SELECT 
          two_factor_enabled, login_alerts_enabled
        FROM security_settings 
        WHERE user_id = $1`,
        [userIdNum]
      );
      security = securityResult.rows[0] || {};
    } catch (e) {
      console.error('Error fetching security settings:', e);
      security = {};
    }
    
    // Fetch recent login activities
    try {
      const loginActivitiesResult = await client.query(
        `SELECT id, device_info, ip_address, location, login_time
        FROM login_activities 
        WHERE user_id = $1 ORDER BY login_time DESC LIMIT 10`,
        [userIdNum]
      );
      loginActivities = loginActivitiesResult.rows || [];
    } catch (e) {
      console.error('Error fetching login activities:', e);
      loginActivities = [];
    }

    // Return all user data
    return NextResponse.json({
      success: true,
      user: {
        profile,
        notifications,
        security,
        loginActivities
      }
    });

  } catch (error) {
    console.error('API GET handler error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const userIdNum = parseInt(userId);

    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const updateData = await request.json();
    const { full_name, username, email, phone_number, bio, photo_url, password } = updateData;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (full_name !== undefined) {
      updates.push(`full_name = $${paramCount++}`);
      values.push(full_name);
    }
    if (username !== undefined) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (phone_number !== undefined) {
      updates.push(`phone_number = $${paramCount++}`);
      values.push(phone_number);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(bio);
    }
    if (photo_url !== undefined) {
      updates.push(`photo_url = $${paramCount++}`);
      values.push(photo_url);
    }
    if (password !== undefined) {
        updates.push(`password = $${paramCount++}`);
        values.push(password);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No data provided to update' },
        { status: 400 }
      );
    }

    values.push(userIdNum);
    const queryText = `UPDATE team_members SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;
    const result = await client.query(queryText, values);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('API PUT handler error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const userIdNum = parseInt(userId);

    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    const settingsData = await request.json();

    // Handle security settings update
    const securityKeys = ['two_factor_enabled', 'login_alerts_enabled'];
    const securityUpdates: string[] = [];
    const securityValues = [];
    let securityParamCount = 1;
    
    for (const key of securityKeys) {
        if (settingsData.hasOwnProperty(key)) {
            securityUpdates.push(`${key} = $${securityParamCount++}`);
            securityValues.push(settingsData[key]);
        }
    }

    if (securityUpdates.length > 0) {
      securityValues.push(userIdNum);
      const securityQuery = `UPDATE security_settings SET ${securityUpdates.join(', ')} WHERE user_id = $${securityParamCount}`;
      await client.query(securityQuery, securityValues);
      return NextResponse.json({ success: true, message: 'Security settings updated successfully!' });
    }
    
    // Handle notification settings update
    const notificationKeys = [
      'email_notifications', 'sms_notifications', 'new_booking_alerts',
      'new_listing_alerts', 'new_user_alerts', 'new_host_alerts',
      'new_field_agent_alerts'
    ];
    const notificationUpdates: string[] = [];
    const notificationValues = [];
    let notificationParamCount = 1;

    for (const key of notificationKeys) {
      if (settingsData.hasOwnProperty(key)) {
        notificationUpdates.push(`${key} = $${notificationParamCount++}`);
        notificationValues.push(settingsData[key]);
      }
    }
    
    if (notificationUpdates.length > 0) {
      notificationValues.push(userIdNum);
      const notificationQuery = `UPDATE notification_settings SET ${notificationUpdates.join(', ')} WHERE user_id = $${notificationParamCount}`;
      await client.query(notificationQuery, notificationValues);
      return NextResponse.json({ success: true, message: 'Notification settings updated successfully!' });
    }
    
    // If no valid keys were found
    return NextResponse.json({
      success: false,
      message: 'No valid setting to update was found in the request.'
    }, { status: 400 });

  } catch (error) {
    console.error('API POST handler error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update settings' }, { status: 500 });
  }
}
