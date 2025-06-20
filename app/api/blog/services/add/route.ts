// api/blog/service/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from "@/app/api/utils/db";

// Define types for the Service request
type ServiceRequest = {
  title: string;
  description: string;
  features: string;
  price: string;
  category: string;
  status: "active" | "inactive" | "pending";
  icon: string;
};

type ServiceUpdateRequest = Partial<ServiceRequest> & {
  id: number;
};

// Handle POST request for adding a Service
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const serviceData: ServiceRequest = await req.json();

    // Validate required fields
    if (!serviceData.title?.trim()) {
      return NextResponse.json({ error: "Service title is required" }, { status: 400 });
    }

    if (!serviceData.description?.trim()) {
      return NextResponse.json({ error: "Service description is required" }, { status: 400 });
    }

    if (!serviceData.price?.trim()) {
      return NextResponse.json({ error: "Service price is required" }, { status: 400 });
    }

    // Validate status
    const validStatuses = ["active", "inactive", "pending"];
    if (!validStatuses.includes(serviceData.status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    // Validate category
    const validCategories = ["Development", "Marketing", "Design", "Consulting", "Support"];
    if (!validCategories.includes(serviceData.category)) {
      return NextResponse.json({ error: "Invalid category value" }, { status: 400 });
    }

    // Insert service into the database
    const result = await client.query(
      `INSERT INTO services (name, description, features, price, category, status, icon, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
      [
        serviceData.title.trim(),
        serviceData.description.trim(),
        serviceData.features.trim(),
        serviceData.price.trim(),
        serviceData.category,
        serviceData.status,
        serviceData.icon || "bi bi-gear-wide-connected"
      ]
    );

    const serviceId = result.rows[0].id;

    // Optional: Log the activity (without transaction complexity)
    try {
      await client.query(
        `INSERT INTO activity_logs (action, resource_type, resource_id, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          'create',
          'service',
          serviceId,
          JSON.stringify({
            title: serviceData.title,
            category: serviceData.category,
            status: serviceData.status,
            price: serviceData.price
          })
        ]
      );
    } catch (logError) {
      console.warn('Failed to log activity:', logError);
    }

    return NextResponse.json({ 
      message: "Service added successfully", 
      service: {
        id: result.rows[0].id,
        title: result.rows[0].name,
        description: result.rows[0].description,
        features: result.rows[0].features,
        price: result.rows[0].price,
        category: result.rows[0].category,
        status: result.rows[0].status,
        icon: result.rows[0].icon,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Error during service addition:", error);
    
    // Handle specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { message: "Service with this title already exists", error: error },
          { status: 409 }
        );
      }
      
      if (error.code === '42P01') { // Table doesn't exist
        return NextResponse.json(
          { message: "Services table not found. Please ensure the database is properly set up.", error: error },
          { status: 500 }
        );
      }
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON format", error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Service addition failed", error: error },
      { status: 500 }
    );
  }
}

// Handle PATCH/PUT request for updating a Service
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const serviceData: ServiceUpdateRequest = await req.json();

    // Validate service ID
    if (!serviceData.id) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
    }

    // Check if service exists
    const existingService = await client.query(
      'SELECT id FROM services WHERE id = $1',
      [serviceData.id]
    );

    if (existingService.rows.length === 0) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (serviceData.title?.trim()) {
      updateFields.push(`name = $${paramCount}`);
      updateValues.push(serviceData.title.trim());
      paramCount++;
    }

    if (serviceData.description?.trim()) {
      updateFields.push(`description = $${paramCount}`);
      updateValues.push(serviceData.description.trim());
      paramCount++;
    }

    if (serviceData.features?.trim()) {
      updateFields.push(`features = $${paramCount}`);
      updateValues.push(serviceData.features.trim());
      paramCount++;
    }

    if (serviceData.price?.trim()) {
      updateFields.push(`price = $${paramCount}`);
      updateValues.push(serviceData.price.trim());
      paramCount++;
    }

    if (serviceData.category) {
      const validCategories = ["Development", "Marketing", "Design", "Consulting", "Support"];
      if (!validCategories.includes(serviceData.category)) {
        return NextResponse.json({ error: "Invalid category value" }, { status: 400 });
      }
      updateFields.push(`category = $${paramCount}`);
      updateValues.push(serviceData.category);
      paramCount++;
    }

    if (serviceData.status) {
      const validStatuses = ["active", "inactive", "pending"];
      if (!validStatuses.includes(serviceData.status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      updateFields.push(`status = $${paramCount}`);
      updateValues.push(serviceData.status);
      paramCount++;
    }

    if (serviceData.icon) {
      updateFields.push(`icon = $${paramCount}`);
      updateValues.push(serviceData.icon);
      paramCount++;
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = NOW()`);

    if (updateFields.length === 1) { // Only updated_at field
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Add service ID as last parameter
    updateValues.push(serviceData.id);

    // Execute update query
    const result = await client.query(
      `UPDATE services SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      updateValues
    );

    // Log the activity
    try {
      await client.query(
        `INSERT INTO activity_logs (action, resource_type, resource_id, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          'update',
          'service',
          serviceData.id,
          JSON.stringify({
            updatedFields: Object.keys(serviceData).filter(key => key !== 'id'),
            timestamp: new Date().toISOString()
          })
        ]
      );
    } catch (logError) {
      console.warn('Failed to log activity:', logError);
    }

    return NextResponse.json({ 
      message: "Service updated successfully", 
      service: {
        id: result.rows[0].id,
        title: result.rows[0].name,
        description: result.rows[0].description,
        features: result.rows[0].features,
        price: result.rows[0].price,
        category: result.rows[0].category,
        status: result.rows[0].status,
        icon: result.rows[0].icon,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error during service update:", error);
    
    // Handle specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { message: "Service with this title already exists", error: error },
          { status: 409 }
        );
      }
      
      if (error.code === '42P01') { // Table doesn't exist
        return NextResponse.json(
          { message: "Services table not found. Please ensure the database is properly set up.", error: error },
          { status: 500 }
        );
      }
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON format", error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Service update failed", error: error },
      { status: 500 }
    );
  }
}

// Handle PUT request (full update) - same as PATCH but requires all fields
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const serviceData: ServiceUpdateRequest = await req.json();

    // Validate service ID
    if (!serviceData.id) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
    }

    // Validate all required fields for full update
    if (!serviceData.title?.trim()) {
      return NextResponse.json({ error: "Service title is required" }, { status: 400 });
    }

    if (!serviceData.description?.trim()) {
      return NextResponse.json({ error: "Service description is required" }, { status: 400 });
    }

    if (!serviceData.features?.trim()) {
      return NextResponse.json({ error: "Service features is required" }, { status: 400 });
    }

    if (!serviceData.price?.trim()) {
      return NextResponse.json({ error: "Service price is required" }, { status: 400 });
    }

    // Validate status
    const validStatuses = ["active", "inactive", "pending"];
    if (!validStatuses.includes(serviceData.status!)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    // Validate category
    const validCategories = ["Development", "Marketing", "Design", "Consulting", "Support"];
    if (!validCategories.includes(serviceData.category!)) {
      return NextResponse.json({ error: "Invalid category value" }, { status: 400 });
    }

    // Check if service exists
    const existingService = await client.query(
      'SELECT id FROM services WHERE id = $1',
      [serviceData.id]
    );

    if (existingService.rows.length === 0) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Full update
    const result = await client.query(
      `UPDATE services SET 
        name = $1, 
        description = $2, 
        features = $3, 
        price = $4, 
        category = $5, 
        status = $6, 
        icon = $7, 
        updated_at = NOW() 
       WHERE id = $8 RETURNING *`,
      [
        serviceData.title.trim(),
        serviceData.description.trim(),
        serviceData.features.trim(),
        serviceData.price.trim(),
        serviceData.category,
        serviceData.status,
        serviceData.icon || "bi bi-gear-wide-connected",
        serviceData.id
      ]
    );

    // Log the activity
    try {
      await client.query(
        `INSERT INTO activity_logs (action, resource_type, resource_id, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          'full_update',
          'service',
          serviceData.id,
          JSON.stringify({
            title: serviceData.title,
            category: serviceData.category,
            status: serviceData.status,
            price: serviceData.price,
            timestamp: new Date().toISOString()
          })
        ]
      );
    } catch (logError) {
      console.warn('Failed to log activity:', logError);
    }

    return NextResponse.json({ 
      message: "Service updated successfully", 
      service: {
        id: result.rows[0].id,
        title: result.rows[0].name,
        description: result.rows[0].description,
        features: result.rows[0].features,
        price: result.rows[0].price,
        category: result.rows[0].category,
        status: result.rows[0].status,
        icon: result.rows[0].icon,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error during service full update:", error);
    
    // Handle specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { message: "Service with this title already exists", error: error },
          { status: 409 }
        );
      }
      
      if (error.code === '42P01') { // Table doesn't exist
        return NextResponse.json(
          { message: "Services table not found. Please ensure the database is properly set up.", error: error },
          { status: 500 }
        );
      }
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON format", error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Service update failed", error: error },
      { status: 500 }
    );
  }
}
// Handle DELETE request for deleting a Service
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    // Get service ID from request body
    const body = await req.json().catch(() => ({}));
    const id = body.id;

    if (!id) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
    }

    // Check if service exists and get details for logging
    const existingService = await client.query(
      'SELECT * FROM services WHERE id = $1',
      [id]
    );

    if (existingService.rows.length === 0) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const serviceDetails = existingService.rows[0];

    // Delete the service
    await client.query(
      'DELETE FROM services WHERE id = $1',
      [id]
    );

    // Log the activity
    try {
      await client.query(
        `INSERT INTO activity_logs (action, resource_type, resource_id, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          'delete',
          'service',
          id,
          JSON.stringify({
            deletedService: {
              title: serviceDetails.name,
              category: serviceDetails.category,
              status: serviceDetails.status,
              price: serviceDetails.price
            },
            timestamp: new Date().toISOString()
          })
        ]
      );
    } catch (logError) {
      console.warn('Failed to log activity:', logError);
    }

    return NextResponse.json({ 
      message: "Service deleted successfully",
      deletedService: {
        id: serviceDetails.id,
        title: serviceDetails.name,
        category: serviceDetails.category
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error during service deletion:", error);
    
    // Handle specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === '42P01') { // Table doesn't exist
        return NextResponse.json(
          { message: "Services table not found. Please ensure the database is properly set up.", error: error },
          { status: 500 }
        );
      }
      
      if (error.code === '23503') { // Foreign key constraint violation
        return NextResponse.json(
          { message: "Cannot delete service. It may be referenced by other records.", error: error },
          { status: 409 }
        );
      }
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON format", error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Service deletion failed", error: error },
      { status: 500 }
    );
  }
}