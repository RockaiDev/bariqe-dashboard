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
}

export default new CloudinaryService();