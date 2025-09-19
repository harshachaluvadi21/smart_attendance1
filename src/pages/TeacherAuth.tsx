import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { assignTeacherToSection, createTeacher, ensureDemoSeed, listSections, setSession, verifyTeacherLogin } from "@/lib/store";
import { Progress } from "@/components/ui/progress";

const TeacherAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(() => {
    const urlMode = searchParams.get("mode");
    return urlMode === "login" ? "login" : "signup";
  });
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [sectionId, setSectionId] = useState<string>("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    ensureDemoSeed();
  }, []);

  const sections = useMemo(() => listSections(), []);
  
  // Reset step when mode changes
  useEffect(() => {
    setStep(1);
  }, [mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      const user = verifyTeacherLogin(employeeId, password);
      if (!user) { alert("Invalid Teacher ID or password"); return; }
      setSession({ role: "teacher", userId: user.id });
      navigate("/teacher");
      return;
    }

    if (step === 1) {
      const phoneOk = /^\d{10}$/.test(phone);
      if (!name || !employeeId || !department || !password || !phoneOk) {
        alert("Please fill all fields");
        return;
      }
      setStep(2);
      return;
    }
    try {
      const created = createTeacher({ name, email, employeeId, sectionIds: sectionId ? [sectionId] : [], department, phone, password });
      if (sectionId) assignTeacherToSection(created.id, sectionId);
      setSession({ role: "teacher", userId: created.id });
      navigate("/teacher");
    } catch (err: any) {
      alert(err?.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Teacher Image */}
        <div className="hidden lg:block">
          <div className="text-center">
            <img 
              src="/Teacher.jpg" 
              alt="Teacher Teaching" 
              className="w-full max-w-lg mx-auto"
            />
            <h3 className="text-2xl font-semibold text-gray-800 mt-4">Welcome Teachers</h3>
            <p className="text-gray-600 mt-2">Manage attendance and track student progress with ease</p>
          </div>
        </div>
        
        {/* Registration Form */}
        <div className="w-full max-w-xl mx-auto lg:mx-0 lg:ml-8">
          <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Teacher {mode === "signup" ? "Sign Up" : "Login"}</CardTitle>
            <CardDescription>Enter your details to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <Progress value={step === 1 ? 50 : 100} />
              )}
              {mode === "signup" && (
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
              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="eid">Employee ID</Label>
                    <Input id="eid" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (10 digits)</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pwd">Password</Label>
                    <Input id="pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  {step === 2 && (
                    <div className="space-y-2">
                      <Label>Assign Section (optional)</Label>
                      <Select value={sectionId} onValueChange={setSectionId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
              {mode === "login" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="eid2">Teacher ID</Label>
                    <Input id="eid2" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pwd2">Password</Label>
                    <Input id="pwd2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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

export default TeacherAuth;


