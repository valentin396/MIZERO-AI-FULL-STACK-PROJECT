import { Routes, Route } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import FloatingChat from './components/FloatingChat.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import About from './pages/About.jsx';
import HowItWorks from './pages/HowItWorks.jsx';
import Contact from './pages/Contact.jsx';
import SearchPage from './pages/SearchPage.jsx';
import ItemDetail from './pages/ItemDetail.jsx';
import MatchDetails from './pages/MatchDetails.jsx';
import MapPage from './pages/MapPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

import DashboardLayout from './pages/DashboardLayout.jsx';
import DashboardHome from './pages/DashboardHome.jsx';
import MyReports from './pages/MyReports.jsx';
import MatchesList from './pages/MatchesList.jsx';
import Notifications from './pages/Notifications.jsx';
import Profile from './pages/Profile.jsx';
import DashboardChat from './pages/DashboardChat.jsx';
import DashboardSettings from './pages/DashboardSettings.jsx';

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/matches/:id" element={<MatchDetails />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/admin" element={<AdminDashboard />} />

          <Route path="/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardHome />} />
            <Route path="reports" element={<MyReports />} />
            <Route path="matches" element={<MatchesList />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="chat" element={<DashboardChat />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<DashboardSettings />} />
          </Route>
        </Routes>
      </main>
      <FloatingChat />
    </>
  );
}
