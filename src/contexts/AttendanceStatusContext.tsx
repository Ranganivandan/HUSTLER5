import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { attendanceApi } from '@/lib/api';
import { useAuth } from './AuthContext';

type AttendanceStatus = 'not-checked-in' | 'checked-in' | 'checked-out';

interface AttendanceStatusContextType {
  status: AttendanceStatus;
  setStatus: (status: AttendanceStatus) => void;
  refreshStatus: () => Promise<void>;
  loading: boolean;
}

const AttendanceStatusContext = createContext<AttendanceStatusContextType | undefined>(undefined);

export function AttendanceStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AttendanceStatus>('not-checked-in');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const refreshStatus = async () => {
    if (!user || user.role !== 'employee') {
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().slice(0, 7); // YYYY-MM
      const records = await attendanceApi.list({ month: today });
      
      // Get today's date in local timezone
      const now = new Date();
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10);
      
      console.log('[AttendanceContext] Today:', todayDate);
      console.log('[AttendanceContext] Records:', records.map(r => ({ date: r.date.slice(0, 10), checkIn: !!r.checkIn, checkOut: !!r.checkOut })));
      
      const todayRecord = records.find((r) => r.date.slice(0, 10) === todayDate);
      console.log('[AttendanceContext] Today Record:', todayRecord);

      if (!todayRecord || !todayRecord.checkIn) {
        console.log('[AttendanceContext] Setting: not-checked-in');
        setStatus('not-checked-in');
      } else if (todayRecord.checkOut) {
        console.log('[AttendanceContext] Setting: checked-out');
        setStatus('checked-out');
      } else {
        console.log('[AttendanceContext] Setting: checked-in');
        setStatus('checked-in');
      }
    } catch (error) {
      console.error('Failed to fetch attendance status:', error);
      setStatus('not-checked-in');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, [user]);

  return (
    <AttendanceStatusContext.Provider value={{ status, setStatus, refreshStatus, loading }}>
      {children}
    </AttendanceStatusContext.Provider>
  );
}

export function useAttendanceStatus() {
  const context = useContext(AttendanceStatusContext);
  if (context === undefined) {
    throw new Error('useAttendanceStatus must be used within AttendanceStatusProvider');
  }
  return context;
}
