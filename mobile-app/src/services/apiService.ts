import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Generic CRUD operations
  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    return this.handleResponse<T>(response);
  }

  // Activities API
  async getActivities(eventId?: string | number) {
    const endpoint = eventId ? `/activities?eventId=${eventId}` : '/activities';
    const response = await this.get<any>(endpoint);
    return response.activities || response;
  }

  async getActivity(id: string | number) {
    const response = await this.get<any>(`/activities/${id}`);
    return response.activity || response;
  }

  async createActivity(data: any) {
    return this.post('/activities', data);
  }

  async updateActivity(id: string | number, data: any) {
    const response = await this.put<any>(`/activities/${id}`, data);
    return response.activity || response;
  }

  async deleteActivity(id: string | number) {
    return this.delete(`/activities/${id}`);
  }

  // Flights API
  async getFlights(eventId?: string | number) {
    const endpoint = eventId ? `/flights?eventId=${eventId}` : '/flights';
    const response = await this.get<any>(endpoint);
    return response.flights || response;
  }

  async getFlight(id: string | number) {
    const response = await this.get<any>(`/flights/${id}`);
    return response.flight || response;
  }

  async createFlight(data: any) {
    const response = await this.post<any>('/flights', data);
    return response.flight || response;
  }

  async updateFlight(id: string | number, data: any) {
    const response = await this.put<any>(`/flights/${id}`, data);
    return response.flight || response;
  }

  async deleteFlight(id: string | number) {
    return this.delete(`/flights/${id}`);
  }

  // Accommodations API
  async getAccommodations(eventId?: string | number) {
    const endpoint = eventId ? `/accommodations?eventId=${eventId}` : '/accommodations';
    const response = await this.get<any>(endpoint);
    return response.accommodations || response;
  }

  async getAccommodation(id: string | number) {
    const response = await this.get<any>(`/accommodations/${id}`);
    return response.accommodation || response;
  }

  async createAccommodation(data: any) {
    const response = await this.post<any>('/accommodations', data);
    return response.accommodation || response;
  }

  async updateAccommodation(id: string | number, data: any) {
    const response = await this.put<any>(`/accommodations/${id}`, data);
    return response.accommodation || response;
  }

  async deleteAccommodation(id: string | number) {
    return this.delete(`/accommodations/${id}`);
  }

  // Gallery API
  async getGalleryItems(eventId?: string | number) {
    const endpoint = eventId ? `/gallery?eventId=${eventId}` : '/gallery';
    const response = await this.get<any>(endpoint);
    console.log('Gallery API response:', response);
    
    // Backend returns { success: true, galleryItems: [...] }
    if (response.success && response.galleryItems) {
      return response.galleryItems;
    }
    
    // Fallback for other response formats
    return response.items || response.gallery || (Array.isArray(response) ? response : []);
  }

  async getGalleryItem(id: string | number) {
    const response = await this.get<any>(`/gallery/${id}`);
    return response.item || response;
  }

  async createGalleryItem(data: any) {
    const response = await this.post<any>('/gallery', data);
    return response.item || response;
  }

  async updateGalleryItem(id: string | number, data: any) {
    const response = await this.put<any>(`/gallery/${id}`, data);
    return response.item || response;
  }

  async deleteGalleryItem(id: string | number) {
    return this.delete(`/gallery/${id}`);
  }

  // Documents API
  async getDocuments(eventId?: string | number) {
    const endpoint = eventId ? `/documents?eventId=${eventId}` : '/documents';
    const response = await this.get<any>(endpoint);
    return response.documents || response;
  }

  async getDocument(id: string | number) {
    const response = await this.get<any>(`/documents/${id}`);
    return response.document || response;
  }

  async createDocument(data: any) {
    const response = await this.post<any>('/documents', data);
    return response.document || response;
  }

  async updateDocument(id: string | number, data: any) {
    const response = await this.put<any>(`/documents/${id}`, data);
    return response.document || response;
  }

  async deleteDocument(id: string | number) {
    return this.delete(`/documents/${id}`);
  }

  // Notes API
  async getNotes(eventId?: string | number, userId?: string | number) {
    let endpoint = '/notes';
    const params = new URLSearchParams();
    if (eventId) params.append('eventId', String(eventId));
    if (userId) params.append('userId', String(userId));
    if (params.toString()) endpoint += `?${params.toString()}`;
    const response = await this.get<any>(endpoint);
    return response.notes || response;
  }

  async getNote(id: string | number) {
    const response = await this.get<any>(`/notes/${id}`);
    return response.note || response;
  }

  async createNote(data: any) {
    const response = await this.post<any>('/notes', data);
    return response.note || response;
  }

  async updateNote(id: string | number, data: any) {
    const response = await this.put<any>(`/notes/${id}`, data);
    return response.note || response;
  }

  async deleteNote(id: string | number) {
    return this.delete(`/notes/${id}`);
  }

  // Surveys API
  async getSurveys(eventId?: string | number) {
    const endpoint = eventId ? `/surveys?eventId=${eventId}` : '/surveys';
    const response = await this.get<any>(endpoint);
    return response.surveys || response;
  }

  async getSurvey(id: string | number) {
    const response = await this.get<any>(`/surveys/${id}`);
    return response.survey || response;
  }

  async createSurvey(data: any) {
    const response = await this.post<any>('/surveys', data);
    return response.survey || response;
  }

  async updateSurvey(id: string | number, data: any) {
    const response = await this.put<any>(`/surveys/${id}`, data);
    return response.survey || response;
  }

  async deleteSurvey(id: string | number) {
    return this.delete(`/surveys/${id}`);
  }

  // Reports API
  async getReports(eventId?: string | number) {
    const endpoint = eventId ? `/reports?eventId=${eventId}` : '/reports';
    const response = await this.get<any>(endpoint);
    return response.reports || response;
  }

  async getReport(id: string | number) {
    const response = await this.get<any>(`/reports/${id}`);
    return response.report || response;
  }

  async createReport(data: any) {
    const response = await this.post<any>('/reports', data);
    return response.report || response;
  }

  async updateReport(id: string | number, data: any) {
    const response = await this.put<any>(`/reports/${id}`, data);
    return response.report || response;
  }

  async deleteReport(id: string | number) {
    return this.delete(`/reports/${id}`);
  }

  // Settings API
  async getSettings(eventId?: string | number) {
    const endpoint = eventId ? `/settings?eventId=${eventId}` : '/settings';
    const response = await this.get<any>(endpoint);
    return response.settings || response;
  }

  async getSetting(key: string) {
    const response = await this.get<any>(`/settings/${key}`);
    return response.setting || response;
  }

  async createSetting(data: any) {
    const response = await this.post<any>('/settings', data);
    return response.setting || response;
  }

  async updateSetting(key: string, data: any) {
    const response = await this.put<any>(`/settings/${key}`, data);
    return response.setting || response;
  }

  async deleteSetting(key: string) {
    return this.delete(`/settings/${key}`);
  }

  // Events API
  async getEvents() {
    const response = await this.get<any>('/events');
    return response.events || response;
  }

  async getEvent(id: string | number) {
    const response = await this.get<any>(`/events/${id}`);
    return response.event || response;
  }

  // Public events (no auth required)
  async getPublicEvents() {
    const response = await this.get<any>('/events/public');
    // Backend response format: { success: true, events: [...] }
    if (response && response.success && Array.isArray(response.events)) {
      return response.events;
    }
    // Fallback: direkt array dönerse
    if (Array.isArray(response)) {
      return response;
    }
    // Fallback: response.events varsa
    return response.events || response;
  }

  async getPublicAppName() {
    try {
      const response = await this.get<any>('/settings/public/app-name');
      return String(response?.appName || '').trim() || 'Event Week';
    } catch {
      return 'Event Week';
    }
  }

  async getMyStats() {
    const response = await this.get<any>('/users/me/stats');
    return response?.stats || null;
  }

  async getPublicAppLogo() {
    const response = await this.get<any>('/settings/public/app-logo');
    return response?.appLogo || null;
  }

  async getPublicAppIntroVideo() {
    const response = await this.get<any>('/settings/public/app-intro-video');
    return response?.introVideoUrl || null;
  }

  async getPublicFeatures() {
    const fallback = { postsEnabled: true, storiesEnabled: true, commentsEnabled: true };
    try {
      const response = await this.get<any>('/settings/public/features');
      return {
        postsEnabled: response?.postsEnabled !== false,
        storiesEnabled: response?.storiesEnabled !== false,
        commentsEnabled: response?.commentsEnabled !== false,
      };
    } catch {
      return fallback;
    }
  }

  // Users API
  async getUsers() {
    const response = await this.get<any>('/users');
    return response.users || response;
  }

  async getUser(id: string | number) {
    const response = await this.get<any>(`/users/${id}`);
    return response.user || response;
  }

  // Programs API
  async getPrograms(eventId?: string | number) {
    const endpoint = eventId ? `/programs?eventId=${eventId}` : '/programs';
    const response = await this.get<any>(endpoint);
    return response.programs || response;
  }

  async getProgramParticipants(programId: string | number) {
    const response = await this.get<any>(`/programs/${programId}/participants`);
    return response.participants || [];
  }

  async getProgram(id: string | number) {
    const response = await this.get<any>(`/programs/${id}`);
    return response.program || response;
  }

  // Speakers API
  async getSpeakers(eventId?: string | number) {
    const endpoint = eventId ? `/speakers?eventId=${eventId}` : '/speakers';
    const response = await this.get<any>(endpoint);
    return response.speakers || response;
  }

  async getSpeaker(id: string | number) {
    const response = await this.get<any>(`/speakers/${id}`);
    return response.speaker || response;
  }

  // Transfers API
  async getTransfers(eventId?: string | number) {
    const endpoint = eventId ? `/transfers?eventId=${eventId}` : '/transfers';
    const response = await this.get<any>(endpoint);
    return response.transfers || response;
  }

  async getTransfer(id: string | number) {
    const response = await this.get<any>(`/transfers/${id}`);
    return response.transfer || response;
  }

  // Survey Response API
  async submitSurveyResponse(surveyId: string | number, responses: any) {
    const response = await this.post<any>(`/surveys/${surveyId}/responses`, responses);
    return response.response || response;
  }

  // Announcements API
  async getAnnouncements(eventId?: string | number) {
    const endpoint = eventId ? `/announcements?eventId=${eventId}` : '/announcements';
    const response = await this.get<any>(endpoint);
    console.log('getAnnouncements response:', response);
    // Backend returns { success: true, announcements: [...] }
    if (response.success && response.announcements) {
      return response.announcements;
    }
    // Fallback for different response formats
    return response.announcements || response || [];
  }

  async getAnnouncement(id: string | number) {
    const response = await this.get<any>(`/announcements/${id}`);
    return response.announcement || response;
  }

  // Appointments API
  async getAppointments(eventId?: string | number) {
    const endpoint = eventId ? `/appointments?eventId=${eventId}` : '/appointments';
    const response = await this.get<any>(endpoint);
    return Array.isArray(response.appointments) ? response.appointments : (Array.isArray(response) ? response : []);
  }

  async getAppointment(id: string | number) {
    const response = await this.get<any>(`/appointments/${id}`);
    return response.appointment || response;
  }

  async createAppointment(data: any) {
    const response = await this.post<any>('/appointments', data);
    return response.appointment || response;
  }

  async updateAppointment(id: string | number, data: any) {
    const response = await this.put<any>(`/appointments/${id}`, data);
    return response.appointment || response;
  }

  async deleteAppointment(id: string | number) {
    return this.delete(`/appointments/${id}`);
  }

  // Voting API - Program bazlı oylar için
  async getVotes(programId?: string | number, userId?: string | number) {
    let endpoint = '/voting';
    const params = new URLSearchParams();
    if (programId) params.append('programId', String(programId));
    if (userId) params.append('userId', String(userId));
    if (params.toString()) endpoint += `?${params.toString()}`;
    const response = await this.get<any>(endpoint);
    return Array.isArray(response.votes) ? response.votes : (Array.isArray(response) ? response : []);
  }

  async getVote(id: string | number) {
    const response = await this.get<any>(`/voting/${id}`);
    return response.vote || response;
  }

  async submitVote(data: any) {
    const response = await this.post<any>('/voting', data);
    return response.vote || response;
  }

  async updateVote(id: string | number, data: any) {
    const response = await this.put<any>(`/voting/${id}`, data);
    return response.vote || response;
  }

  async getFeed(eventId?: string | number) {
    const endpoint = eventId ? `/feed?eventId=${eventId}` : '/feed';
    return this.get<any>(endpoint);
  }

  async createFeedItem(data: any) {
    const response = await this.post<any>('/feed', data);
    return response.item || response;
  }

  async deleteFeedItem(id: string) {
    return this.delete(`/feed/${id}`);
  }

  async toggleFeedLike(id: string) {
    return this.post<any>(`/feed/${id}/like`, {});
  }

  async getFeedComments(id: string) {
    const response = await this.get<any>(`/feed/${id}/comments`);
    return response.comments || [];
  }

  async addFeedComment(id: string, text: string) {
    const response = await this.post<any>(`/feed/${id}/comments`, { text });
    return response.comment || response;
  }

  async deleteFeedComment(itemId: string, commentId: string) {
    return this.delete(`/feed/${itemId}/comments/${commentId}`);
  }

  async getSupportTickets(eventId?: string | number) {
    const endpoint = eventId ? `/support/tickets?eventId=${eventId}` : '/support/tickets';
    const response = await this.get<any>(endpoint);
    return response.tickets || [];
  }

  async getSupportTicket(id: string) {
    return this.get<any>(`/support/tickets/${id}`);
  }

  async createSupportTicket(data: any) {
    const response = await this.post<any>('/support/tickets', data);
    return response.ticket || response;
  }

  async replySupportTicket(id: string, data: any) {
    const response = await this.post<any>(`/support/tickets/${id}/messages`, data);
    return response.message || response;
  }

  async updateSupportTicketStatus(id: string, status: 'open' | 'closed') {
    const response = await this.put<any>(`/support/tickets/${id}/status`, { status });
    return response.ticket || response;
  }

  async getRaffleWatch() {
    return this.get<any>('/raffle/watch');
  }

  async getLiveQuiz(eventId?: string | number) {
    const endpoint = eventId ? `/quiz/live?eventId=${eventId}` : '/quiz/live';
    return this.get<any>(endpoint);
  }

  async getQuizState(id: string) {
    const response = await this.get<any>(`/quiz/${id}`);
    return response.state || response;
  }

  async joinQuiz(id: string) {
    const response = await this.post<any>(`/quiz/${id}/join`, {});
    return response.state || response;
  }

  async answerQuiz(id: string, selectedIndex: number) {
    const response = await this.post<any>(`/quiz/${id}/answer`, { selectedIndex });
    return response.state || response;
  }
}

export const apiService = new ApiService();
export default apiService;
