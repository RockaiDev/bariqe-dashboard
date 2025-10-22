// services/cloudinary/CloudinaryService.ts
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  
  /**
   * Upload image from file path (الأساسي والأهم)
   */
  async uploadFromPath(filePath: string, folder: string = 'products', publicId?: string): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        public_id: publicId,
        use_filename: true,
        quality: 'auto:good',
        fetch_format: 'auto',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto:good' }
        ]
      });

      if (!result) throw new Error('No result returned from Cloudinary');
      return result.secure_url;
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  /**
   * Upload PDF or document from file path
   */
  async uploadDocumentFromPath(filePath: string, folder: string = 'documents', publicId?: string): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        public_id: publicId,
        use_filename: true,
        resource_type: 'raw', // Use 'raw' for PDFs and documents
        format: 'pdf'
      });

      if (!result) throw new Error('No result returned from Cloudinary');
      return result.secure_url;
    } catch (error: any) {
      console.error('Cloudinary document upload error:', error);
      throw new Error(`Cloudinary document upload failed: ${error.message}`);
    }
  }

  /**
   * Upload PDF with better configuration
   */
  async uploadPdfFromPath(filePath: string, folder: string = 'events/documents', publicId?: string): Promise<{url: string, publicId: string}> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        public_id: publicId,
        use_filename: true,
        resource_type: 'auto', // Use 'auto' to detect file type automatically
        type: 'upload',
        chunk_size: 6000000, // 6MB chunks for larger files
      });

      if (!result) throw new Error('No result returned from Cloudinary');
      
      return {
        url: result.secure_url,
        publicId: result.public_id
      };
    } catch (error: any) {
      console.error('Cloudinary PDF upload error:', error);
      throw new Error(`Cloudinary PDF upload failed: ${error.message}`);
    }
  }

  /**
   * Get PDF download URL from Cloudinary
   */
  async getPdfDownloadUrl(publicId: string): Promise<string> {
    try {
      // Generate authenticated download URL for PDF
      const downloadUrl = cloudinary.url(publicId, {
        resource_type: 'raw',
        attachment: true, // Force download
        flags: 'attachment', // Force download as attachment
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
      });

      return downloadUrl;
    } catch (error: any) {
      console.error('Error generating PDF download URL:', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  /**
   * Get PDF preview URL (for viewing in browser)
   */
  async getPdfPreviewUrl(publicId: string): Promise<string> {
    try {
      const previewUrl = cloudinary.url(publicId, {
        resource_type: 'raw',
        flags: 'fl_attachment', // Optional: can be removed for inline viewing
      });

      return previewUrl;
    } catch (error: any) {
      console.error('Error generating PDF preview URL:', error);
      throw new Error(`Failed to generate preview URL: ${error.message}`);
    }
  }

  /**
   * Upload image from base64 string
   */
  async uploadImageFromBase64(base64: string, folder: string = 'products', publicId?: string): Promise<string> {
    try {
      const hasPrefix = base64.startsWith('data:image');
      const dataUri = hasPrefix ? base64 : `data:image/jpeg;base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        public_id: publicId,
        use_filename: true,
        quality: 'auto:good',
        fetch_format: 'auto',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto:good' }
        ]
      });

      if (!result) throw new Error('No result returned from Cloudinary');
      return result.secure_url;
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract public_id from URL
      const urlParts = imageUrl.split('/');
      const fileWithExtension = urlParts.pop();
      
      if (!fileWithExtension) return;
      
      // Get the file name without extension
      const fileName = fileWithExtension.split('.')[0];
      
      // Try to get folder from URL
      const folderIndex = urlParts.findIndex(part => part === 'upload');
      if (folderIndex !== -1 && urlParts[folderIndex + 2]) {
        const folder = urlParts[folderIndex + 2];
        const publicId = `${folder}/${fileName}`;
        console.log('Deleting image with public_id:', publicId);
        await cloudinary.uploader.destroy(publicId);
      } else {
        // Fallback: try deleting without folder
        console.log('Deleting image with public_id:', fileName);
        await cloudinary.uploader.destroy(fileName);
      }
    } catch (error: any) {
      console.error('Failed to delete image from Cloudinary:', error);
      // Don't throw error as it's not critical for the main operation
    }
  }

  /**
   * Delete document from Cloudinary
   */
  async deleteDocument(documentUrl: string): Promise<void> {
    try {
      // Extract public_id from URL
      const urlParts = documentUrl.split('/');
      const fileWithExtension = urlParts.pop();
      
      if (!fileWithExtension) return;
      
      // Get the file name without extension
      const fileName = fileWithExtension.split('.')[0];
      
      // Try to get folder from URL
      const folderIndex = urlParts.findIndex(part => part === 'upload');
      if (folderIndex !== -1 && urlParts[folderIndex + 2]) {
        const folder = urlParts[folderIndex + 2];
        const publicId = `${folder}/${fileName}`;
        console.log('Deleting document with public_id:', publicId);
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      } else {
        // Fallback: try deleting without folder
        console.log('Deleting document with public_id:', fileName);
        await cloudinary.uploader.destroy(fileName, { resource_type: 'raw' });
      }
    } catch (error: any) {
      console.error('Failed to delete document from Cloudinary:', error);
      // Don't throw error as it's not critical for the main operation
    }
  }
}

export default new CloudinaryService();