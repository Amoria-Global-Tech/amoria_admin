// app/api/blog/products/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from "@/app/api/utils/db";
import uploadDocumentToZoho from "@/lib/uploads/zohoUpload";

// Define types for the Product request
type ProductRequest = {
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
  image: File;
};

type ProductUpdateRequest = {
  id: number;
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  is_available?: boolean;
  image?: File;
};

// Handle POST request for adding a Product
export async function POST(req: NextRequest): Promise<NextResponse> {
  const formData = await req.formData();
  
  const productData: ProductRequest = {
    name: formData.get('name')?.toString() || '',
    description: formData.get('description')?.toString() || '',
    price: parseFloat(formData.get('price')?.toString() || '0'),
    category: formData.get('category')?.toString() || '',
    is_available: formData.get('is_available') === 'true',
    image: formData.get('image') as File,
  };

  // Validate required fields
  if (!productData.name || !productData.image) {
    return NextResponse.json({ error: "Name and image are required" }, { status: 400 });
  }

  // Validate price
  if (isNaN(productData.price) || productData.price < 0) {
    return NextResponse.json({ error: "Invalid price value" }, { status: 400 });
  }

  // Validate file type (for images)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(productData.image.type)) {
    return NextResponse.json({ error: "Invalid file type. Only images are allowed." }, { status: 400 });
  }

  // Validate file size (e.g., 10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (productData.image.size > maxSize) {
    return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
  }

  try {
    // Upload the image to Zoho WorkDrive
    const imageUrl = await uploadDocumentToZoho(productData.image, `product_${productData.name}_${Date.now()}`);
    
    // Insert product into the database
    console.log("Image Url: ", imageUrl)
    let result: any;
    if(imageUrl ) {
        result = await client.query(
        `INSERT INTO products (name, description, price, category, is_available, image_url, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
        [
          productData.name,
          productData.description || null,
          productData.price,
          productData.category || null,
          productData.is_available,
          imageUrl
        ]
      );
    } else {
      return NextResponse.json(
        { message: "Failed to return file public link" },
        { status: 400 }
      );
    }

    const productId = result.rows[0].id;

    // Optional: Log the activity (without transaction complexity)
    try {
      await client.query(
        `INSERT INTO activity_logs (action, resource_type, resource_id, details, created_at)
        VALUES ($1, $2, $3, $4, NOW())`,
        [
          'create',
          'product',
          productId,
          JSON.stringify({
            name: productData.name,
            category: productData.category,
            price: productData.price,
            image_type: productData.image.type,
            image_size: productData.image.size
          })
        ]
      );
    } catch (logError) {
      console.warn('Failed to log activity:', logError);
    }

    return NextResponse.json({ 
      message: "Product added successfully", 
      product: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        description: result.rows[0].description,
        price: result.rows[0].price,
        category: result.rows[0].category,
        isAvailable: result.rows[0].is_available,
        imageUrl: result.rows[0].image_url,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Error during product addition:", error);
    
    // Handle specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { message: "Product with this name already exists", error: error },
          { status: 409 }
        );
      }
    }

    // Handle upload errors
    if (error && typeof error === 'object' && 'message' in error && 
        typeof error.message === 'string' && error.message.includes('Upload failed')) {
      return NextResponse.json(
        { message: "File upload failed", error: error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Product addition failed", error: error },
      { status: 500 }
    );
  }
}

// Handle PATCH request for updating a Product (partial update)
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    
    const productData: ProductUpdateRequest = {
      id: parseInt(formData.get('id')?.toString() || '0'),
      name: formData.get('name')?.toString(),
      description: formData.get('description')?.toString(),
      price: formData.get('price') ? parseFloat(formData.get('price')?.toString() || '0') : undefined,
      category: formData.get('category')?.toString(),
      is_available: formData.get('is_available') ? formData.get('is_available') === 'true' : undefined,
      image: formData.get('image') as File | undefined,
    };

    // Validate product ID
    if (!productData.id || isNaN(productData.id)) {
      return NextResponse.json({ error: "Valid product ID is required" }, { status: 400 });
    }

    // Check if product exists
    const existingProduct = await client.query(
      'SELECT * FROM products WHERE id = $1',
      [productData.id]
    );

    if (existingProduct.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let imageUrl: string | undefined;

    // Handle image upload if new image provided
    if (productData.image && productData.image.size > 0) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(productData.image.type)) {
        return NextResponse.json({ error: "Invalid file type. Only images are allowed." }, { status: 400 });
      }

      // Validate file size
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (productData.image.size > maxSize) {
        return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
      }

      // Upload new image
      imageUrl = await uploadDocumentToZoho(productData.image, `product_${productData.name || existingProduct.rows[0].name}_${Date.now()}`);
      
      if (!imageUrl) {
        return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (productData.name !== undefined && productData.name.trim()) {
      updateFields.push(`name = $${paramCount}`);
      updateValues.push(productData.name.trim());
      paramCount++;
    }

    if (productData.description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      updateValues.push(productData.description || null);
      paramCount++;
    }

    if (productData.price !== undefined && !isNaN(productData.price) && productData.price >= 0) {
      updateFields.push(`price = $${paramCount}`);
      updateValues.push(productData.price);
      paramCount++;
    }

    if (productData.category !== undefined) {
      updateFields.push(`category = $${paramCount}`);
      updateValues.push(productData.category || null);
      paramCount++;
    }

    if (productData.is_available !== undefined) {
      updateFields.push(`is_available = $${paramCount}`);
      updateValues.push(productData.is_available);
      paramCount++;
    }

    if (imageUrl) {
      updateFields.push(`image_url = $${paramCount}`);
      updateValues.push(imageUrl);
      paramCount++;
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = NOW()`);

    if (updateFields.length === 1) { // Only updated_at field
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Add product ID as last parameter
    updateValues.push(productData.id);

    // Execute update query
    const result = await client.query(
      `UPDATE products SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      updateValues
    );

    // Log the activity
    try {
      await client.query(
        `INSERT INTO activity_logs (action, resource_type, resource_id, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          'update',
          'product',
          productData.id,
          JSON.stringify({
            updatedFields: Object.keys(productData).filter(key => key !== 'id' && productData[key as keyof ProductUpdateRequest] !== undefined),
            hasNewImage: !!imageUrl,
            timestamp: new Date().toISOString()
          })
        ]
      );
    } catch (logError) {
      console.warn('Failed to log activity:', logError);
    }

    return NextResponse.json({ 
      message: "Product updated successfully", 
      product: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        description: result.rows[0].description,
        price: result.rows[0].price,
        category: result.rows[0].category,
        isAvailable: result.rows[0].is_available,
        imageUrl: result.rows[0].image_url,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error during product update:", error);
    
    // Handle specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { message: "Product with this name already exists", error: error },
          { status: 409 }
        );
      }
      
      if (error.code === '42P01') { // Table doesn't exist
        return NextResponse.json(
          { message: "Products table not found. Please ensure the database is properly set up.", error: error },
          { status: 500 }
        );
      }
    }

    // Handle upload errors
    if (error && typeof error === 'object' && 'message' in error && 
        typeof error.message === 'string' && error.message.includes('Upload failed')) {
      return NextResponse.json(
        { message: "File upload failed", error: error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Product update failed", error: error },
      { status: 500 }
    );
  }
}

// Handle PUT request for full product update
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    
    const productData: ProductUpdateRequest = {
      id: parseInt(formData.get('id')?.toString() || '0'),
      name: formData.get('name')?.toString(),
      description: formData.get('description')?.toString(),
      price: parseFloat(formData.get('price')?.toString() || '0'),
      category: formData.get('category')?.toString(),
      is_available: formData.get('is_available') === 'true',
      image: formData.get('image') as File | undefined,
    };

    // Validate product ID
    if (!productData.id || isNaN(productData.id)) {
      return NextResponse.json({ error: "Valid product ID is required" }, { status: 400 });
    }

    // Validate required fields for full update
    if (!productData.name?.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    if (isNaN(productData.price!) || productData.price! < 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }

    // Check if product exists
    const existingProduct = await client.query(
      'SELECT * FROM products WHERE id = $1',
      [productData.id]
    );

    if (existingProduct.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let imageUrl = existingProduct.rows[0].image_url; // Keep existing image by default

    // Handle image upload if new image provided
    if (productData.image && productData.image.size > 0) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(productData.image.type)) {
        return NextResponse.json({ error: "Invalid file type. Only images are allowed." }, { status: 400 });
      }

      // Validate file size
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (productData.image.size > maxSize) {
        return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
      }

      // Upload new image
      const newImageUrl = await uploadDocumentToZoho(productData.image, `product_${productData.name}_${Date.now()}`);
      
      if (!newImageUrl) {
        return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
      }
      
      imageUrl = newImageUrl;
    }

    // Full update
    const result = await client.query(
      `UPDATE products SET 
        name = $1, 
        description = $2, 
        price = $3, 
        category = $4, 
        is_available = $5, 
        image_url = $6, 
        updated_at = NOW() 
       WHERE id = $7 RETURNING *`,
      [
        productData.name.trim(),
        productData.description || null,
        productData.price,
        productData.category || null,
        productData.is_available,
        imageUrl,
        productData.id
      ]
    );

    // Log the activity
    try {
      await client.query(
        `INSERT INTO activity_logs (action, resource_type, resource_id, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          'full_update',
          'product',
          productData.id,
          JSON.stringify({
            name: productData.name,
            category: productData.category,
            price: productData.price,
            hasNewImage: !!(productData.image && productData.image.size > 0),
            timestamp: new Date().toISOString()
          })
        ]
      );
    } catch (logError) {
      console.warn('Failed to log activity:', logError);
    }

    return NextResponse.json({ 
      message: "Product updated successfully", 
      product: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        description: result.rows[0].description,
        price: result.rows[0].price,
        category: result.rows[0].category,
        isAvailable: result.rows[0].is_available,
        imageUrl: result.rows[0].image_url,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error during product full update:", error);
    
    // Handle specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { message: "Product with this name already exists", error: error },
          { status: 409 }
        );
      }
      
      if (error.code === '42P01') { // Table doesn't exist
        return NextResponse.json(
          { message: "Products table not found. Please ensure the database is properly set up.", error: error },
          { status: 500 }
        );
      }
    }

    // Handle upload errors
    if (error && typeof error === 'object' && 'message' in error && 
        typeof error.message === 'string' && error.message.includes('Upload failed')) {
      return NextResponse.json(
        { message: "File upload failed", error: error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Product update failed", error: error },
      { status: 500 }
    );
  }
}
// Handle DELETE request for deleting a Product
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    // Get product ID from request body
    const body = await req.json().catch(() => ({}));
    const id = body.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: "Valid product ID is required" }, { status: 400 });
    }

    // Check if product exists and get details for logging
    const existingProduct = await client.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (existingProduct.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const productDetails = existingProduct.rows[0];

    // Delete the product
    await client.query(
      'DELETE FROM products WHERE id = $1',
      [id]
    );

    // Log the activity
    try {
      await client.query(
        `INSERT INTO activity_logs (action, resource_type, resource_id, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          'delete',
          'product',
          id,
          JSON.stringify({
            deletedProduct: {
              name: productDetails.name,
              category: productDetails.category,
              price: productDetails.price,
              imageUrl: productDetails.image_url
            },
            timestamp: new Date().toISOString()
          })
        ]
      );
    } catch (logError) {
      console.warn('Failed to log activity:', logError);
    }

    return NextResponse.json({ 
      message: "Product deleted successfully",
      deletedProduct: {
        id: productDetails.id,
        name: productDetails.name,
        category: productDetails.category,
        imageUrl: productDetails.image_url
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error during product deletion:", error);
    
    // Handle specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === '42P01') { // Table doesn't exist
        return NextResponse.json(
          { message: "Products table not found. Please ensure the database is properly set up.", error: error },
          { status: 500 }
        );
      }
      
      if (error.code === '23503') { // Foreign key constraint violation
        return NextResponse.json(
          { message: "Cannot delete product. It may be referenced by other records.", error: error },
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
      { message: "Product deletion failed", error: error },
      { status: 500 }
    );
  }
}