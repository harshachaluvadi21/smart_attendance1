/**
 * OpenCV-based Face Recognition System
 * Implements the flowchart: Capture -> Detect (Haar) -> Preprocess -> Train KNN -> Recognize -> Mark Attendance
 */

import cv from 'opencv-ts';

// Face recognition state
let isModelLoaded = false;
let faceCascade: any = null;
let knnModel: any = null;
let faceData: Map<string, number[]> = new Map(); // studentId -> face features
let studentLabels: string[] = [];
let faceFeatures: number[][] = [];

// Initialize OpenCV and load Haar Cascade
export const initializeOpenCV = async (): Promise<boolean> => {
  try {
    if (isModelLoaded) return true;

    // Initialize OpenCV
    await cv.ready;
    
    // Load Haar Cascade for face detection
    faceCascade = new cv.CascadeClassifier();
    await faceCascade.load('haarcascade_frontalface_default.xml');
    
    // Initialize KNN model
    knnModel = new cv.ml.KNearest();
    
    isModelLoaded = true;
    console.log('✅ OpenCV face recognition initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing OpenCV:', error);
    return false;
  }
};

// Preprocess face image
const preprocessFace = (src: any): any => {
  try {
    // Convert to grayscale
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    // Resize to standard size
    const resized = new cv.Mat();
    cv.resize(gray, resized, new cv.Size(100, 100));
    
    // Normalize
    const normalized = new cv.Mat();
    cv.normalize(resized, normalized, 0, 255, cv.NORM_MINMAX);
    
    // Clean up
    gray.delete();
    resized.delete();
    
    return normalized;
  } catch (error) {
    console.error('❌ Error preprocessing face:', error);
    return null;
  }
};

// Extract face features (simplified - using pixel values as features)
const extractFeatures = (faceImage: any): number[] => {
  try {
    const features: number[] = [];
    const data = faceImage.data;
    
    // Sample pixels as features (you can use more sophisticated feature extraction)
    for (let i = 0; i < data.length; i += 4) { // Skip every 4th pixel for efficiency
      features.push(data[i] / 255.0); // Normalize to 0-1
    }
    
    return features;
  } catch (error) {
    console.error('❌ Error extracting features:', error);
    return [];
  }
};

// Detect faces in image
export const detectFaces = async (imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<any[]> => {
  try {
    if (!isModelLoaded) {
      await initializeOpenCV();
    }

    // Convert HTML element to OpenCV Mat
    const src = cv.imread(imageElement);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    // Detect faces
    const faces = new cv.RectVector();
    const msize = new cv.Size(0, 0);
    faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, msize, msize);
    
    const detectedFaces: any[] = [];
    for (let i = 0; i < faces.size(); i++) {
      const face = faces.get(i);
      const faceROI = gray.roi(face);
      const processedFace = preprocessFace(faceROI);
      
      if (processedFace) {
        detectedFaces.push({
          rect: face,
          image: processedFace,
          features: extractFeatures(processedFace)
        });
      }
      
      faceROI.delete();
      processedFace?.delete();
    }
    
    // Clean up
    src.delete();
    gray.delete();
    faces.delete();
    
    console.log(`🔍 Detected ${detectedFaces.length} faces`);
    return detectedFaces;
  } catch (error) {
    console.error('❌ Error detecting faces:', error);
    return [];
  }
};

// Register a student's face
export const registerStudentFace = async (studentId: string, imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<boolean> => {
  try {
    const faces = await detectFaces(imageElement);
    
    if (faces.length === 0) {
      console.warn('⚠️ No faces detected in image');
      return false;
    }

    // Use the first detected face
    const face = faces[0];
    const features = face.features;
    
    // Store face features for this student
    faceData.set(studentId, features);
    
    // Add to training data
    studentLabels.push(studentId);
    faceFeatures.push(features);
    
    console.log(`✅ Face registered for student ${studentId}`);
    return true;
  } catch (error) {
    console.error('❌ Error registering face:', error);
    return false;
  }
};

// Train KNN model
export const trainKNNModel = async (): Promise<boolean> => {
  try {
    if (faceFeatures.length === 0) {
      console.warn('⚠️ No face data available for training');
      return false;
    }

    // Convert to OpenCV format
    const trainData = new cv.Mat(faceFeatures.length, faceFeatures[0].length, cv.CV_32F);
    const labels = new cv.Mat(faceFeatures.length, 1, cv.CV_32S);
    
    // Fill training data
    for (let i = 0; i < faceFeatures.length; i++) {
      for (let j = 0; j < faceFeatures[i].length; j++) {
        trainData.floatPtr(i, j)[0] = faceFeatures[i][j];
      }
      labels.intPtr(i, 0)[0] = i; // Use index as label
    }
    
    // Train KNN model
    knnModel.train(trainData, cv.ml.ROW_SAMPLE, labels);
    
    // Clean up
    trainData.delete();
    labels.delete();
    
    console.log(`✅ KNN model trained with ${faceFeatures.length} samples`);
    return true;
  } catch (error) {
    console.error('❌ Error training KNN model:', error);
    return false;
  }
};

// Recognize faces in an image
export const recognizeFaces = async (imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<{ studentId: string; confidence: number }[]> => {
  try {
    if (!knnModel || faceFeatures.length === 0) {
      console.warn('⚠️ KNN model not trained yet');
      return [];
    }

    const faces = await detectFaces(imageElement);
    const recognitions: { studentId: string; confidence: number }[] = [];

    for (const face of faces) {
      const features = face.features;
      
      // Convert features to OpenCV format
      const testData = new cv.Mat(1, features.length, cv.CV_32F);
      for (let i = 0; i < features.length; i++) {
        testData.floatPtr(0, i)[0] = features[i];
      }
      
      // Predict using KNN
      const result = new cv.Mat();
      const neighborResponses = new cv.Mat();
      const distances = new cv.Mat();
      
      knnModel.findNearest(testData, 1, result, neighborResponses, distances);
      
      const predictedIndex = result.intPtr(0, 0)[0];
      const distance = distances.floatPtr(0, 0)[0];
      
      // Convert distance to confidence (lower distance = higher confidence)
      const confidence = Math.max(0, 1 - (distance / 100)); // Adjust divisor as needed
      
      if (confidence > 0.5 && predictedIndex < studentLabels.length) {
        const studentId = studentLabels[predictedIndex];
        recognitions.push({ studentId, confidence });
        console.log(`✅ Recognized: ${studentId} (confidence: ${confidence.toFixed(3)})`);
      }
      
      // Clean up
      testData.delete();
      result.delete();
      neighborResponses.delete();
      distances.delete();
    }

    return recognitions;
  } catch (error) {
    console.error('❌ Error recognizing faces:', error);
    return [];
  }
};

// Save face data to localStorage
export const saveFaceData = (): void => {
  try {
    const data = {
      faceData: Array.from(faceData.entries()),
      studentLabels,
      faceFeatures
    };
    localStorage.setItem('opencv-face-data', JSON.stringify(data));
    console.log('✅ Face data saved to localStorage');
  } catch (error) {
    console.error('❌ Error saving face data:', error);
  }
};

// Load face data from localStorage
export const loadFaceData = (): boolean => {
  try {
    const data = localStorage.getItem('opencv-face-data');
    if (!data) return false;
    
    const parsed = JSON.parse(data);
    faceData = new Map(parsed.faceData);
    studentLabels = parsed.studentLabels;
    faceFeatures = parsed.faceFeatures;
    
    console.log(`✅ Face data loaded: ${faceData.size} students, ${faceFeatures.length} samples`);
    return true;
  } catch (error) {
    console.error('❌ Error loading face data:', error);
    return false;
  }
};

// Mark attendance in CSV (following flowchart: csv + datetime)
export const markAttendance = (studentId: string, studentName: string): void => {
  try {
    const timestamp = new Date().toISOString();
    const attendanceRecord = {
      studentId,
      studentName,
      timestamp,
      status: 'Present'
    };
    
    // Get existing attendance data
    const existingData = localStorage.getItem('attendance-records');
    const records = existingData ? JSON.parse(existingData) : [];
    
    // Add new record
    records.push(attendanceRecord);
    
    // Save back to localStorage
    localStorage.setItem('attendance-records', JSON.stringify(records));
    
    console.log(`✅ Attendance marked for ${studentName} (${studentId})`);
    
    // Give feedback using TTS (following flowchart: win32com TTS)
    giveFeedback(studentName);
  } catch (error) {
    console.error('❌ Error marking attendance:', error);
  }
};

// Give feedback using Text-to-Speech (following flowchart: win32com TTS)
export const giveFeedback = (studentName: string): void => {
  try {
    // Use Web Speech API for TTS (browser equivalent of win32com TTS)
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(`Attendance marked for ${studentName}`);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
      console.log(`🔊 TTS Feedback: Attendance marked for ${studentName}`);
    } else {
      console.log(`📢 Feedback: Attendance marked for ${studentName}`);
    }
  } catch (error) {
    console.error('❌ Error giving feedback:', error);
  }
};

// Get attendance records
export const getAttendanceRecords = (): any[] => {
  try {
    const data = localStorage.getItem('attendance-records');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('❌ Error getting attendance records:', error);
    return [];
  }
};

// Export attendance to CSV (following flowchart: csv + datetime)
export const exportAttendanceToCSV = (): void => {
  try {
    const records = getAttendanceRecords();
    if (records.length === 0) {
      console.log('No attendance records to export');
      return;
    }

    // Create CSV content
    const headers = ['Student ID', 'Student Name', 'Timestamp', 'Status'];
    const csvContent = [
      headers.join(','),
      ...records.map(record => [
        record.studentId,
        `"${record.studentName}"`,
        record.timestamp,
        record.status
      ].join(','))
    ].join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ Attendance exported to CSV');
  } catch (error) {
    console.error('❌ Error exporting attendance to CSV:', error);
  }
};

// Check if models are loaded
export const isOpenCVModelLoaded = (): boolean => {
  return isModelLoaded;
};

// Get debug information
export const getOpenCVDebugInfo = () => {
  return {
    isModelLoaded,
    registeredStudents: Array.from(faceData.keys()),
    totalSamples: faceFeatures.length,
    knnTrained: knnModel !== null
  };
};
