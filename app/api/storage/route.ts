// api/storage/route.ts
import { NextRequest, NextResponse } from "next/server";
import uploadDocumentToSupabase, { deleteDocumentFromSupabase } from "@/app/api/utils/supabase";

// Handle POST request for uploading files to Supabase
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';
    const fileName = formData.get('fileName') as string;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File size too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Use provided fileName or generate one
    const finalFileName = fileName || file.name;

    // Upload file to Supabase
    const publicUrl = await uploadDocumentToSupabase(file, finalFileName, folder);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: "File uploaded successfully"
    }, { status: 200 });

  } catch (error) {
    console.error("Error during file upload:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload file",
      message: "File upload failed"
    }, { status: 500 });
  }
}

// Handle DELETE request for removing files from Supabase
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "No image URL provided" },
        { status: 400 }
      );
    }

    // Extract file path from URL
    // Assuming URL format: https://ftihjzudufdjjabnpaqv.supabase.co/storage/v1/object/public/faxon-bucket/folder/filename
    const urlParts = imageUrl.split('/');
    const bucketIndex = urlParts.findIndex((part: string) => part === 'faxon-bucket');
    
    if (bucketIndex === -1 || bucketIndex === urlParts.length - 1) {
      return NextResponse.json(
        { success: false, error: "Invalid image URL format" },
        { status: 400 }
      );
    }

    // Get the file path (everything after the bucket name)
    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    // Delete file from Supabase
    await deleteDocumentFromSupabase(filePath);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully"
    }, { status: 200 });

  } catch (error) {
    console.error("Error during file deletion:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete file",
      message: "File deletion failed"
    }, { status: 500 });
  }
}