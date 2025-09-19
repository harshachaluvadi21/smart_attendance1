import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, User, Camera, Calendar, CheckCircle, GraduationCap, ArrowLeft, TrendingUp, Award } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import FaceCapture from "@/components/FaceCapture";
import AttendanceHistory from "@/components/AttendanceHistory";
import { AttendanceStreak } from "@/components/gamification/AttendanceStreak";
import { getSession, listSections, getSubjectsForSection, updateStudent } from "@/lib/store";
import { useNavigate } from "react-router-dom";

interface StudentDashboardProps {
  onLogout: () => void;
}

const StudentDashboard = ({ onLogout }: StudentDashboardProps) => {
  const navigate = useNavigate();
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [studentData, setStudentData] = useState({
    id: "",
    rollNumber: "",
    name: "",
    email: "",
    sectionId: "",
    faceRegistered: false,
  });

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "student") {
      navigate("/student/auth");
      return;
    }
    // Load from localStorage db directly to avoid circular imports
    const raw = localStorage.getItem("smartattend-db");
    if (!raw) return;
    const db = JSON.parse(raw);
    const student = db.students[session.userId];
    if (!student) {
      navigate("/student/auth");
      return;
    }
    setStudentData(student);
    if (!student.faceRegistered) setShowFaceCapture(true);
  }, [navigate]);

  const subjects = useMemo(() => studentData.sectionId ? getSubjectsForSection(studentData.sectionId) : [], [studentData.sectionId]);

  const handleFaceCaptureComplete = () => {
    updateStudent(studentData.id, { faceRegistered: true });
    setStudentData(prev => ({ ...prev, faceRegistered: true }));
    setShowFaceCapture(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Camera className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">SmartAttend</h1>
                <p className="text-sm text-muted-foreground">Student Portal</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                onLogout();
                navigate("/");
              }} 
              variant="outline" 
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!showFaceCapture && (
          <div className="space-y-8">
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-accent/10 rounded-full">
                      <CheckCircle className="h-8 w-8 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold">Welcome, {studentData.name || "Student"}!</h2>
                      <p className="text-muted-foreground">Roll: {studentData.rollNumber}</p>
                    </div>
                  </div>
                  {!studentData.faceRegistered && (
                    <Button onClick={() => setShowFaceCapture(true)} variant="outline">Complete Face Registration</Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {subjects.length > 0 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Subjects for your section</CardTitle>
                  <CardDescription>Access is restricted to your section's subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map(sub => (
                      <div key={sub.id} className="p-4 border rounded-lg bg-muted/30">
                        <div className="font-medium">{sub.name}</div>
                        <div className="text-xs text-muted-foreground">Section subject</div>
                      </div>
                    ))}
                    {subjects.length === 0 && (
                      <div className="text-sm text-muted-foreground">No subjects assigned</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {showFaceCapture && (
          <FaceCapture 
            studentData={{ rollNumber: studentData.rollNumber, name: studentData.name, email: studentData.email }}
            onComplete={handleFaceCaptureComplete}
            onBack={() => setShowFaceCapture(false)}
          />
        )}

        {!showFaceCapture && (
          <div className="space-y-8">
            <AttendanceHistory studentRoll={studentData.rollNumber} />
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;