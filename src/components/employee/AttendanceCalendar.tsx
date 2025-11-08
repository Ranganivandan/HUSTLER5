import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'leave' | 'holiday';
  inTime?: string;
  outTime?: string;
  hours?: number;
}

interface AttendanceCalendarProps {
  attendance: AttendanceRecord[];
  onDateSelect?: (date: Date) => void;
}

export function AttendanceCalendar({ attendance, onDateSelect }: AttendanceCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();

  const getStatusForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return attendance.find(a => a.date === dateStr);
  };

  const selectedRecord = selectedDate ? getStatusForDate(selectedDate) : null;

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateSelect?.(date);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-success/20 hover:bg-success/30';
      case 'absent': return 'bg-destructive/20 hover:bg-destructive/30';
      case 'leave': return 'bg-warning/20 hover:bg-warning/30';
      case 'holiday': return 'bg-primary/20 hover:bg-primary/30';
      default: return '';
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Attendance Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="rounded-md border"
            modifiers={{
              present: (date) => getStatusForDate(date)?.status === 'present',
              absent: (date) => getStatusForDate(date)?.status === 'absent',
              leave: (date) => getStatusForDate(date)?.status === 'leave',
              holiday: (date) => getStatusForDate(date)?.status === 'holiday',
            }}
            modifiersClassNames={{
              present: getStatusColor('present'),
              absent: getStatusColor('absent'),
              leave: getStatusColor('leave'),
              holiday: getStatusColor('holiday'),
            }}
          />
          
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-success/20 border border-success/40" />
              <span className="text-sm">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-destructive/20 border border-destructive/40" />
              <span className="text-sm">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-warning/20 border border-warning/40" />
              <span className="text-sm">Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-primary/20 border border-primary/40" />
              <span className="text-sm">Holiday</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedRecord && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{format(selectedDate!, 'PPP')}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={
                selectedRecord.status === 'present' ? 'default' : 
                selectedRecord.status === 'absent' ? 'destructive' : 
                'secondary'
              }>
                {selectedRecord.status.toUpperCase()}
              </Badge>
            </div>

            {selectedRecord.inTime && (
              <div>
                <p className="text-sm text-muted-foreground">In Time</p>
                <p className="font-medium">{selectedRecord.inTime}</p>
              </div>
            )}

            {selectedRecord.outTime && (
              <div>
                <p className="text-sm text-muted-foreground">Out Time</p>
                <p className="font-medium">{selectedRecord.outTime}</p>
              </div>
            )}

            {selectedRecord.hours && (
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="font-medium">{selectedRecord.hours} hrs</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
