import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { getAttendanceForStudent } from "@/lib/store";

interface AttendanceHistoryProps {
  studentRoll: string;
}

const formatTime = (ms: number) => new Date(ms).toLocaleTimeString();
const formatDate = (ms: number) => new Date(ms).toLocaleDateString();

const AttendanceHistory = ({ studentRoll }: AttendanceHistoryProps) => {
  const records = useMemo(() => {
    // Load db to map subject names
    const raw = localStorage.getItem("smartattend-db");
    const db = raw ? JSON.parse(raw) : undefined;
    const student = db ? Object.values(db.students).find((s: any) => s.rollNumber === studentRoll) : undefined;
    if (!student) return [] as { date: string; time: string; status: string; subject: string }[];
    const att = getAttendanceForStudent(student.id);
    return att
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(a => ({
        date: formatDate(a.timestamp),
        time: a.present ? formatTime(a.timestamp) : "—",
        status: a.present ? "Present" : "Absent",
        subject: db?.subjects[a.subjectId]?.name ?? "Subject",
      }));
  }, [studentRoll]);

  const presentCount = records.filter(record => record.status === "Present").length;
  const totalClasses = records.length;
  const attendancePercentage = Math.round((presentCount / totalClasses) * 100);

  return (
    <div className="space-y-6">
      {/* Attendance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-accent/10 rounded-full">
                <CheckCircle className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-2xl font-bold">{presentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-destructive/10 rounded-full">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold">{totalClasses - presentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold">{attendancePercentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Attendance History</span>
          </CardTitle>
          <CardDescription>
            Your complete attendance record for recent classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {records.map((record, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{record.date}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {record.subject}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {record.status === "Present" && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{record.time}</span>
                    </div>
                  )}
                  <Badge 
                    variant={record.status === "Present" ? "default" : "destructive"}
                    className={record.status === "Present" 
                      ? "bg-accent hover:bg-accent/90 text-accent-foreground" 
                      : ""
                    }
                  >
                    {record.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceHistory;