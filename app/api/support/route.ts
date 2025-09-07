// app/api/support/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from "@/app/api/utils/db";
import { sendCustomReply } from "../utils/brevo";

interface SupportMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: "new" | "replied" | "closed";
  createdAt: string;
  repliedAt?: string;
  adminReply?: string;
}

// GET method to fetch all support messages
export async function GET(req: NextRequest) {
  try {
    console.log('Support API GET called');
    
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sort') || 'newest';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

    console.log('Query params:', { status, search, sortBy, limit, offset });

    // Test database connection first
    try {
      const testQuery = await client.query('SELECT NOW() as current_time');
      console.log('Database connected:', testQuery.rows[0].current_time);
    } catch (dbError: any) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json({
        success: false,
        message: "Database connection failed",
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
        status: 500,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Check if table exists and has data
    try {
      const tableTest = await client.query('SELECT COUNT(*) as count FROM contact_us LIMIT 1');
      console.log('Table check passed, total records:', tableTest.rows[0]?.count || 0);
    } catch (tableError: any) {
      console.error('Table access failed:', tableError);
      return NextResponse.json({
        success: false,
        message: "Database table access failed",
        error: process.env.NODE_ENV === 'development' ? tableError.message : undefined,
        status: 500,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Build query - using only existing columns
    let query = `
      SELECT 
        id,
        name,
        email,
        phone_number as phone,
        message,
        CASE 
          WHEN admin_reply IS NOT NULL THEN 'replied'
          WHEN is_resolved = true THEN 'closed'
          ELSE 'new'
        END as status,
        created_at as "createdAt",
        replied_at as "repliedAt",
        admin_reply as "adminReply"
      FROM contact_us
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // Apply status filter
    if (status && status !== 'all') {
      if (status === 'new') {
        query += ` AND is_resolved = false AND admin_reply IS NULL`;
      } else if (status === 'replied') {
        query += ` AND admin_reply IS NOT NULL AND is_resolved = false`;
      } else if (status === 'closed') {
        query += ` AND is_resolved = true`;
      }
    }

    // Apply search filter
    if (search) {
      query += ` AND (
        name ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex} OR 
        message ILIKE $${paramIndex} OR
        id::text ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Apply sorting
    if (sortBy === 'newest') {
      query += ` ORDER BY created_at DESC`;
    } else if (sortBy === 'oldest') {
      query += ` ORDER BY created_at ASC`;
    }

    // Apply pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    console.log('Final query:', query);
    console.log('Query params:', queryParams);

    // Execute query
    const result = await client.query(query, queryParams);
    console.log('Query result count:', result.rows.length);

    // Get total count with same filters
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM contact_us 
      WHERE 1=1
    `;
    
    const countParams: any[] = [];
    let countParamIndex = 1;

    // Apply same filters for count
    if (status && status !== 'all') {
      if (status === 'new') {
        countQuery += ` AND is_resolved = false AND admin_reply IS NULL`;
      } else if (status === 'replied') {
        countQuery += ` AND admin_reply IS NOT NULL AND is_resolved = false`;
      } else if (status === 'closed') {
        countQuery += ` AND is_resolved = true`;
      }
    }

    if (search) {
      countQuery += ` AND (
        name ILIKE $${countParamIndex} OR 
        email ILIKE $${countParamIndex} OR 
        message ILIKE $${countParamIndex} OR
        id::text ILIKE $${countParamIndex}
      )`;
      countParams.push(`%${search}%`);
    }

    const countResult = await client.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Get statistics for dashboard
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_resolved = false AND admin_reply IS NULL THEN 1 END) as new,
        COUNT(CASE WHEN admin_reply IS NOT NULL AND is_resolved = false THEN 1 END) as replied,
        COUNT(CASE WHEN is_resolved = true THEN 1 END) as closed
      FROM contact_us
    `;
    
    const statsResult = await client.query(statsQuery);
    const stats = statsResult.rows[0];

    // Format the response
    const messages: SupportMessage[] = result.rows.map((row: any) => ({
      id: row.id.toString(),
      name: row.name,
      email: row.email,
      phone: row.phone,
      message: row.message,
      status: row.status,
      createdAt: row.createdAt,
      repliedAt: row.repliedAt,
      adminReply: row.adminReply
    }));

    console.log('Returning response with', messages.length, 'messages');

    return NextResponse.json({
      success: true,
      data: messages,
      stats: {
        total: parseInt(stats.total),
        new: parseInt(stats.new),
        replied: parseInt(stats.replied),
        closed: parseInt(stats.closed)
      },
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
        currentPage: Math.floor(offset / limit) + 1
      },
      message: `Found ${messages.length} support tickets`,
      status: 200,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Error fetching support messages:", error);
    
    return NextResponse.json({
      success: false,
      message: "Failed to fetch support messages",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      status: 500,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// PATCH method to update support message status
export async function PATCH(req: NextRequest) {
  try {
    console.log('Support API PATCH called');
    
    const body = await req.json();
    const { messageId, status, adminReply } = body;

    console.log('PATCH data:', { messageId, status, adminReply });

    if (!messageId) {
      return NextResponse.json({
        success: false,
        message: "Message ID is required",
        status: 400,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    let updateQuery = `
      UPDATE contact_us 
      SET updated_at = NOW()
    `;
    const updateParams: any[] = [];
    let paramIndex = 1;

    // Update status
    if (status) {
      if (status === 'replied' && adminReply) {
        updateQuery += `, admin_reply = $${paramIndex}, replied_at = NOW(), is_resolved = false`;
        updateParams.push(adminReply);
        paramIndex++;
      } else if (status === 'closed') {
        updateQuery += `, is_resolved = true`;
      } else if (status === 'new') {
        updateQuery += `, is_resolved = false, admin_reply = NULL, replied_at = NULL`;
      }
    }

    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
    updateParams.push(messageId);

    console.log('Update query:', updateQuery);
    console.log('Update params:', updateParams);

    const result = await client.query(updateQuery, updateParams);

    if (result.rows.length === 0) {
      console.log('Support ticket not found:', messageId);
      return NextResponse.json({
        success: false,
        message: "Support ticket not found",
        status: 404,
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    console.log('Support ticket updated successfully');

    return NextResponse.json({
      success: true,
      message: "Support ticket updated successfully",
      data: result.rows[0],
      status: 200,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Error updating support message:", error);
    
    return NextResponse.json({
      success: false,
      message: "Failed to update support ticket",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      status: 500,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST method to send reply to support ticket
export async function POST(req: NextRequest) {
  try {
    console.log('Support API POST called');
    
    const body = await req.json();
    const { messageId, to, subject, message, adminId } = body;

    console.log('POST data:', { messageId, to, subject, messageLength: message?.length, adminId });

    if (!messageId || !to || !subject || !message) {
      return NextResponse.json({
        success: false,
        message: "Missing required fields: messageId, to, subject, message",
        status: 400,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Update the support ticket with reply
    const updateQuery = `
      UPDATE contact_us 
      SET 
        admin_reply = $1,
        replied_at = NOW(),
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    console.log('Reply update query params:', [message.substring(0, 50) + '...', messageId]);

    const result = await client.query(updateQuery, [message, messageId]);

    if (result.rows.length === 0) {
      console.log('Support ticket not found for reply:', messageId);
      return NextResponse.json({
        success: false,
        message: "Support ticket not found",
        status: 404,
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    // Send email reply using Brevo
    try {
      console.log('Sending email via Brevo...');
      await sendCustomReply(to, result.rows[0].name, subject, message);
      console.log('Email sent successfully');
    } catch (emailError: any) {
      console.error("Error sending email:", emailError);
      // Don't fail the request if email fails, just log it
    }

    console.log('Support reply processed successfully');

    return NextResponse.json({
      success: true,
      message: "Support reply sent successfully",
      data: result.rows[0],
      status: 200,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Error sending support reply:", error);
    
    return NextResponse.json({
      success: false,
      message: "Failed to send support reply",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      status: 500,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// DELETE method to delete support ticket (optional)
export async function DELETE(req: NextRequest) {
  try {
    console.log('Support API DELETE called');
    
    const url = new URL(req.url);
    const messageId = url.searchParams.get('messageId');

    console.log('DELETE messageId:', messageId);

    if (!messageId) {
      return NextResponse.json({
        success: false,
        message: "Message ID is required",
        status: 400,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const deleteQuery = `DELETE FROM contact_us WHERE id = $1 RETURNING *`;
    const result = await client.query(deleteQuery, [messageId]);

    if (result.rows.length === 0) {
      console.log('Support ticket not found for deletion:', messageId);
      return NextResponse.json({
        success: false,
        message: "Support ticket not found",
        status: 404,
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    console.log('Support ticket deleted successfully');

    return NextResponse.json({
      success: true,
      message: "Support ticket deleted successfully",
      data: result.rows[0],
      status: 200,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Error deleting support ticket:", error);
    
    return NextResponse.json({
      success: false,
      message: "Failed to delete support ticket",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      status: 500,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}