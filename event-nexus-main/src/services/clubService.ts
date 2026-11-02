import api from '@/api/client';
import { Club } from '@/types';

/**
 * Create a new club via the backend API.
 */
export const createClub = async (
  club: Omit<Club, 'id' | 'createdAt' | 'eventsCount'>
): Promise<Club> => {
  const response = await api.post<{ club: Club }>('/clubs', club);
  return response.club;
};

/**
 * Create a club with a specific ID (used when linking to user's clubId).
 */
export const createClubWithId = async (
  clubId: string,
  club: Omit<Club, 'id' | 'createdAt' | 'eventsCount'>
): Promise<Club> => {
  const response = await api.post<{ club: Club }>(`/clubs/${clubId}`, club);
  return response.club;
};

/**
 * Get all clubs from the backend.
 */
export const getAllClubs = async (): Promise<Club[]> => {
  const response = await api.get<{ clubs: Club[] }>('/clubs');
  return response.clubs;
};

/**
 * Get a single club's details.
 */
export const getClubDetails = async (clubId: string): Promise<Club | null> => {
  try {
    const response = await api.get<{ club: Club }>(`/clubs/${clubId}`);
    return response.club;
  } catch (error: unknown) {
    if ((error as { statusCode?: number }).statusCode === 404) return null;
    throw error;
  }
};

/**
 * Update an existing club.
 */
export const updateClub = async (
  clubId: string,
  updates: Partial<Club>
): Promise<void> => {
  await api.put(`/clubs/${clubId}`, updates);
};

/**
 * Delete a club.
 */
export const deleteClub = async (clubId: string): Promise<void> => {
  await api.delete(`/clubs/${clubId}`);
};
