import api from './authService';

export interface Event {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  address?: string;
  city?: string;
  country?: string;
  status: 'draft' | 'published' | 'archived' | 'cancelled';
  maxParticipants?: number;
  currentParticipants: number;
  registrationDeadline?: string;
  isRegistrationOpen: boolean;
  organizerId: string;
  coverImage?: string;
  logo?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventsResponse {
  success: boolean;
  events: Event[];
}

export interface EventResponse {
  success: boolean;
  event: Event;
}

export const eventsService = {
  async getEvents(): Promise<Event[]> {
    try {
      const response = await api.get('/events');
      return response.data.events || [];
    } catch (error: any) {
      console.error('Get events error:', error);
      throw new Error(error.response?.data?.error || 'Etkinlikler alınamadı');
    }
  },

  async getEventById(id: string): Promise<Event> {
    try {
      const response = await api.get(`/events/${id}`);
      return response.data.event;
    } catch (error: any) {
      console.error('Get event error:', error);
      throw new Error(error.response?.data?.error || 'Etkinlik bulunamadı');
    }
  },

  async getPublishedEvents(): Promise<Event[]> {
    try {
      const response = await api.get('/events');
      const events = response.data.events || [];
      return events.filter((event: Event) => event.status === 'published');
    } catch (error: any) {
      console.error('Get published events error:', error);
      throw new Error(error.response?.data?.error || 'Yayınlanan etkinlikler alınamadı');
    }
  },

  async registerForEvent(eventId: string): Promise<void> {
    try {
      await api.post(`/events/${eventId}/register`);
    } catch (error: any) {
      console.error('Event registration error:', error);
      throw new Error(error.response?.data?.error || 'Etkinliğe kayıt olunamadı');
    }
  },

  async unregisterFromEvent(eventId: string): Promise<void> {
    try {
      await api.delete(`/events/${eventId}/register`);
    } catch (error: any) {
      console.error('Event unregistration error:', error);
      throw new Error(error.response?.data?.error || 'Etkinlik kaydı iptal edilemedi');
    }
  },
};
