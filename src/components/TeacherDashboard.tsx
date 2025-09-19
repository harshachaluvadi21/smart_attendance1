import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Camera, Users, Download, Play, Square, BarChart3, Search, User, Trash2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Input } from "@/components/ui/input";
import AttendanceSession from "@/components/AttendanceSession";
import AttendanceReports from "@/components/AttendanceReports";
import { AttendanceChart } from "@/components/charts/AttendanceChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showAttendanceNotification, showSessionStartNotification, showSessionEndNotification } from "@/components/notifications/AttendanceNotification";
import { addAttendance, addSubjectToSection, createSection, createSubject, getSubjectsForSection, listSections, getSession, deleteSubject, deleteSection, removeSubjectFromSection, listStudentsBySection } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

interface TeacherDashboardProps {
  onLogout: () => void;
}

const TeacherDashboard = ({ onLogout }: TeacherDashboardProps) => {
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState(false);
  const [sessionData, setSessionData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [period, setPeriod] = useState<number>(1);
  const [teacherData, setTeacherData] = useState({
    name: "",
    employeeId: "",
    department: ""
  });

  const [sections, setSections] = useState(() => listSections());
  const [subjectsRefreshTrigger, setSubjectsRefreshTrigger] = useState(0);
  const subjects = useMemo(() => selectedSectionId ? getSubjectsForSection(selectedSectionId) : [], [selectedSectionId, subjectsRefreshTrigger]);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");

  // Excel export function
  const exportToExcel = () => {
    if (!selectedSectionId) {
      alert("Please select a section first");
      return;
    }

    const section = sections.find(s => s.id === selectedSectionId);
    const subject = subjects.find(s => s.id === selectedSubjectId);
    const allStudents = listStudentsBySection(selectedSectionId);
    const presentStudents = sessionData.map(s => s.rollNumber);
    
    // Get current date and day
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
    const dayStr = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Prepare data for Excel
    const excelData = allStudents.map(student => ({
      'Roll Number': student.rollNumber,
      'Name': student.name,
      'Email': student.email,
      'Department': student.department || 'N/A',
      'Status': presentStudents.includes(student.rollNumber) ? 'Present' : 'Absent',
      'Timestamp': presentStudents.includes(student.rollNumber) 
        ? sessionData.find(s => s.rollNumber === student.rollNumber)?.timestamp 
        : 'Not Present'
    }));

    // Create CSV content
    const headers = Object.keys(excelData[0]);
    const csvContent = [
      headers.join(','),
      ...excelData.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_${section?.name}_${subject?.name || 'All'}_${dateStr}_${dayStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`Excel file downloaded successfully!\n\nSection: ${section?.name}\nSubject: ${subject?.name || 'All'}\nDate: ${dateStr} (${dayStr})\nPresent: ${presentStudents.length}\nAbsent: ${allStudents.length - presentStudents.length}`);
  };

  // Load teacher data on component mount
  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "teacher") {
      navigate("/teacher/auth");
      return;
    }
    
    // Load teacher data from localStorage
    const raw = localStorage.getItem("smartattend-db");
    if (!raw) return;
    const db = JSON.parse(raw);
    const teacher = db.teachers[session.userId];
    if (!teacher) {
      navigate("/teacher/auth");
      return;
    }
    
    setTeacherData({
      name: teacher.name,
      employeeId: teacher.employeeId,
      department: teacher.department || ""
    });
  }, [navigate]);

  // Listen for database changes and refresh sections and subjects
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "smartattend-db") {
        setSections(listSections());
        setSubjectsRefreshTrigger(prev => prev + 1); // Also refresh subjects
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const startAttendanceSession = () => {
    setActiveSession(true);
    setSessionData([]);
    showSessionStartNotification();
  };

  const stopAttendanceSession = () => {
    setActiveSession(false);
    showSessionEndNotification(sessionData.length);
  };

  const handleStudentDetected = useCallback((student: any) => {
    setSessionData(prev => {
      const exists = prev.find(s => s.rollNumber === student.rollNumber);
      if (!exists) {
        const newStudent = { ...student, timestamp: new Date().toISOString() };
        showAttendanceNotification(newStudent);
        // Optimized attendance persistence - only if section/subject selected
        if (selectedSectionId && selectedSubjectId) {
          try {
            const raw = localStorage.getItem("smartattend-db");
            const db = raw ? JSON.parse(raw) : undefined;
            if (db) {
              const matched = Object.values(db.students).find((s: any) => s.rollNumber === student.rollNumber);
              if (matched) {
                const teacherId = db.session?.userId;
                addAttendance({
                  studentId: matched.id,
                  subjectId: selectedSubjectId,
                  teacherId: teacherId || "",
                  sectionId: selectedSectionId,
                  period,
                  present: true,
                });
              }
            }
          } catch (error) {
            console.warn("Attendance persistence failed:", error);
          }
        }
        return [...prev, newStudent];
      }
      return prev;
    });
  }, [selectedSectionId, selectedSubjectId, period]);

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
                <p className="text-sm text-muted-foreground">Teacher Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <div className="flex items-center space-x-2 bg-muted/50 px-3 py-2 rounded-lg">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {teacherData.name || "Loading..."} ({teacherData.employeeId || "..."})
                </span>
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="attendance" className="space-y-8">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="attendance" className="flex items-center space-x-2">
              <Camera className="h-4 w-4" />
              <span>Live Attendance</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-8">
            {/* Manage Sections */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Manage Sections</CardTitle>
                <CardDescription>Create and manage class sections</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm">New Section</label>
                  <Input value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} placeholder="e.g., CSE-A" />
                  <Button onClick={() => { 
                    if (!newSectionName) return; 
                    try {
                      createSection(newSectionName); 
                      setNewSectionName(""); 
                      setSections(listSections()); // Refresh sections list
                      alert("Section created successfully!"); 
                    } catch (error: any) {
                      alert(error.message || "Failed to create section");
                    }
                  }} size="sm">Add Section</Button>
                </div>
              </CardContent>
            </Card>

            {/* Manage Subjects */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Manage Subjects</CardTitle>
                <CardDescription>Create subjects and assign them to class sections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm">Select Section</label>
                    <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">New Subject Name</label>
                    <Input 
                      value={newSubjectName} 
                      onChange={(e) => setNewSubjectName(e.target.value)} 
                      placeholder="e.g., Mathematics" 
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={() => { 
                      if (!newSubjectName || !selectedSectionId) { 
                        alert("Please select a section and enter subject name"); 
                        return; 
                      } 
                      try {
                        const sub = createSubject(newSubjectName); 
                        addSubjectToSection(selectedSectionId, sub.id); 
                        setNewSubjectName(""); 
                        setSections(listSections());
                        setSubjectsRefreshTrigger(prev => prev + 1);
                        alert("Subject added successfully!"); 
                      } catch (error: any) {
                        alert(error.message || "Failed to add subject");
                      }
                    }} 
                    className="flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Subject to Section</span>
                  </Button>
                </div>
                
                {/* Show subjects for selected section */}
                {selectedSectionId && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">
                      Subjects in {sections.find(s => s.id === selectedSectionId)?.name}:
                    </h4>
                    <div className="space-y-2">
                      {subjects.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No subjects assigned to this section</p>
                      ) : (
                        subjects.map(subject => (
                          <div key={subject.id} className="flex items-center justify-between p-2 bg-muted/30 rounded border">
                            <span className="text-sm">{subject.name}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Remove "${subject.name}" from this section?`)) {
                                  removeSubjectFromSection(selectedSectionId, subject.id);
                                  setSubjectsRefreshTrigger(prev => prev + 1);
                                  alert("Subject removed from section");
                                }
                              }}
                              className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance Control */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="h-5 w-5" />
                  <span>Attendance Session Control</span>
                </CardTitle>
                <CardDescription>
                  Start or stop live attendance tracking using facial recognition
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Section and Subject Selection */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Section</label>
                    <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Subject</label>
                    <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(sub => (
                          <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Period</label>
                    <Input type="number" min={1} max={8} value={period} onChange={(e) => setPeriod(Number(e.target.value))} />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {!activeSession ? (
                    <Button 
                      onClick={startAttendanceSession}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                      size="lg"
                      disabled={!selectedSectionId || !selectedSubjectId}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Attendance Session
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopAttendanceSession}
                      variant="destructive"
                      size="lg"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop Session
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline"
                    className="flex items-center space-x-2"
                    onClick={exportToExcel}
                    disabled={!selectedSectionId}
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Excel</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {activeSession && (
              <AttendanceSession 
                onStudentDetected={handleStudentDetected}
                detectedStudents={sessionData}
              />
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-8">
            <AttendanceChart />
            <AttendanceReports />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TeacherDashboard;