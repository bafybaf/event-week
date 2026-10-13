export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  title?: string;
  department?: string;
  company?: string;
  phone?: string;
  profileImage?: string;
  qrCode?: string;
  role: 'participant' | 'speaker' | 'admin' | 'organizer';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  address?: string;
  city?: string;
  country?: string;
  logo?: string;
  banner?: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  settings: {
    allowRegistration: boolean;
    allowVoting: boolean;
    allowAppointments: boolean;
    allowGallery: boolean;
    allowDocuments: boolean;
    allowSurveys: boolean;
  };
  organizerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Program {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  type: 'keynote' | 'presentation' | 'workshop' | 'panel' | 'break' | 'meal' | 'activity';
  capacity?: number;
  isReminderEnabled: boolean;
  reminderMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Speaker {
  id: string;
  userId?: string;
  eventId: string;
  bio?: string;
  expertise?: string;
  socialLinks: Record<string, string>;
  isFeatured: boolean;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface VotingSession {
  id: string;
  eventId: string;
  programId?: string;
  title: string;
  question: string;
  options: string[];
  isActive: boolean;
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vote {
  id: string;
  votingSessionId: string;
  userId: string;
  selectedOption: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  eventId: string;
  requesterId: string;
  requestedUserId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  requester?: User;
  requestedUser?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Transfer {
  id: string;
  eventId: string;
  userId: string;
  transferType: 'airport' | 'hotel' | 'venue' | 'other';
  pickupLocation: string;
  dropoffLocation: string;
  scheduledTime: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  driverInfo?: Record<string, any>;
  vehicleInfo?: Record<string, any>;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  type: 'workshop' | 'entertainment' | 'sport' | 'networking' | 'other';
  startTime: string;
  endTime: string;
  location?: string;
  capacity?: number;
  currentParticipants: number;
  isRegistrationOpen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Flight {
  id: string;
  eventId: string;
  userId: string;
  flightNumber: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  terminal?: string;
  gate?: string;
  seat?: string;
  status: 'scheduled' | 'delayed' | 'cancelled' | 'completed';
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Accommodation {
  id: string;
  eventId: string;
  userId: string;
  hotelName: string;
  address: string;
  checkInDate: string;
  checkOutDate: string;
  roomNumber?: string;
  roomType?: string;
  confirmationNumber?: string;
  contactInfo?: Record<string, any>;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: string;
  eventId: string;
  userId: string;
  title?: string;
  description?: string;
  fileUrl: string;
  fileType: 'image' | 'video';
  fileSize?: number;
  likesCount: number;
  isFeatured: boolean;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  category?: string;
  isPublic: boolean;
  downloadCount: number;
  createdBy: string;
  creator?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  eventId: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isPublic: boolean;
  createdBy: string;
  creator?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Survey {
  id: string;
  eventId: string;
  programId?: string;
  title: string;
  description?: string;
  questions: any[];
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdBy: string;
  creator?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  eventId: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isPublished: boolean;
  publishedAt?: string;
  createdBy: string;
  creator?: User;
  createdAt: string;
  updatedAt: string;
}

export interface QRCodeLog {
  id: string;
  eventId: string;
  userId: string;
  qrCode: string;
  action: 'entry' | 'exit' | 'session_join' | 'session_leave' | 'meal' | 'transfer';
  location?: string;
  programId?: string;
  user?: User;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalUsers: number;
  totalEvents: number;
  activeEvents: number;
  totalPrograms: number;
  totalSpeakers: number;
  totalVotes: number;
  totalAppointments: number;
  totalTransfers: number;
  totalActivities: number;
  totalFlights: number;
  totalAccommodations: number;
  totalGalleryItems: number;
  totalDocuments: number;
  totalNotes: number;
  totalSurveys: number;
  totalAnnouncements: number;
}
