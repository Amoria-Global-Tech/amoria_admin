// api/products/get/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from "@/app/api/utils/db";

// Define types for the Product response
type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  is_available: boolean;
  image_url: string;
  created_at: Date;
  updated_at: Date;
};

// Handle GET request for fetching all products by newest
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Extract query parameters for pagination (optional)
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const availableOnly = searchParams.get('available_only') === 'true';

    // Validate limit and offset
    if (limit < 1 || limit > 100) {
      return NextResponse.json({ error: "Limit must be between 1 and 100" }, { status: 400 });
    }

    if (offset < 0) {
      return NextResponse.json({ error: "Offset must be non-negative" }, { status: 400 });
    }

    // Build the query with optional filters
    let query = `
      SELECT id, name, description, price, category, is_available, image_url, created_at, updated_at
      FROM products
    `;
    
    const queryParams: any[] = [];
    const conditions: string[] = [];

    // Add category filter if provided
    if (category) {
      conditions.push(`category = $${queryParams.length + 1}`);
      queryParams.push(category);
    }

    // Add availability filter if requested
    if (availableOnly) {
      conditions.push(`is_available = $${queryParams.length + 1}`);
      queryParams.push(true);
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
    let countQuery = `SELECT COUNT(*) FROM products`;
    const countParams: any[] = [];
    const countConditions: string[] = [];

    if (category) {
      countConditions.push(`category = $${countParams.length + 1}`);
      countParams.push(category);
    }

    if (availableOnly) {
      countConditions.push(`is_available = $${countParams.length + 1}`);
      countParams.push(true);
    }

    if (countConditions.length > 0) {
      countQuery += ` WHERE ${countConditions.join(' AND ')}`;
    }

    const countResult = await client.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    // Transform the data to match frontend expectations
    const products = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      category: row.category,
      isAvailable: row.is_available,
      imageUrl: row.image_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

   
    return NextResponse.json({
      message: "Products fetched successfully",
      products,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      filters: {
        category: category || null,
        availableOnly
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error during products fetch:", error);
    
    // Handle specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === '42P01') { // Table doesn't exist
        return NextResponse.json(
          { message: "Products table not found", error: error },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { message: "Failed to fetch products", error: error },
      { status: 500 }
    );
  }
}