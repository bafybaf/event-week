import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Layout from './components/Layout.tsx';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Users from './pages/Users.tsx';
import Events from './pages/Events.tsx';
import Programs from './pages/Programs.tsx';
import Speakers from './pages/Speakers.tsx';
import Voting from './pages/Voting.tsx';
import Appointments from './pages/Appointments.tsx';
import Transfers from './pages/Transfers.tsx';
import Activities from './pages/Activities.tsx';
import Flights from './pages/Flights.tsx';
import Accommodations from './pages/Accommodations.tsx';
import Gallery from './pages/Gallery.tsx';
import Documents from './pages/Documents.tsx';
import Notes from './pages/Notes.tsx';
import Surveys from './pages/Surveys.tsx';
import Reports from './pages/Reports.tsx';
import Settings from './pages/Settings.tsx';
import Announcements from './pages/Announcements.tsx';
import Feed from './pages/Feed.tsx';
import Support from './pages/Support.tsx';
import Profile from './pages/Profile.tsx';
import Quizzes from './pages/Quizzes.tsx';
import QuizHost from './pages/QuizHost.tsx';
import Raffle from './pages/Raffle.tsx';
import RaffleStage from './pages/RaffleStage.tsx';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/quiz/:id/host"
                element={
                  <ProtectedRoute>
                    <QuizHost />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/raffle/:eventId/stage"
                element={
                  <ProtectedRoute>
                    <RaffleStage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                           <Routes>
                             <Route path="/" element={<Navigate to="/dashboard" replace />} />
                             <Route path="/dashboard" element={<Dashboard />} />
                             <Route path="/users" element={<Users />} />
                             <Route path="/events" element={<Events />} />
                             <Route path="/programs" element={<Programs />} />
                             <Route path="/speakers" element={<Speakers />} />
                             <Route path="/quizzes" element={<Quizzes />} />
                             <Route path="/raffle" element={<Raffle />} />
                             <Route path="/voting" element={<Voting />} />
                             <Route path="/appointments" element={<Appointments />} />
                             <Route path="/transfers" element={<Transfers />} />
                             <Route path="/activities" element={<Activities />} />
                             <Route path="/flights" element={<Flights />} />
                             <Route path="/accommodations" element={<Accommodations />} />
                             <Route path="/gallery" element={<Gallery />} />
                             <Route path="/documents" element={<Documents />} />
                             <Route path="/notes" element={<Notes />} />
                             <Route path="/surveys" element={<Surveys />} />
                             <Route path="/reports" element={<Reports />} />
                             <Route path="/profile" element={<Profile />} />
                             <Route path="/settings" element={<Settings />} />
                             <Route path="/announcements" element={<Announcements />} />
                             <Route path="/feed" element={<Feed />} />
                             <Route path="/support" element={<Support />} />
                           </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;