import { NextRequest, NextResponse } from 'next/server';
import client from '@/app/api/utils/db';
import { deleteDocumentFromZoho } from '@/lib/uploads/zohoUpload';


export async function DELETE(request: NextRequest) {

    try {
      const { searchParams } = new URL(request.url);
      const documentId = searchParams.get('id');
      const userId = searchParams.get('userId');
  
      if (!documentId || !userId) {
        return NextResponse.json(
          { error: 'Document ID and User ID are required' },
          { status: 400 }
        );
      }
  
      // Get document details first
      const selectQuery = 'SELECT * FROM documents WHERE id = $1 AND user_id = $2';
      const selectResult = await client.query(selectQuery, [documentId, userId]);
      
      if (selectResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Document not found or unauthorized' },
          { status: 404 }
        );
      }
  
      const document = selectResult.rows[0];
  
      // Extract file ID from Zoho URL if needed
      // This depends on your Zoho URL structure
      const fileId = extractFileIdFromUrl(document.file_url);
  
      // Start transaction
      await client.query('BEGIN');
  
      try {
        // Delete from database
        const deleteQuery = 'DELETE FROM documents WHERE id = $1 AND user_id = $2';
        await client.query(deleteQuery, [documentId, userId]);
  
        // Log the deletion
        const logQuery = `
          INSERT INTO activity_logs (
            user_id,
            action,
            resource_type,
            resource_id,
            details,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW());
        `;
  
        await client.query(logQuery, [
          userId,
          'delete',
          'document',
          documentId,
          JSON.stringify({ title: document.title })
        ]);
  
        await client.query('COMMIT');
  
        // Delete from Zoho WorkDrive (async, non-blocking)
        if (fileId) {
          deleteDocumentFromZoho(fileId).catch(err => {
            console.error('Failed to delete from Zoho:', err);
          });
        }
  
        return NextResponse.json(
          { success: true, message: 'Document deleted successfully' },
          { status: 200 }
        );
  
      } catch (dbError) {
        await client.query('ROLLBACK');
        throw dbError;
      }
  
    } catch (error: any) {
      console.error('Delete error:', error);
      
      return NextResponse.json(
        { 
          error: 'Delete failed', 
          details: error.message 
        },
        { status: 500 }
      );
    } finally {
      if (client) {
        client.release();
      }
    }
  }
  
  // Helper function to extract file ID from Zoho URL
  function extractFileIdFromUrl(url: string): string | null {
    // This regex pattern might need adjustment based on actual Zoho URL structure
    const match = url.match(/\/file\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }
  
  