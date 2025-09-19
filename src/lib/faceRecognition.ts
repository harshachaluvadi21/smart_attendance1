/**
 * Face Recognition Library
 * Real face detection and recognition using Face API
 */

// Import face-api from global scope since it's loaded via script tag
declare global {
  interface Window {
    faceapi: any;
  }
}

const faceapi = typeof window !== 'undefined' ? window.faceapi : null;

// Face recognition state
let isModelLoaded = false;
let faceDescriptors: Map<string, Float32Array[]> = new Map(); // studentId -> face descriptors

// Load Face API models with timeout
export const loadFaceModels = async (): Promise<boolean> => {
  try {
    if (isModelLoaded) return true;

    console.log('🔄 Starting to load face recognition models...');
    
    // Check if face-api is available
    if (typeof faceapi === 'undefined') {
      console.error('❌ Face API not loaded. Make sure the script is included in index.html');
      return false;
    }
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Model loading timeout after 30 seconds')), 30000);
    });

    // Load Face API models with timeout
    await Promise.race([
      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ]),
      timeoutPromise
    ]);

    isModelLoaded = true;
    console.log('✅ Face recognition models loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Error loading face models:', error);
    isModelLoaded = false;
    return false;
  }
};

// Detect faces in an image
export const detectFaces = async (imageElement: HTMLImageElement | HTMLVideoElement): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<faceapi.FaceDetection>>[]> => {
  if (!isModelLoaded) {
    await loadFaceModels();
  }

  try {
    const detections = await faceapi
      .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    return detections;
  } catch (error) {
    console.error('❌ Error detecting faces:', error);
    return [];
  }
};

// Register a student's face
export const registerStudentFace = async (studentId: string, imageElement: HTMLImageElement | HTMLVideoElement): Promise<boolean> => {
  try {
    const detections = await detectFaces(imageElement);
    
    if (detections.length === 0) {
      console.warn('⚠️ No faces detected in image');
      return false;
    }

    // Use the first detected face
    const faceDescriptor = detections[0].descriptor;
    
    // Store face descriptor for this student
    if (!faceDescriptors.has(studentId)) {
      faceDescriptors.set(studentId, []);
    }
    
    const studentDescriptors = faceDescriptors.get(studentId)!;
    studentDescriptors.push(faceDescriptor);
    
    console.log(`✅ Face registered for student ${studentId}`);
    return true;
  } catch (error) {
    console.error('❌ Error registering face:', error);
    return false;
  }
};

// Recognize faces in an image
export const recognizeFaces = async (imageElement: HTMLImageElement | HTMLVideoElement): Promise<{ studentId: string; confidence: number }[]> => {
  try {
    const detections = await detectFaces(imageElement);
    console.log(`🔍 Detected ${detections.length} faces`);
    
    if (detections.length === 0) {
      console.log('⚠️ No faces detected in image');
      return [];
    }

    const recognitions: { studentId: string; confidence: number }[] = [];
    const registeredStudents = Array.from(faceDescriptors.keys());
    console.log(`👥 Comparing against ${registeredStudents.length} registered students:`, registeredStudents);

    for (const detection of detections) {
      const faceDescriptor = detection.descriptor;
      let bestMatch: { studentId: string; confidence: number } | null = null;

      // Compare with all registered students
      for (const [studentId, descriptors] of faceDescriptors.entries()) {
        for (const descriptor of descriptors) {
          const distance = faceapi.euclideanDistance(faceDescriptor, descriptor);
          const confidence = Math.max(0, 1 - distance); // Convert distance to confidence (0-1)
          
          console.log(`📊 Student ${studentId}: distance=${distance.toFixed(3)}, confidence=${confidence.toFixed(3)}`);
          
          if (confidence > 0.5 && (!bestMatch || confidence > bestMatch.confidence)) {
            bestMatch = { studentId, confidence };
          }
        }
      }

      if (bestMatch) {
        console.log(`✅ Best match: ${bestMatch.studentId} with confidence ${bestMatch.confidence.toFixed(3)}`);
        recognitions.push(bestMatch);
      } else {
        console.log('❌ No match found above threshold');
      }
    }

    return recognitions;
  } catch (error) {
    console.error('❌ Error recognizing faces:', error);
    return [];
  }
};

// Get face descriptors for a student
export const getStudentFaceDescriptors = (studentId: string): Float32Array[] => {
  return faceDescriptors.get(studentId) || [];
};

// Clear face data for a student
export const clearStudentFaceData = (studentId: string): void => {
  faceDescriptors.delete(studentId);
};

// Get all registered students
export const getRegisteredStudents = (): string[] => {
  return Array.from(faceDescriptors.keys());
};

// Check if models are loaded
export const isFaceModelLoaded = (): boolean => {
  return isModelLoaded;
};

// Get debug information about registered students
export const getDebugInfo = () => {
  return {
    isModelLoaded,
    registeredStudents: Array.from(faceDescriptors.keys()),
    totalDescriptors: Array.from(faceDescriptors.values()).reduce((sum, descs) => sum + descs.length, 0)
  };
};
