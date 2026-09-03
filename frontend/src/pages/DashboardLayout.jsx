import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import api from '../services/api';
import DashboardSidebar from '../components/DashboardSidebar.jsx';

export default function DashboardLayout() {
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    api.get('/dashboard').then((res) => setNotifCount(res.data.notification_count)).catch(() => {});
  }, []);

  return (
    <div className="flex">
      <DashboardSidebar notificationCount={notifCount} />
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
