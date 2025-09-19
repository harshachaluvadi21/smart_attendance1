import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Users, Clock, Download, Volume2, Brain } from "lucide-react";
import { 
  initializeOpenCV,
  registerStudentFace,
  trainKNNModel,
  recognizeFaces,
  markAttendance,
  getAttendanceRecords,
  exportAttendanceToCSV,
  isOpenCVModelLoaded,
  getOpenCVDebugInfo
} from "@/lib/opencvFaceRecognition";

const OpenCVAttendanceSystem = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedStudents, setDetectedStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [status, setStatus] = useState("Initializing OpenCV...");
  const [currentStep, setCurrentStep] = useState<'capture' | 'detect' | 'preprocess' | 'train' | 'recognize' | 'attendance' | 'feedback'>('capture');

  useEffect(() => {
    initializeSystem();
    loadAttendanceRecords();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeSystem = async () => {
    try {
      setStatus("Loading OpenCV and Haar Cascade...");
      setCurrentStep('capture');
      
      const success = await initializeOpenCV();
      if (success) {
        setIsModelLoading(false);
        setStatus("OpenCV system ready!");
        startCamera();
      } else {
        setStatus("Failed to initialize OpenCV");
      }
    } catch (error) {
      console.error("Error initializing OpenCV:", error);
      setStatus("Error initializing OpenCV");
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setStatus("Camera access denied");
    }
  };

  const registerStudent = async (studentId: string, studentName: string) => {
    try {
      setCurrentStep('detect');
      setStatus("Detecting face with Haar Cascade...");
      
      if (!videoRef.current || !canvasRef.current) return false;
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        setCurrentStep('preprocess');
        setStatus("Preprocessing image (cv2 + numpy)...");
        
        const success = await registerStudentFace(studentId, canvas);
        
        if (success) {
          setCurrentStep('train');
          setStatus("Training KNN model (sklearn)...");
          
          const trainingSuccess = await trainKNNModel();
          if (trainingSuccess) {
            setStatus(`Student ${studentName} registered successfully!`);
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error("Error registering student:", error);
      setStatus("Error registering student");
      return false;
    }
  };

  const startRecognition = () => {
    if (!isOpenCVModelLoaded()) {
      setStatus("OpenCV models not loaded yet");
      return;
    }

    setIsDetecting(true);
    setStatus("Starting face recognition...");
    
    const recognitionInterval = setInterval(async () => {
      if (!isDetecting || !videoRef.current || !canvasRef.current) {
        clearInterval(recognitionInterval);
        return;
      }

      try {
        setCurrentStep('recognize');
        setStatus("Recognizing face (KNN.predict)...");
        
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          
          const recognitions = await recognizeFaces(canvas);
          
          for (const recognition of recognitions) {
            if (recognition.confidence > 0.5) {
              setCurrentStep('attendance');
              setStatus("Marking attendance (csv + datetime)...");
              
              // Mark attendance
              markAttendance(recognition.studentId, `Student ${recognition.studentId}`);
              
              setCurrentStep('feedback');
              setStatus("Giving feedback (TTS)...");
              
              // Add to detected students
              const student = {
                rollNumber: recognition.studentId,
                name: `Student ${recognition.studentId}`,
                confidence: recognition.confidence,
                timestamp: new Date().toISOString()
              };
              
              setDetectedStudents(prev => {
                const exists = prev.some(s => s.rollNumber === student.rollNumber);
                if (!exists) {
                  return [...prev, student];
                }
                return prev;
              });
              
              loadAttendanceRecords();
              setStatus(`Student ${recognition.studentId} detected and marked present!`);
            }
          }
        }
      } catch (error) {
        console.error("Error during recognition:", error);
        setStatus("Recognition error");
      }
    }, 2000);
  };

  const stopRecognition = () => {
    setIsDetecting(false);
    setStatus("Recognition stopped");
  };

  const loadAttendanceRecords = () => {
    const records = getAttendanceRecords();
    setAttendanceRecords(records);
  };

  const exportCSV = () => {
    exportAttendanceToCSV();
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'capture': return '📹';
      case 'detect': return '👁️';
      case 'preprocess': return '⚙️';
      case 'train': return '🧠';
      case 'recognize': return '🔍';
      case 'attendance': return '📝';
      case 'feedback': return '🔊';
      default: return '⏳';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">OpenCV Face Recognition System</h1>
        <p className="text-lg text-muted-foreground">
          Complete pipeline: Capture → Detect → Preprocess → Train → Recognize → Attendance → Feedback
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Camera Feed */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5" />
                <span>Live Camera Feed</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Loading overlay */}
                {isModelLoading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      {status}
                    </div>
                  </div>
                )}
                
                {/* Current step indicator */}
                {!isModelLoading && (
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-sm p-2 rounded">
                    <div>Step: {getStepIcon(currentStep)} {currentStep}</div>
                    <div>Status: {status}</div>
                    <div>Students: {getOpenCVDebugInfo().registeredStudents.length}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex space-x-3">
                {!isDetecting ? (
                  <Button 
                    onClick={startRecognition}
                    className="flex-1"
                    disabled={isModelLoading}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Start Recognition
                  </Button>
                ) : (
                  <Button 
                    onClick={stopRecognition}
                    variant="destructive"
                    className="flex-1"
                  >
                    Stop Recognition
                  </Button>
                )}
                <Button onClick={exportCSV} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Detected Students */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Detected Students</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {detectedStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">
                    No students detected yet
                  </p>
                ) : (
                  detectedStudents.map((student) => (
                    <div key={student.rollNumber} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <div>
                        <div className="font-medium text-sm">{student.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Confidence: {(student.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                      <Badge className="bg-green-500 text-white text-xs">
                        Present
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attendance Records */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Attendance Records</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {attendanceRecords.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">
                    No attendance records yet
                  </p>
                ) : (
                  attendanceRecords.slice(-5).map((record, index) => (
                    <div key={index} className="p-2 bg-muted/30 rounded text-xs">
                      <div className="font-medium">{record.studentName}</div>
                      <div className="text-muted-foreground">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Volume2 className="h-4 w-4" />
                <span>System Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>OpenCV:</span>
                  <span className={isOpenCVModelLoaded() ? 'text-green-600' : 'text-red-600'}>
                    {isOpenCVModelLoaded() ? '✅ Loaded' : '❌ Not Loaded'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Students:</span>
                  <span>{getOpenCVDebugInfo().registeredStudents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Samples:</span>
                  <span>{getOpenCVDebugInfo().totalSamples}</span>
                </div>
                <div className="flex justify-between">
                  <span>KNN:</span>
                  <span className={getOpenCVDebugInfo().knnTrained ? 'text-green-600' : 'text-red-600'}>
                    {getOpenCVDebugInfo().knnTrained ? '✅ Trained' : '❌ Not Trained'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OpenCVAttendanceSystem;
