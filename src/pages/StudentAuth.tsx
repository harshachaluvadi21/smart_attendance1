import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createStudent, ensureDemoSeed, listSections, setSession, verifyStudentLogin } from "@/lib/store";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

const StudentAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(() => {
    const urlMode = searchParams.get("mode");
    return urlMode === "login" ? "login" : "signup";
  });
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [sectionId, setSectionId] = useState<string>("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [consentFaceData, setConsentFaceData] = useState(false);
  const [consentParentNotify, setConsentParentNotify] = useState(false);
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");

  const [sections, setSections] = useState(() => listSections());
  
  // Reset step when mode changes
  useEffect(() => {
    setStep(1);
  }, [mode]);
  
  useEffect(() => {
    ensureDemoSeed();
    setSections(listSections());
    const onStorage = (e: StorageEvent) => {
      if (e.key === "smartattend-db") {
        setSections(listSections());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      const user = verifyStudentLogin(rollNumber, password);
      if (!user) {
        alert("Invalid roll number or password");
        return;
      }
      setSession({ role: "student", userId: user.id });
      navigate("/student");
      return;
    }

    if (step === 1) {
      if (!name || !rollNumber || !sectionId || !department || !password) {
        alert("Please fill all fields");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      const phoneOk = /^\d{10}$/.test(guardianPhone);
      if (!phoneOk || !consentFaceData || !consentParentNotify) {
        alert("Please provide guardian phone and give consents to proceed.");
        return;
      }
      try {
        const created = createStudent({ name, email, rollNumber, sectionId, guardianPhone, alternatePhone, consentFaceData, consentParentNotify, department, password });
        setSession({ role: "student", userId: created.id });
        navigate("/student");
      } catch (err: any) {
        alert(err?.message || "Signup failed");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Student Image */}
        <div className="hidden lg:block">
          <div className="text-center">
            <img 
              src="/Learning-cuate.png" 
              alt="Student Learning" 
              className="w-full max-w-lg mx-auto"
            />
            <h3 className="text-2xl font-semibold text-gray-800 mt-4">Join SmartAttend</h3>
            <p className="text-gray-600 mt-2">Experience seamless attendance tracking with AI technology</p>
          </div>
        </div>
        
        {/* Registration Form */}
        <div className="w-full max-w-xl mx-auto lg:mx-0">
          <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Student {mode === "signup" ? "Sign Up" : "Login"}</CardTitle>
            <CardDescription>Enter your details to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="mb-2">
                  <Progress value={step === 1 ? 50 : 100} />
                </div>
              )}
              {mode === "signup" && (
                <>
                  {step === 1 && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dept">Department</Label>
                        <Input id="dept" value={department} onChange={(e) => setDepartment(e.target.value)} required />
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="roll">Roll Number</Label>
                <Input id="roll" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pwd">Password</Label>
                <Input id="pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              {mode === "signup" && step === 1 && (
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={sectionId} onValueChange={setSectionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {mode === "signup" && step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="gphone">Parent/Guardian Phone</Label>
                    <Input id="gphone" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="altphone">Alternate Phone (optional)</Label>
                    <Input id="altphone" value={alternatePhone} onChange={(e) => setAlternatePhone(e.target.value)} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="consentFace" checked={consentFaceData} onCheckedChange={(v) => setConsentFaceData(Boolean(v))} />
                    <Label htmlFor="consentFace">I consent to face data being used for attendance</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="consentNotif" checked={consentParentNotify} onCheckedChange={(v) => setConsentParentNotify(Boolean(v))} />
                    <Label htmlFor="consentNotif">I consent to parent/guardian notifications</Label>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button type="submit">{mode === "signup" ? (step === 1 ? "Next" : "Finish") : "Continue"}</Button>
                <button
                  type="button"
                  className="text-sm text-muted-foreground underline"
                  onClick={() => setMode(mode === "signup" ? "login" : "signup")}
                >
                  Switch to {mode === "signup" ? "Login" : "Sign Up"}
                </button>
              </div>
            </form>

            <div className="text-center mt-6 text-sm">
              <Link to="/">Back to Home</Link>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentAuth;


