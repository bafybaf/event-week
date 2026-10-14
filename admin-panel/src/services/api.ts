import axios from 'axios';
import { API_BASE_URL } from '../config.ts';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Users API
export const usersApi = {
  // Get all users
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Get user by ID
  getUser: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create user
  createUser: async (userData: any) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (id: string, userData: any) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Validate phone user
  validatePhoneUser: async (phoneNumber: string, eventId: string) => {
    const response = await api.post('/users/validate-phone', {
      phoneNumber,
      eventId
    });
    return response.data;
  },

  // Register mobile user
  registerMobileUser: async (userData: any) => {
    const response = await api.post('/users/register-mobile', userData);
    return response.data;
  },

  // Import users from Excel
  importUsers: async (users: any[]) => {
    const response = await api.post('/users/import', { users });
    return response.data;
  }
};

// Events API
export const eventsApi = {
  // Get all events
  getEvents: async () => {
    const response = await api.get('/events');
    return response.data.events || response.data || [];
  },

  // Get event by ID
  getEvent: async (id: string) => {
    const response = await api.get(`/events/${id}`);
    return response.data.event || response.data;
  },

  // Get event participants
  getEventParticipants: async (id: string) => {
    const response = await api.get(`/events/${id}/participants`);
    return response.data;
  },

  // Import event participants from Excel
  importEventParticipants: async (id: string, participants: any[]) => {
    const response = await api.post(`/events/${id}/participants/import`, { participants });
    return response.data;
  },

  // Create event
  createEvent: async (eventData: any) => {
    const response = await api.post('/events', eventData);
    return response.data.event || response.data;
  },

  // Update event
  updateEvent: async (id: string, eventData: any) => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data.event || response.data;
  },

  // Delete event
  deleteEvent: async (id: string) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  }
};

// Auth API
export const authApi = {
  // Login
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Register
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// Programs API
export const programsApi = {
  // List programs (optional eventId)
  getPrograms: async (eventId?: string) => {
    const params = eventId ? { params: { eventId } } : undefined;
    const response = await api.get('/programs', params as any);
    // backend returns { success, programs }
    return response.data.programs || [];
  },

  // Get program by ID
  getProgram: async (id: string) => {
    const response = await api.get(`/programs/${id}`);
    return response.data.program;
  },

  // Create program (accepts UI payload with date + startTime/endTime)
  createProgram: async (payload: any) => {
    const response = await api.post('/programs', payload);
    return response.data.program;
  },

  // Update program
  updateProgram: async (id: string, payload: any) => {
    const response = await api.put(`/programs/${id}`, payload);
    return response.data.program;
  },

  // Delete program
  deleteProgram: async (id: string) => {
    const response = await api.delete(`/programs/${id}`);
    return response.data;
  }
};

// Activities API
export const activitiesApi = {
  getActivities: async (eventId?: string) => {
    const params = eventId ? { params: { eventId } } : undefined;
    const response = await api.get('/activities', params as any);
    return response.data.activities || [];
  },
  getActivity: async (id: string) => {
    const response = await api.get(`/activities/${id}`);
    return response.data.activity;
  },
  createActivity: async (payload: any) => {
    const response = await api.post('/activities', payload);
    return response.data.activity;
  },
  updateActivity: async (id: string, payload: any) => {
    const response = await api.put(`/activities/${id}`, payload);
    return response.data.activity;
  },
  deleteActivity: async (id: string) => {
    const response = await api.delete(`/activities/${id}`);
    return response.data;
  }
};

// Flights API
export const flightsApi = {
  getFlights: async (eventId?: string) => {
    const params = eventId ? { params: { eventId } } : undefined;
    const response = await api.get('/flights', params as any);
    return response.data.flights || [];
  },
  getFlight: async (id: string) => {
    const response = await api.get(`/flights/${id}`);
    return response.data.flight;
  },
  createFlight: async (payload: any) => {
    const response = await api.post('/flights', payload);
    return response.data.flight;
  },
  updateFlight: async (id: string, payload: any) => {
    const response = await api.put(`/flights/${id}`, payload);
    return response.data.flight;
  },
  deleteFlight: async (id: string) => {
    const response = await api.delete(`/flights/${id}`);
    return response.data;
  }
};

// Accommodations API
export const accommodationsApi = {
  getAccommodations: async (eventId?: string) => {
    const params = eventId ? { params: { eventId } } : undefined;
    const response = await api.get('/accommodations', params as any);
    return response.data.accommodations || [];
  },
  getAccommodation: async (id: string) => {
    const response = await api.get(`/accommodations/${id}`);
    return response.data.accommodation;
  },
  createAccommodation: async (payload: any) => {
    const response = await api.post('/accommodations', payload);
    return response.data.accommodation;
  },
  updateAccommodation: async (id: string, payload: any) => {
    const response = await api.put(`/accommodations/${id}`, payload);
    return response.data.accommodation;
  },
  deleteAccommodation: async (id: string) => {
    const response = await api.delete(`/accommodations/${id}`);
    return response.data;
  }
};

// Speakers API
export const speakersApi = {
  getSpeakers: async (eventId?: string) => {
    try {
      const params = eventId ? { params: { eventId: String(eventId) } } : undefined;
      console.log('Fetching speakers with params:', params, 'eventId type:', typeof eventId);
      const response = await api.get('/speakers', params as any);
      console.log('Speakers API response:', response.data);
      console.log('Speakers array in response:', response.data?.speakers);
      const speakers = response.data?.speakers || response.data || [];
      console.log('Returning speakers:', speakers, 'Length:', Array.isArray(speakers) ? speakers.length : 'Not an array');
      return Array.isArray(speakers) ? speakers : [];
    } catch (error: any) {
      console.error('Speakers API error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      throw error; // Re-throw to let caller handle it
    }
  },
  getSpeaker: async (id: string) => {
    const response = await api.get(`/speakers/${id}`);
    return response.data.speaker;
  },
  createSpeaker: async (payload: any) => {
    const response = await api.post('/speakers', payload);
    return response.data.speaker;
  },
  updateSpeaker: async (id: string, payload: any) => {
    const response = await api.put(`/speakers/${id}`, payload);
    return response.data.speaker;
  },
  deleteSpeaker: async (id: string) => {
    const response = await api.delete(`/speakers/${id}`);
    return response.data;
  },
  importSpeakers: async (speakers: any[], eventId?: string) => {
    const response = await api.post('/speakers/import', { speakers, eventId });
    return response.data;
  }
};

// Voting API
export const votingApi = {
  getVotings: async (programId?: string) => {
    const params = programId ? { params: { programId } } : undefined;
    const response = await api.get('/voting', params as any);
    return response.data; // Backend { success: true, votes: [...] } formatında dönüyor
  },
  getVoting: async (id: string) => {
    const response = await api.get(`/voting/${id}`);
    return response.data.vote;
  },
  createVoting: async (payload: any) => {
    const response = await api.post('/voting', payload);
    return response.data.vote;
  },
  updateVoting: async (id: string, payload: any) => {
    const response = await api.put(`/voting/${id}`, payload);
    return response.data.vote;
  },
  deleteVoting: async (id: string) => {
    const response = await api.delete(`/voting/${id}`);
    return response.data;
  }
};

// Gallery API
export const galleryApi = {
  getGalleryItems: async (eventId?: string) => {
    const params = eventId ? { params: { eventId } } : undefined;
    const response = await api.get('/gallery', params as any);
    return response.data.items || response.data.galleryItems || [];
  },
  getGalleryItem: async (id: string) => {
    const response = await api.get(`/gallery/${id}`);
    return response.data.item || response.data;
  },
  createGalleryItem: async (payload: any) => {
    const response = await api.post('/gallery', payload);
    return response.data.item || response.data;
  },
  updateGalleryItem: async (id: string, payload: any) => {
    const response = await api.put(`/gallery/${id}`, payload);
    return response.data.item || response.data;
  },
  deleteGalleryItem: async (id: string) => {
    const response = await api.delete(`/gallery/${id}`);
    return response.data;
  }
};

// Documents API
export const documentsApi = {
  getDocuments: async (eventId?: string) => {
    const params = eventId ? { params: { eventId } } : undefined;
    const response = await api.get('/documents', params as any);
    return response.data.documents || [];
  },
  getDocument: async (id: string) => {
    const response = await api.get(`/documents/${id}`);
    return response.data.document || response.data;
  },
  createDocument: async (payload: any) => {
    const response = await api.post('/documents', payload);
    return response.data.document || response.data;
  },
  updateDocument: async (id: string, payload: any) => {
    const response = await api.put(`/documents/${id}`, payload);
    return response.data.document || response.data;
  },
  deleteDocument: async (id: string) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  }
};

// Surveys API
export const surveysApi = {
  getSurveys: async (eventId?: string) => {
    const params = eventId ? { params: { eventId } } : undefined;
    const response = await api.get('/surveys', params as any);
    return response.data.surveys || [];
  },
  getSurvey: async (id: string) => {
    const response = await api.get(`/surveys/${id}`);
    return response.data.survey || response.data;
  },
  createSurvey: async (payload: any) => {
    const response = await api.post('/surveys', payload);
    return response.data.survey || response.data;
  },
  updateSurvey: async (id: string, payload: any) => {
    const response = await api.put(`/surveys/${id}`, payload);
    return response.data.survey || response.data;
  },
  deleteSurvey: async (id: string) => {
    const response = await api.delete(`/surveys/${id}`);
    return response.data;
  }
};

// Transfers API
export const transfersApi = {
  getTransfers: async (eventId?: string) => {
    const params = eventId ? { params: { eventId } } : undefined;
    const response = await api.get('/transfers', params as any);
    return response.data.transfers || [];
  },
  getTransfer: async (id: string) => {
    const response = await api.get(`/transfers/${id}`);
    return response.data.transfer || response.data;
  },
  createTransfer: async (payload: any) => {
    const response = await api.post('/transfers', payload);
    return response.data.transfer || response.data;
  },
  updateTransfer: async (id: string, payload: any) => {
    const response = await api.put(`/transfers/${id}`, payload);
    return response.data.transfer || response.data;
  },
  deleteTransfer: async (id: string) => {
    const response = await api.delete(`/transfers/${id}`);
    return response.data;
  }
};

// Announcements API
export const announcementsApi = {
  getAnnouncements: async (eventId?: string) => {
    const params = eventId ? { params: { eventId } } : undefined;
    const response = await api.get('/announcements', params as any);
    console.log('Announcements API response:', response.data);
    // Backend returns { success: true, announcements: [...] }
    if (response.data.success && response.data.announcements) {
      return response.data.announcements;
    }
    // Fallback for different response formats
    return response.data.announcements || response.data || [];
  },
  getAnnouncement: async (id: string) => {
    const response = await api.get(`/announcements/${id}`);
    return response.data.announcement || response.data;
  },
  createAnnouncement: async (payload: any) => {
    const response = await api.post('/announcements', payload);
    return response.data.announcement || response.data;
  },
  updateAnnouncement: async (id: string, payload: any) => {
    const response = await api.put(`/announcements/${id}`, payload);
    return response.data;
  },
  notifyAnnouncement: async (id: string) => {
    const response = await api.post(`/announcements/${id}/notify`);
    return response.data;
  },
  deleteAnnouncement: async (id: string) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  }
};

// Appointments API
export const appointmentsApi = {
  getAppointments: async (eventId?: string) => {
    const params = eventId ? { params: { eventId } } : undefined;
    const response = await api.get('/appointments', params as any);
    return response.data.appointments || [];
  },
  getAppointment: async (id: string) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data.appointment || response.data;
  },
  createAppointment: async (payload: any) => {
    const response = await api.post('/appointments', payload);
    return response.data.appointment || response.data;
  },
  updateAppointment: async (id: string, payload: any) => {
    const response = await api.put(`/appointments/${id}`, payload);
    return response.data.appointment || response.data;
  },
  deleteAppointment: async (id: string) => {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  }
};

// Notes API
export const notesApi = {
  getNotes: async (eventId?: string) => {
    const params = eventId ? { params: { eventId } } : undefined;
    const response = await api.get('/notes', params as any);
    return response.data;
  },
  getNote: async (id: string | number) => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },
  createNote: async (payload: any) => {
    const response = await api.post('/notes', payload);
    return response.data;
  },
  updateNote: async (id: string | number, payload: any) => {
    const response = await api.put(`/notes/${id}`, payload);
    return response.data;
  },
  deleteNote: async (id: string | number) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  }
};

export const supportApi = {
  getTickets: async (eventId?: string, status?: string) => {
    const params: any = {};
    if (eventId) params.eventId = eventId;
    if (status) params.status = status;
    const response = await api.get('/support/tickets', { params });
    return response.data;
  },
  getTicket: async (id: string) => {
    const response = await api.get(`/support/tickets/${id}`);
    return response.data;
  },
  reply: async (id: string, payload: any) => {
    const response = await api.post(`/support/tickets/${id}/messages`, payload);
    return response.data.message;
  },
  updateStatus: async (id: string, status: 'open' | 'closed') => {
    const response = await api.put(`/support/tickets/${id}/status`, { status });
    return response.data.ticket;
  }
};

export const quizApi = {
  getQuizzes: async (eventId?: string) => {
    const params = eventId ? { params: { eventId } } : undefined;
    const response = await api.get('/quiz', params as any);
    return response.data.quizzes || [];
  },
  getState: async (id: string, host = false) => {
    const response = await api.get(`/quiz/${id}`, { params: host ? { host: 1 } : undefined } as any);
    return response.data.state;
  },
  createQuiz: async (payload: any) => {
    const response = await api.post('/quiz', payload);
    return response.data.state;
  },
  updateQuiz: async (id: string, payload: any) => {
    const response = await api.put(`/quiz/${id}`, payload);
    return response.data.state;
  },
  deleteQuiz: async (id: string) => {
    const response = await api.delete(`/quiz/${id}`);
    return response.data;
  },
  openLobby: async (id: string) => {
    const response = await api.post(`/quiz/${id}/lobby`);
    return response.data.state;
  },
  ask: async (id: string) => {
    const response = await api.post(`/quiz/${id}/ask`);
    return response.data.state;
  },
  reveal: async (id: string) => {
    const response = await api.post(`/quiz/${id}/reveal`);
    return response.data.state;
  },
  leaderboard: async (id: string) => {
    const response = await api.post(`/quiz/${id}/leaderboard`);
    return response.data.state;
  },
  end: async (id: string) => {
    const response = await api.post(`/quiz/${id}/end`);
    return response.data.state;
  },
  raffle: async (id: string, pool: 'all' | 'scored' = 'all') => {
    const response = await api.post(`/quiz/${id}/raffle`, { pool });
    return response.data.state;
  },
};

export const raffleApi = {
  getState: async (eventId: string) => {
    const response = await api.get('/raffle', { params: { eventId } } as any);
    return response.data.state;
  },
  draw: async (eventId: string) => {
    const response = await api.post('/raffle/draw', { eventId });
    return response.data.state;
  },
};

export const feedApi = {
  getFeed: async (eventId?: string) => {
    const params = eventId ? { params: { eventId } } : undefined;
    const response = await api.get('/feed', params as any);
    return response.data;
  },
  createItem: async (payload: any) => {
    const response = await api.post('/feed', payload);
    return response.data.item;
  },
  updateItem: async (id: string, payload: any) => {
    const response = await api.put(`/feed/${id}`, payload);
    return response.data.item;
  },
  deleteItem: async (id: string) => {
    const response = await api.delete(`/feed/${id}`);
    return response.data;
  }
};

// Admin API
export const adminApi = {
  getStats: async (eventId?: string) => {
    const params = eventId ? { params: { eventId } } : undefined;
    const response = await api.get('/admin/stats', params as any);
    return response.data.data || response.data;
  }
};

export default api;
