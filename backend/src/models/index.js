const { sequelize } = require('../database/connection');

// Import all models
const User = require('./User');
const Event = require('./Event');
const Program = require('./Program');
const Speaker = require('./Speaker');
const ProgramSpeaker = require('./ProgramSpeaker');
const Voting = require('./Voting');
const Appointment = require('./Appointment');
const Transfer = require('./Transfer');
const TransferBooking = require('./TransferBooking');
const Activity = require('./Activity');
const ActivityRegistration = require('./ActivityRegistration');
const Flight = require('./Flight');
const FlightBooking = require('./FlightBooking');
const Accommodation = require('./Accommodation');
const AccommodationBooking = require('./AccommodationBooking');
const Gallery = require('./Gallery');
const Document = require('./Document');
const Note = require('./Note');
const Survey = require('./Survey');
const SurveyResponse = require('./SurveyResponse');
const Report = require('./Report');
const Setting = require('./Setting');
const Announcement = require('./Announcement');
const VotingSession = require('./VotingSession');
const FeedItem = require('./FeedItem');
const FeedLike = require('./FeedLike');
const FeedComment = require('./FeedComment');
const SupportTicket = require('./SupportTicket');
const SupportMessage = require('./SupportMessage');
const Quiz = require('./Quiz');
const QuizQuestion = require('./QuizQuestion');
const QuizPlayer = require('./QuizPlayer');
const QuizAnswer = require('./QuizAnswer');
const RaffleDraw = require('./RaffleDraw');

// Define all models
const models = {
  User,
  Event,
  Program,
  Speaker,
  ProgramSpeaker,
  Voting,
  Appointment,
  Transfer,
  TransferBooking,
  Activity,
  ActivityRegistration,
  Flight,
  FlightBooking,
  Accommodation,
  AccommodationBooking,
  Gallery,
  Document,
  Note,
  Survey,
  SurveyResponse,
  Report,
  Setting,
  Announcement,
  VotingSession,
  FeedItem,
  FeedLike,
  FeedComment,
  SupportTicket,
  SupportMessage,
  Quiz,
  QuizQuestion,
  QuizPlayer,
  QuizAnswer,
  RaffleDraw
};

// Initialize associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Export models and sequelize
module.exports = {
  sequelize,
  ...models
};
