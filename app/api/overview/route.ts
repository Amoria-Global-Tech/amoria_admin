import { NextRequest, NextResponse } from 'next/server';
import client from "@/app/api/utils/db";

export async function GET(req: NextRequest) {

  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 1000);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);
    const country = url.searchParams.get('country');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const analytics = url.searchParams.get('analytics') === 'true';

    // Base query for visitor data
    let query = `
      SELECT id, ip_address, country, city, region, timezone,
             page_url, referrer, created_at, user_agent
      FROM visitor_tracking WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (country) {
      query += ` AND country ILIKE $${paramIndex}`;
      queryParams.push(`%${country}%`);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND DATE(created_at) >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND DATE(created_at) <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await client.query(query, queryParams);

    // Get total count with same filters
    let countQuery = `SELECT COUNT(*) as total FROM visitor_tracking WHERE 1=1`;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (country) {
      countQuery += ` AND country ILIKE $${countParamIndex}`;
      countParams.push(`%${country}%`);
      countParamIndex++;
    }

    if (startDate) {
      countQuery += ` AND DATE(created_at) >= $${countParamIndex}`;
      countParams.push(startDate);
      countParamIndex++;
    }

    if (endDate) {
      countQuery += ` AND DATE(created_at) <= $${countParamIndex}`;
      countParams.push(endDate);
      countParamIndex++;
    }

    const countResult = await client.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // If analytics requested, add aggregated data
    let analyticsData = null;
    if (analytics) {
      try {
        // Daily visitor counts
        const dailyQuery = `
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count,
            COUNT(DISTINCT ip_address) as unique_visitors
          FROM visitor_tracking 
          WHERE 1=1
          ${startDate ? `AND created_at >= $1::date` : ''}
          ${endDate ? `AND created_at <= $${startDate ? '2' : '1'}::date + INTERVAL '23 hours 59 minutes 59 seconds'` : ''}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 30
        `;
        
        const dailyParams: any[] = [];
        if (startDate) dailyParams.push(startDate);
        if (endDate) dailyParams.push(endDate);
        
        const dailyResult = await client.query(dailyQuery, dailyParams);

        // Top countries
        const countryQuery = `
          SELECT 
            country,
            COUNT(*) as count
          FROM visitor_tracking 
          WHERE country IS NOT NULL AND country != ''
          ${startDate ? `AND created_at >= $1::date` : ''}
          ${endDate ? `AND created_at <= $${startDate ? '2' : '1'}::date + INTERVAL '23 hours 59 minutes 59 seconds'` : ''}
          GROUP BY country
          ORDER BY count DESC
          LIMIT 10
        `;
        
        const countryResult = await client.query(countryQuery, dailyParams);

        // Top pages
        const pageQuery = `
          SELECT 
            page_url,
            COUNT(*) as count
          FROM visitor_tracking 
          WHERE page_url IS NOT NULL
          ${startDate ? `AND created_at >= $1::date` : ''}
          ${endDate ? `AND created_at <= $${startDate ? '2' : '1'}::date + INTERVAL '23 hours 59 minutes 59 seconds'` : ''}
          GROUP BY page_url
          ORDER BY count DESC
          LIMIT 10
        `;
        
        const pageResult = await client.query(pageQuery, dailyParams);

        // Unique visitors count
        const uniqueQuery = `
          SELECT COUNT(DISTINCT ip_address) as unique_count
          FROM visitor_tracking 
          WHERE 1=1
          ${startDate ? `AND created_at >= $1::date` : ''}
          ${endDate ? `AND created_at <= $${startDate ? '2' : '1'}::date + INTERVAL '23 hours 59 minutes 59 seconds'` : ''}
        `;
        
        const uniqueResult = await client.query(uniqueQuery, dailyParams);

        // Browser stats
        const browserQuery = `
          SELECT 
            CASE 
              WHEN user_agent ILIKE '%chrome%' THEN 'Chrome'
              WHEN user_agent ILIKE '%firefox%' THEN 'Firefox'
              WHEN user_agent ILIKE '%safari%' AND user_agent NOT ILIKE '%chrome%' THEN 'Safari'
              WHEN user_agent ILIKE '%edge%' THEN 'Edge'
              ELSE 'Other'
            END as browser,
            COUNT(*) as count
          FROM visitor_tracking 
          WHERE user_agent IS NOT NULL
          ${startDate ? `AND created_at >= $1::date` : ''}
          ${endDate ? `AND created_at <= $${startDate ? '2' : '1'}::date + INTERVAL '23 hours 59 minutes 59 seconds'` : ''}
          GROUP BY browser
          ORDER BY count DESC
        `;
        
        const browserResult = await client.query(browserQuery, dailyParams);

        analyticsData = {
          daily_stats: dailyResult.rows,
          top_countries: countryResult.rows,
          top_pages: pageResult.rows,
          unique_visitors: parseInt(uniqueResult.rows[0]?.unique_count || '0'),
          browser_stats: browserResult.rows,
          date_range: {
            start: startDate,
            end: endDate
          }
        };
      } catch (analyticsError) {
        console.error('Error generating analytics:', analyticsError);
        // Continue without analytics if it fails
      }
    }

    const response: any = {
      success: true,
      data: result.rows,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    };

    if (analyticsData) {
      response.analytics = analyticsData;
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error fetching visitor data:', error);
    return NextResponse.json({
      success: false,
      message: "Internal server error while fetching data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}