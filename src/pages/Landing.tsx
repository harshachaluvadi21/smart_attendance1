import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Camera, Users, GraduationCap, BarChart3, Shield, Smartphone, Clock, CheckCircle } from "lucide-react";
import { useState } from "react";

const Landing = () => {
  const [showRoleModal, setShowRoleModal] = useState(false);

  const handleRegister = () => {
    setShowRoleModal(true);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-hero backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Camera className="h-8 w-8 text-white" />
              <h1 className="text-2xl font-bold text-white">SmartAttend</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={handleRegister} className="bg-white text-blue-600 hover:bg-white/90">
                Register
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gray-100 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center text-gray-800 space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold">
                Smart Attendance, Smarter Classrooms
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                AI-powered facial recognition attendance system that automates student tracking, 
                provides real-time analytics, and keeps parents informed.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <Camera className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-800">AI Face Recognition</h3>
                <p className="text-gray-600">Automated attendance using advanced facial recognition technology</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <Users className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Real-time Tracking</h3>
                <p className="text-gray-600">Live attendance monitoring with instant notifications</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <BarChart3 className="h-12 w-12 text-purple-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Analytics & Reports</h3>
                <p className="text-gray-600">Comprehensive attendance analytics and exportable reports</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <Shield className="h-12 w-12 text-yellow-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Secure & Private</h3>
                <p className="text-gray-600">Encrypted data storage with privacy-first approach</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <Smartphone className="h-12 w-12 text-pink-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Parent Notifications</h3>
                <p className="text-gray-600">Automatic SMS/WhatsApp alerts to parents</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <Clock className="h-12 w-12 text-orange-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Time Efficient</h3>
                <p className="text-gray-600">Save hours of manual attendance taking</p>
              </div>
            </div>

            {/* Key Benefits */}
            <div className="mt-16 space-y-8">
              <h2 className="text-3xl font-bold text-gray-800">Why Choose SmartAttend?</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800">For Students</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Quick and contactless attendance</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>View personal attendance history</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Access to section-specific subjects</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800">For Teachers</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Automated attendance sessions</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Manage sections and subjects</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Export detailed reports</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full relative">
            <h2 className="text-2xl font-bold text-center mb-6">
              Create Account
            </h2>
            <div className="space-y-4">
              <Link to="/student/auth?mode=signup" onClick={() => setShowRoleModal(false)}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Student Sign Up
                </Button>
              </Link>
              <Link to="/teacher/auth?mode=signup" onClick={() => setShowRoleModal(false)}>
                <Button variant="outline" className="w-full h-12">
                  <Users className="h-5 w-5 mr-2" />
                  Teacher Sign Up
                </Button>
              </Link>
            </div>
            
            {/* Login Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-center mb-4">Already have an account?</h3>
              <div className="space-y-3">
                <Link to="/student/auth?mode=login" onClick={() => setShowRoleModal(false)}>
                  <Button variant="outline" className="w-full h-10">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Student Login
                  </Button>
                </Link>
                <Link to="/teacher/auth?mode=login" onClick={() => setShowRoleModal(false)}>
                  <Button variant="outline" className="w-full h-10">
                    <Users className="h-4 w-4 mr-2" />
                    Teacher Login
                  </Button>
                </Link>
              </div>
            </div>
            
            <button
              onClick={() => setShowRoleModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;