import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Check whether Cloudinary has valid credentials configured.
 */
export const isCloudinaryConfigured = (): boolean => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Upload a local file to Cloudinary and optionally remove the local file.
 *
 * @param filePath Absolute or relative path to the local file
 * @param folder Cloudinary folder name (defaults to 'event-nexus')
 * @param cleanupLocal Whether to delete the local file after successful upload (defaults to true)
 */
export const uploadToCloudinary = async (
  filePath: string,
  folder = process.env.CLOUDINARY_FOLDER || 'event-nexus',
  cleanupLocal = true
): Promise<UploadApiResponse> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
    });

    if (cleanupLocal && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn(`Failed to cleanup temp file ${filePath}:`, err);
      }
    }

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Delete an asset from Cloudinary by its public ID.
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Failed to delete asset ${publicId} from Cloudinary:`, error);
    throw error;
  }
};

export default cloudinary;

