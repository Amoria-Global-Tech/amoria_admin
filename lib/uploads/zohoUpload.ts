// zohoWorkDriveUpload.ts
import axios from 'axios';

interface ZohoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ZohoUploadResponse {
  data: Array<{
    id: string;
    attributes: {
      Permalink: any;
      resource_id: any;
      name: string;
      type: string;
      created_time: number;
      modified_time: number;
      permalink: string;
      download_url: string;
    };
  }>;
}

interface ZohoPublicLinkResponse {
  data: {
    id: string;
    attributes: {
      link: string;
      link_name: string;
      link_type: string;
      expiry_date: string | null;
      allow_download: boolean;
    };
  };
}

class ZohoWorkDriveClient {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    private clientId: string,
    private clientSecret: string,
    private refreshToken: string,
    private workdriveOrgId: string
  ) {}

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry > now) {
      return this.accessToken;
    }

    // Refresh the token
    const tokenUrl = 'https://accounts.zoho.com/oauth/v2/token';
    const params = new URLSearchParams({
      refresh_token: this.refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'refresh_token'
    });

    try {
      const response = await axios.post<ZohoTokenResponse>(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = now + (response.data.expires_in * 1000) - 60000; // Subtract 1 minute for safety
      
      return this.accessToken;
    } catch (error: any) {
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  async uploadFile(file: File, fileName: string, folderId: string): Promise<{ fileId: string; permalink: string }> {
    const accessToken = await this.getAccessToken();
    
    const uploadUrl = `https://workdrive.zoho.com/api/v1/upload`;
    
    // Create FormData and append the file directly
    const formData = new FormData();
    formData.append('content', file, fileName);
    formData.append('parent_id', folderId);
    formData.append('override-name-exist', 'false');

    try {
      const response = await axios.post<ZohoUploadResponse>(uploadUrl, formData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-ZGWORKDRIVE-ORGID': this.workdriveOrgId,
          // Don't manually set Content-Type - let axios handle it with FormData
        }
      });

      console.log('Upload response:', JSON.stringify(response.data, null, 2)); // Debug log

      if (response.data.data && response.data.data.length > 0) {
        const uploadedFile = response.data.data[0];

        // Handle the actual Zoho response structure
        const fileId = uploadedFile.attributes?.resource_id;
        const permalink = uploadedFile.attributes?.Permalink;
        
        if (!fileId || !permalink) {
          console.error('Missing fileId or permalink in response');
          throw new Error('File uploaded but missing required data in response');
        }
        
        return {
          fileId: fileId,
          permalink: permalink
        };
      }

      throw new Error('No file data in response');
    } catch (error: any) {
      console.error('Upload error details:', error.response?.data || error.message);
      throw new Error(`Upload failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    const accessToken = await this.getAccessToken();
    
    const deleteUrl = `https://workdrive.zoho.com/api/v1/files/${fileId}`;

    try {
      await axios.delete(deleteUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-ZGWORKDRIVE-ORGID': this.workdriveOrgId
        }
      });
      
      console.log('File deleted successfully:', fileId);
    } catch (error: any) {
      console.error('Error deleting file:', error.message);
      throw error;
    }
  }

  async createPublicLink(fileId: string): Promise<string> {
    const accessToken = await this.getAccessToken();
    
    const linkUrl = `https://workdrive.zoho.com/api/v1/files/${fileId}/links`;
    
    const requestBody = {
      link_name: 'Public Link',
      link_type: 'download',
      expiry_date: null, // No expiry
      allow_download: true
    };

    try {
      const response = await axios.post<ZohoPublicLinkResponse>(linkUrl, requestBody, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-ZGWORKDRIVE-ORGID': this.workdriveOrgId,
          'Content-Type': 'application/json'
        }
      });

      console.log('Public link response:', JSON.stringify(response.data, null, 2));

      if (response.data.data && response.data.data.attributes && response.data.data.attributes.link) {
        return response.data.data.attributes.link;
      } else {
        console.error('Unexpected response format:', response.data);
        throw new Error('Failed to retrieve public link from response');
      }
    } catch (error: any) {
      console.error('Error creating public link:', error.response?.data || error.message);
      throw new Error(`Failed to create public link: ${error.message}`);
    }
  }
}

// Initialize Zoho client
const zohoClient = new ZohoWorkDriveClient(
  process.env.ZOHO_CLIENT_ID!,
  process.env.ZOHO_CLIENT_SECRET!,
  process.env.ZOHO_REFRESH_TOKEN!,
  process.env.ZOHO_WORKDRIVE_ORG_ID!
);

export default async function uploadDocumentToZoho(file: File, title: string): Promise<string> {
  try {
    // Sanitize filename
    const fileName = title.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
    const fileExtension = file.name.split('.').pop();
    const fullFileName = fileExtension ? `${fileName}.${fileExtension}` : fileName;
    
    const folderId = process.env.ZOHO_DOCUMENTS_FOLDER_ID!;
    
    // Step 1: Upload file to Zoho WorkDrive
    const fileLink = await zohoClient.uploadFile(file, fullFileName, folderId);
    
    console.log('File uploaded successfully:', fileLink);
    
    // Step 2: Try to create a public download link, fallback to permalink if it fails
    try {
      const publicLink = await zohoClient.createPublicLink(fileLink.fileId);
      console.log('Public link created:', publicLink);
      return publicLink;
    } catch (linkError: any) {
      console.warn('Failed to create public link, using permalink instead:', linkError.message);
      return fileLink.permalink;
    }
  } catch (error: any) {
    console.error('Upload to Zoho failed:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

export async function deleteDocumentFromZoho(fileId: string): Promise<void> {
  try {
    await zohoClient.deleteFile(fileId);
  } catch (error: any) {
    console.error('Error deleting file:', error.message);
    throw error;
  }
}