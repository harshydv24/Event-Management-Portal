import api from '@/api/client';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  clubId: string;
  clubName: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

/**
 * Post a new announcement via the backend API.
 */
export const postAnnouncement = async (
  announcement: Omit<Announcement, 'id' | 'createdAt'>
): Promise<Announcement> => {
  const response = await api.post<{ announcement: Announcement }>('/announcements', announcement);
  return response.announcement;
};

/**
 * Fetch all announcements, optionally filtered by club.
 */
export const fetchAnnouncements = async (clubId?: string): Promise<Announcement[]> => {
  const query = clubId ? `?clubId=${clubId}` : '';
  const response = await api.get<{ announcements: Announcement[] }>(`/announcements${query}`);
  return response.announcements;
};
