// api/contact_messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from "@/app/api/utils/db";
import { sendCustomReply } from "../utils/brevo";

interface ContactMessage {
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

// GET method to fetch all contact messages
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sort') || 'newest';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

    // Build query
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
        message ILIKE $${paramIndex}
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

    // Execute query
    const result = await client.query(query, queryParams);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM contact_us 
      WHERE 1=1
    `;
    
    const countParams: any[] = [];
    const countParamIndex = 1;

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
        message ILIKE $${countParamIndex}
      )`;
      countParams.push(`%${search}%`);
    }

    const countResult = await client.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Format the response
    const messages: ContactMessage[] = result.rows.map((row: { id: { toString: () => any; }; name: any; email: any; phone: any; message: any; status: any; createdAt: any; repliedAt: any; adminReply: any; }) => ({
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

    return NextResponse.json({
      success: true,
      data: messages,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
        currentPage: Math.floor(offset / limit) + 1
      }
    });

  } catch (error: any) {
    console.error("Error fetching contact messages:", error);
    
    return NextResponse.json({
      success: false,
      message: "Failed to fetch contact messages",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// PATCH method to update message status
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { messageId, status, adminReply } = body;

    if (!messageId) {
      return NextResponse.json({
        success: false,
        message: "Message ID is required"
      }, { status: 400 });
    }

    let updateQuery = `
      UPDATE contact_us 
      SET updated_at = NOW()
    `;
    const updateParams: any[] = [];
    let paramIndex = 1;

    // Update based on status
    if (status === 'replied' && adminReply) {
      updateQuery += `, admin_reply = $${paramIndex}, replied_at = NOW(), is_resolved = false`;
      updateParams.push(adminReply);
      paramIndex++;
    } else if (status === 'closed') {
      updateQuery += `, is_resolved = true`;
    } else if (status === 'new') {
      updateQuery += `, is_resolved = false, admin_reply = NULL, replied_at = NULL`;
    }

    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
    updateParams.push(messageId);

    const result = await client.query(updateQuery, updateParams);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Message not found"
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Message status updated successfully",
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error("Error updating message status:", error);
    
    return NextResponse.json({
      success: false,
      message: "Failed to update message status",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// POST method to send reply (email functionality)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messageId, to, subject, message } = body;

    if (!messageId || !to || !subject || !message) {
      return NextResponse.json({
        success: false,
        message: "Missing required fields"
      }, { status: 400 });
    }

    // Update the message with reply
    const updateQuery = `
      UPDATE contact_us 
      SET 
        admin_reply = $1,
        replied_at = NOW(),
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await client.query(updateQuery, [message, messageId]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Message not found"
      }, { status: 404 });
    }

    await sendCustomReply(to, result.rows[0].name, subject, message);

    return NextResponse.json({
      success: true,
      message: "Reply sent successfully",
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error("Error sending reply:", error);
    
    return NextResponse.json({
      success: false,
      message: "Failed to send reply",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}