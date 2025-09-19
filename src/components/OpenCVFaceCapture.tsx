import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Camera, CheckCircle, ArrowLeft, User, Brain } from "lucide-react";
import { 
  initializeOpenCV, 
  registerStudentFace, 
  trainKNNModel, 
  saveFaceData,
  isOpenCVModelLoaded 
} from "@/lib/opencvFaceRecognition";

interface OpenCVFaceCaptureProps {
  studentData: {
    rollNumber: string;
    name: string;
    email: string;
  };
  onComplete: () => void;
  onBack: () => void;
}

const OpenCVFaceCapture = ({ studentData, onComplete, onBack }: OpenCVFaceCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [capturedImages, setCapturedImages] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [captureStatus, setCaptureStatus] = useState("");
  const [isTraining, setIsTraining] = useState(false);

  const totalImages = 50; // Reduced for OpenCV approach

  useEffect(() => {
    initializeOpenCVSystem();
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeOpenCVSystem = async () => {
    try {
      setIsModelLoading(true);
      setCaptureStatus("Initializing OpenCV and loading Haar Cascade...");
      
      const success = await initializeOpenCV();
      if (success) {
        setIsModelLoading(false);
        setCaptureStatus("OpenCV face recognition ready!");
      } else {
        setCaptureStatus("Failed to initialize OpenCV");
      }
    } catch (error) {
      console.error("Error initializing OpenCV:", error);
      setCaptureStatus("Error initializing OpenCV system");
      setIsModelLoading(false);
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
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const startCapture = async () => {
    if (!isOpenCVModelLoaded()) {
      alert("OpenCV models are still loading. Please wait...");
      return;
    }

    setIsCapturing(true);
    setCapturedImages(0);
    setCaptureProgress(0);
    setCaptureStatus("Capturing face data with Haar Cascade...");

    let capturedCount = 0;
    const captureInterval = setInterval(async () => {
      try {
        if (videoRef.current && canvasRef.current) {
          // Capture frame from video
          const canvas = canvasRef.current;
          const video = videoRef.current;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            
            // Register face with OpenCV
            const success = await registerStudentFace(studentData.rollNumber, canvas);
            
            if (success) {
              capturedCount++;
              setCapturedImages(capturedCount);
              setCaptureProgress((capturedCount / totalImages) * 100);
              setCaptureStatus(`Captured ${capturedCount}/${totalImages} face samples`);
            } else {
              setCaptureStatus("No face detected - please position your face in the camera");
            }
          }
        }

        if (capturedCount >= totalImages) {
          clearInterval(captureInterval);
          setIsCapturing(false);
          setCaptureStatus("Training KNN model...");
          
          // Train the KNN model
          setIsTraining(true);
          const trainingSuccess = await trainKNNModel();
          
          if (trainingSuccess) {
            // Save face data
            saveFaceData();
            setCaptureStatus("Face registration and training completed successfully!");
            setTimeout(() => {
              alert("Face registration completed successfully!");
              onComplete();
            }, 1000);
          } else {
            setCaptureStatus("Error training the model");
          }
          setIsTraining(false);
        }
      } catch (error) {
        console.error("Error during face capture:", error);
        setCaptureStatus("Error during face capture");
      }
    }, 300); // Capture every 300ms
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-elevation">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Button onClick={onBack} variant="outline" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{studentData.name}</span>
            </div>
          </div>
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">OpenCV Face Recognition Setup</CardTitle>
          <CardDescription className="text-lg">
            We'll capture face samples and train a KNN model for recognition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Camera Feed */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-center">Camera Feed</h3>
              <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Hidden canvas for face capture */}
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                {/* Face detection overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div 
                    className={`border-2 border-dashed w-48 h-48 rounded-full flex items-center justify-center ${
                      isCapturing ? 'border-accent animate-pulse' : 'border-muted-foreground/50'
                    }`}
                  >
                    <span className="text-xs text-center text-muted-foreground">
                      Position your face<br />within this circle
                    </span>
                  </div>
                </div>
                {isModelLoading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      Loading OpenCV and Haar Cascade...
                    </div>
                  </div>
                )}
                {isTraining && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      Training KNN model...
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress and Instructions */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Capture Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Images Captured</span>
                    <span>{capturedImages} / {totalImages}</span>
                  </div>
                  <Progress value={captureProgress} className="h-2" />
                  {captureStatus && (
                    <div className="text-center text-sm text-muted-foreground">
                      {captureStatus}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">OpenCV Process:</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                    Haar Cascade face detection
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                    Image preprocessing (grayscale, resize)
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                    Feature extraction
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                    KNN model training
                  </li>
                </ul>
              </div>

              {captureProgress === 100 && !isTraining && (
                <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-accent" />
                    <div>
                      <p className="font-semibold text-accent">Registration Complete!</p>
                      <p className="text-sm text-muted-foreground">
                        KNN model trained and ready for recognition
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isCapturing && captureProgress === 0 && (
            <div className="text-center">
              <Button 
                onClick={startCapture}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
                disabled={isModelLoading}
              >
                <Camera className="h-4 w-4 mr-2" />
                Start Face Capture
              </Button>
            </div>
          )}

          {isCapturing && (
            <div className="text-center">
              <p className="text-lg font-medium text-primary">
                Capturing images... Please hold still
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                This will take about {Math.ceil((totalImages - capturedImages) * 0.3)} seconds
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OpenCVFaceCapture;
