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