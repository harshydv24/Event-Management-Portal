import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '@/config/firebase';

/**
 * Upload a file to Firebase Storage.
 * @param file The file to upload
 * @param path Storage path (e.g., 'events/posters/filename.jpg')
 * @returns The download URL of the uploaded file
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
};

/**
 * Delete a file from Firebase Storage.
 * @param path Storage path of the file to delete
 */
export const deleteFile = async (path: string): Promise<void> => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};

/**
 * Get the download URL for a file in Firebase Storage.
 * @param path Storage path of the file
 * @returns The download URL
 */
export const getFileUrl = async (path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  return await getDownloadURL(storageRef);
};

/**
 * Upload an event-related file (poster, proposal, M2M PDF).
 * @param file The file to upload
 * @param eventId The event ID (used to organize files)
 * @param type The type of file being uploaded
 * @returns The download URL
 */
export const uploadEventFile = async (
  file: File,
  eventId: string,
  type: 'poster' | 'proposal' | 'm2m'
): Promise<string> => {
  const extension = file.name.split('.').pop() || 'file';
  const path = `events/${eventId}/${type}_${Date.now()}.${extension}`;
  return await uploadFile(file, path);
};

/**
 * Upload a club logo.
 * @param file The logo image file
 * @param clubId The club ID
 * @returns The download URL
 */
export const uploadClubLogo = async (
  file: File,
  clubId: string
): Promise<string> => {
  const extension = file.name.split('.').pop() || 'png';
  const path = `clubs/${clubId}/logo_${Date.now()}.${extension}`;
  return await uploadFile(file, path);
};
