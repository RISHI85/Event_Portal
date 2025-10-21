import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Profile from './pages/Profile';
import MyEvents from './pages/MyEvents';
import Explore from './pages/Explore';
import ExploreEvents from './pages/ExploreEvents';
import StepconeEvents from './pages/StepconeEvents';
import Auth from './pages/Auth';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthStore from './store/authStore';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/AdminDashboard';
import AdminEventForm from './pages/AdminEventForm';
import Register from './pages/Register';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import AdminRegistrations from './pages/AdminRegistrations';
import Contact from './pages/Contact';
import EventDetails from './pages/EventDetails';
import CertificateView from './pages/CertificateView';

function App() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isCertificateView = location.pathname === '/certificate-view';

  return (
    <div>
      {!isCertificateView && <Navbar />}
      <main className={`main ${isHome ? 'main-home' : isCertificateView ? '' : 'main-page'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={isAuthenticated ? <Navigate to="/" /> : <Auth />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
          <Route path="/certificate-view" element={<CertificateView />} />
          <Route path="/explore-events" element={<ExploreEvents />} />
          <Route path="/stepcone-events" element={<StepconeEvents />} />
          <Route path="/explore/:dept" element={<Explore />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/events/:id/register" element={<ProtectedRoute><Register /></ProtectedRoute>} />
          <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
          <Route path="/payment/cancel" element={<ProtectedRoute><PaymentCancel /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/events/new" element={<AdminRoute><AdminEventForm /></AdminRoute>} />
          <Route path="/admin/events/:id/edit" element={<AdminRoute><AdminEventForm /></AdminRoute>} />
          <Route path="/admin/events/:id/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {!isCertificateView && <Footer />}
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
