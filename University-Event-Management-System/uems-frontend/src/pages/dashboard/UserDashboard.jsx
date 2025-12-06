// uems-frontend/src/pages/dashboard/UserDashboard.jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import StudentDashboard from './StudentDashboard';
import OrganizerDashboard from './OrganizerDashboard';

const UserDashboard = () => {
  const { user, isOrganizer, isAdmin } = useAuth();

  // Show OrganizerDashboard for organizers and admins (admins can be organizers too)
  if (isOrganizer || isAdmin) {
    return <OrganizerDashboard />;
  }

  // Show StudentDashboard for regular students
  return <StudentDashboard />;
};

export default UserDashboard;