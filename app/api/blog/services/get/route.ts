// api/blog/services/get/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from "@/app/api/utils/db";


// Handle GET request for fetching all services by newest
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Extract query parameters for pagination (optional)
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const activeOnly = searchParams.get('active_only') === 'true';

    // Validate limit and offset
    if (limit < 1 || limit > 100) {
      return NextResponse.json({ error: "Limit must be between 1 and 100" }, { status: 400 });
    }

    if (offset < 0) {
      return NextResponse.json({ error: "Offset must be non-negative" }, { status: 400 });
    }

    // Build the query with optional filters
    let query = `
      SELECT id, name, description, price, category, status, icon, created_at, updated_at
      FROM services
    `;
    
    const queryParams: any[] = [];
    const conditions: string[] = [];

    // Add category filter if provided
    if (category && category !== 'all') {
      conditions.push(`category = $${queryParams.length + 1}`);
      queryParams.push(category);
    }

    // Add status filter if provided
    if (status) {
      conditions.push(`status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }

    // Add active only filter if requested
    if (activeOnly) {
      conditions.push(`status = $${queryParams.length + 1}`);
      queryParams.push('active');
    }

    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Order by newest first and add pagination
    query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    // Execute the query
    const result = await client.query(query, queryParams);

    // Get total count for pagination info
    let countQuery = `SELECT COUNT(*) FROM services`;
    const countParams: any[] = [];
    const countConditions: string[] = [];

    if (category && category !== 'all') {
      countConditions.push(`category = $${countParams.length + 1}`);
      countParams.push(category);
    }

    if (status) {
      countConditions.push(`status = $${countParams.length + 1}`);
      countParams.push(status);
    }

    if (activeOnly) {
      countConditions.push(`status = $${countParams.length + 1}`);
      countParams.push('active');
    }

    if (countConditions.length > 0) {
      countQuery += ` WHERE ${countConditions.join(' AND ')}`;
    }

    const countResult = await client.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    // Transform the data to match frontend expectations
    const services = result.rows.map((row: any) => ({
      id: row.id.toString(),
      title: row.name,
      description: row.description,
      price: row.price,
      category: row.category,
      status: row.status,
      icon: row.icon,
      createdAt: row.created_at.toISOString().split('T')[0],
      updatedAt: row.updated_at
    }));

    return NextResponse.json({
      message: "Services fetched successfully",
      success: true,
      data: services,
      count: services.length,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      filters: {
        category: category || null,
        status: status || null,
        activeOnly
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error during services fetch:", error);
    
    // Handle specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === '42P01') { // Table doesn't exist
        return NextResponse.json(
          { message: "Services table not found", success: false, error: error, data: [] },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { message: "Failed to fetch services", success: false, error: error, data: [] },
      { status: 500 }
    );
  }
}