import api from '@/api/client';

/**
 * Upload a file to the backend and return the download URL.
 * Replaces Firebase Storage uploads.
 *
 * @param file The file to upload
 * @param _path Previously the Firebase Storage path — now unused
 * @returns The download URL of the uploaded file
 */
export const uploadFile = async (file: File, _path?: string): Promise<string> => {
  const response = await api.uploadFile('/upload', file);
  return response.url;
};

/**
 * Delete a file from storage.
 * Note: Not yet implemented for local storage backend.
 * @param _path Storage path of the file to delete
 */
export const deleteFile = async (_path: string): Promise<void> => {
  // TODO: Implement server-side file deletion endpoint
  console.warn('deleteFile: Not yet implemented for the Express backend.');
};

/**
 * Get the download URL for a file.
 * With the Express backend, URLs are returned directly during upload,
 * so this function is a no-op passthrough.
 *
 * @param path The file path/URL
 * @returns The path/URL as-is
 */
export const getFileUrl = async (path: string): Promise<string> => {
  return path;
};

/**
 * Upload an event-related file (poster, proposal, M2M PDF).
 * @param file The file to upload
 * @param _eventId The event ID (used to organize files — handled by backend)
 * @param _type The type of file being uploaded
 * @returns The download URL
 */
export const uploadEventFile = async (
  file: File,
  _eventId: string,
  _type: 'poster' | 'proposal' | 'm2m'
): Promise<string> => {
  return await uploadFile(file);
};

/**
 * Upload a club logo.
 * @param file The logo image file
 * @param _clubId The club ID (handled by backend)
 * @returns The download URL
 */
export const uploadClubLogo = async (
  file: File,
  _clubId: string
): Promise<string> => {
  return await uploadFile(file);
};
