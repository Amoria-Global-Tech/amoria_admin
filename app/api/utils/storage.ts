// storage.ts - Image upload utility for product images

export interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload an image file to Supabase storage and return the secure URL
 * @param file - The image file to upload
 * @param folder - The folder to upload to (defaults to 'products')
 * @returns Promise with upload response containing the secure URL
 */
export async function uploadImageToSupabase(
  file: File, 
  folder: string = 'products'
): Promise<UploadResponse> {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
      };
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size too large. Maximum size is 5MB.'
      };
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    // Generate unique filename
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
    const uniqueFileName = `${timestamp}-${safeFileName}`;
    formData.append('fileName', uniqueFileName);

    // Upload to Supabase via API route
    const response = await fetch('/api/storage', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.url) {
        return {
          success: true,
          url: result.url
        };
      } else {
        return {
          success: false,
          error: result.error || 'Upload failed'
        };
      }
    } else {
      const errorResult = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: errorResult.error || 'Failed to upload image to server'
      };
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
}

/**
 * Upload a product image with specific naming convention
 * @param file - The image file to upload
 * @param productName - The product name for generating filename
 * @returns Promise with upload response containing the secure URL
 */
export async function uploadProductImage(
  file: File, 
  productName: string
): Promise<UploadResponse> {
  try {
    // Create a safe filename based on product name
    const safeProductName = productName
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .toLowerCase();
    
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `product-${safeProductName}-${timestamp}.${fileExtension}`;

    // Create FormData with custom filename
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'products');
    formData.append('fileName', fileName);

    // Upload to Supabase via API route
    const response = await fetch('/api/storage', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.url) {
        return {
          success: true,
          url: result.url
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to upload product image'
        };
      }
    } else {
      const errorResult = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: errorResult.error || 'Failed to upload image to server'
      };
    }
  } catch (error) {
    console.error('Error uploading product image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
}

/**
 * Delete an image from Supabase storage
 * @param imageUrl - The full URL of the image to delete
 * @returns Promise indicating success or failure
 */
export async function deleteImageFromSupabase(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch('/api/storage', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageUrl })
    });

    if (response.ok) {
      const result = await response.json();
      return result.success || false;
    }
    return false;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}