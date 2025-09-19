// Simple localStorage-backed data store and types

export type Role = "student" | "teacher";

export interface Subject {
  id: string;
  name: string;
}

export interface Section {
  id: string;
  name: string; // e.g., CSE-A, CSE-B
  subjectIds: string[]; // subjects offered in this section
  teacherIds: string[]; // teachers assigned to this section
}

export interface BaseUser {
  id: string;
  name: string;
  email: string;
}

export interface Teacher extends BaseUser {
  role: "teacher";
  employeeId: string;
  sectionIds: string[];
  department?: string;
  phone?: string;
  password?: string;
}

export interface Student extends BaseUser {
  role: "student";
  rollNumber: string;
  sectionId: string;
  faceRegistered: boolean;
  guardianPhone?: string;
  alternatePhone?: string;
  consentFaceData?: boolean;
  consentParentNotify?: boolean;
  department?: string;
  password?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  subjectId: string;
  teacherId: string;
  sectionId: string;
  timestamp: number;
  period: number; // 1..8
  topic?: string;
  present: boolean;
}

export interface TopicLog {
  id: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  period: number;
  timestamp: number;
  title: string;
  resources?: string;
  homework?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: Role;
  action: string;
  target?: string;
  timestamp: number;
  details?: Record<string, unknown>;
}

export interface NotificationSettings {
  absentNotifyMode: "every" | "consecutive" | "threshold" | "off";
  consecutiveAbsences?: number;
  percentThreshold?: number;
}

export interface Database {
  subjects: Record<string, Subject>;
  sections: Record<string, Section>;
  students: Record<string, Student>;
  teachers: Record<string, Teacher>;
  attendance: Record<string, AttendanceRecord>;
  session: { role: Role; userId: string } | null;
  topics: Record<string, TopicLog>;
  audits: Record<string, AuditLog>;
  settings: { notifications: NotificationSettings };
}

const STORAGE_KEY = "smartattend-db";

function generateId(prefix: string = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function readDb(): Database {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial: Database = {
      subjects: {},
      sections: {},
      students: {},
      teachers: {},
      attendance: {},
      session: null,
      topics: {},
      audits: {},
      settings: { notifications: { absentNotifyMode: "off" } },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw) as Database;
  } catch {
    const empty: Database = {
      subjects: {},
      sections: {},
      students: {},
      teachers: {},
      attendance: {},
      session: null,
      topics: {},
      audits: {},
      settings: { notifications: { absentNotifyMode: "off" } },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
    return empty;
  }
}

function writeDb(db: Database): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// Session helpers
export function getSession(): Database["session"] {
  return readDb().session;
}

export function setSession(session: Database["session"]): void {
  const db = readDb();
  db.session = session;
  writeDb(db);
}

export function clearSession(): void {
  const db = readDb();
  db.session = null;
  writeDb(db);
}

// Teacher CRUD
export function createTeacher(input: Omit<Teacher, "id" | "role" | "sectionIds"> & { sectionIds?: string[] }): Teacher {
  const db = readDb();
  // enforce unique employeeId
  const exists = Object.values(db.teachers).some(t => t.employeeId.toLowerCase() === input.employeeId.toLowerCase());
  if (exists) throw new Error("Teacher ID already exists");
  const id = generateId("teacher");
  const teacher: Teacher = {
    id,
    role: "teacher",
    name: input.name,
    email: input.email,
    employeeId: input.employeeId,
    sectionIds: input.sectionIds ?? [],
    department: (input as any).department,
    phone: (input as any).phone,
    password: (input as any).password,
  };
  db.teachers[id] = teacher;
  writeDb(db);
  return teacher;
}

export function findTeacherByEmail(email: string): Teacher | undefined {
  const db = readDb();
  return Object.values(db.teachers).find(t => t.email.toLowerCase() === email.toLowerCase());
}

export function assignTeacherToSection(teacherId: string, sectionId: string): void {
  const db = readDb();
  const teacher = db.teachers[teacherId];
  const section = db.sections[sectionId];
  if (!teacher || !section) return;
  if (!teacher.sectionIds.includes(sectionId)) teacher.sectionIds.push(sectionId);
  if (!section.teacherIds.includes(teacherId)) section.teacherIds.push(teacherId);
  writeDb(db);
}

// Student CRUD
export function createStudent(input: Omit<Student, "id" | "role" | "faceRegistered"> & { faceRegistered?: boolean }): Student {
  const db = readDb();
  // enforce unique rollNumber
  const exists = Object.values(db.students).some(s => s.rollNumber.toLowerCase() === input.rollNumber.toLowerCase());
  if (exists) throw new Error("Roll number already exists");
  const id = generateId("student");
  const student: Student = {
    id,
    role: "student",
    name: input.name,
    email: input.email,
    rollNumber: input.rollNumber,
    sectionId: input.sectionId,
    faceRegistered: input.faceRegistered ?? false,
    guardianPhone: (input as any).guardianPhone,
    alternatePhone: (input as any).alternatePhone,
    consentFaceData: (input as any).consentFaceData,
    consentParentNotify: (input as any).consentParentNotify,
    department: (input as any).department,
    password: (input as any).password,
  };
  db.students[id] = student;
  writeDb(db);
  return student;
}

export function verifyStudentLogin(rollNumber: string, password: string) {
  const db = readDb();
  const s = Object.values(db.students).find(st => st.rollNumber.toLowerCase() === rollNumber.toLowerCase());
  if (!s || s.password !== password) return undefined;
  return s;
}

export function verifyTeacherLogin(employeeId: string, password: string) {
  const db = readDb();
  const t = Object.values(db.teachers).find(th => th.employeeId.toLowerCase() === employeeId.toLowerCase());
  if (!t || t.password !== password) return undefined;
  return t;
}

export function updateStudent(studentId: string, updates: Partial<Omit<Student, "id" | "role">>): Student | undefined {
  const db = readDb();
  const existing = db.students[studentId];
  if (!existing) return undefined;
  db.students[studentId] = { ...existing, ...updates };
  writeDb(db);
  return db.students[studentId];
}

export function findStudentByRoll(rollNumber: string): Student | undefined {
  const db = readDb();
  return Object.values(db.students).find(s => s.rollNumber.toLowerCase() === rollNumber.toLowerCase());
}

export function listStudentsBySection(sectionId: string): Student[] {
  const db = readDb();
  return Object.values(db.students).filter(s => s.sectionId === sectionId);
}

// Section & Subject CRUD
export function createSection(name: string): Section {
  const db = readDb();
  
  // Check if section with same name already exists
  const existingSection = Object.values(db.sections).find(s => s.name.toLowerCase() === name.toLowerCase());
  if (existingSection) {
    throw new Error("Section with this name already exists");
  }
  
  const id = generateId("section");
  const section: Section = { id, name, subjectIds: [], teacherIds: [] };
  db.sections[id] = section;
  writeDb(db);
  return section;
}

export function listSections(): Section[] {
  return Object.values(readDb().sections);
}

export function createSubject(name: string): Subject {
  const db = readDb();
  const id = generateId("subject");
  const subject: Subject = { id, name };
  db.subjects[id] = subject;
  writeDb(db);
  return subject;
}

export function listSubjects(): Subject[] {
  return Object.values(readDb().subjects);
}

export function addSubjectToSection(sectionId: string, subjectId: string): void {
  const db = readDb();
  const section = db.sections[sectionId];
  if (!section) return;
  if (!section.subjectIds.includes(subjectId)) section.subjectIds.push(subjectId);
  writeDb(db);
}

export function getSubjectsForSection(sectionId: string): Subject[] {
  const db = readDb();
  const section = db.sections[sectionId];
  if (!section) return [];
  return section.subjectIds.map(id => db.subjects[id]).filter(Boolean);
}

export function deleteSubject(subjectId: string): boolean {
  const db = readDb();
  if (!db.subjects[subjectId]) return false;
  
  // Remove subject from all sections
  Object.values(db.sections).forEach(section => {
    section.subjectIds = section.subjectIds.filter(id => id !== subjectId);
  });
  
  // Delete the subject
  delete db.subjects[subjectId];
  writeDb(db);
  return true;
}

export function deleteSection(sectionId: string): boolean {
  const db = readDb();
  if (!db.sections[sectionId]) return false;
  
  // Remove section from all teachers
  Object.values(db.teachers).forEach(teacher => {
    teacher.sectionIds = teacher.sectionIds.filter(id => id !== sectionId);
  });
  
  // Delete the section
  delete db.sections[sectionId];
  writeDb(db);
  return true;
}

export function removeSubjectFromSection(sectionId: string, subjectId: string): boolean {
  const db = readDb();
  const section = db.sections[sectionId];
  if (!section) return false;
  
  section.subjectIds = section.subjectIds.filter(id => id !== subjectId);
  writeDb(db);
  return true;
}

// Attendance
export function addAttendance(record: Omit<AttendanceRecord, "id" | "timestamp"> & { timestamp?: number }): AttendanceRecord {
  const db = readDb();
  const id = generateId("attend");
  const att: AttendanceRecord = { id, timestamp: record.timestamp ?? Date.now(), ...record };
  db.attendance[id] = att;
  // simple audit stub
  try {
    const actorId = db.session?.userId || "system";
    const actorRole = db.session?.role || "teacher";
    const audits = db.audits || {};
    const auditId = generateId("audit");
    audits[auditId] = {
      id: auditId,
      actorId,
      actorRole,
      action: "add_attendance",
      target: record.studentId,
      timestamp: Date.now(),
      details: { subjectId: record.subjectId, sectionId: record.sectionId, period: record.period, present: record.present },
    } as any;
    db.audits = audits;
  } catch {}
  writeDb(db);
  return att;
}

export function getAttendanceForStudent(studentId: string): AttendanceRecord[] {
  const db = readDb();
  return Object.values(db.attendance).filter(a => a.studentId === studentId);
}

// Utility to bootstrap demo data if empty
export function ensureDemoSeed(): void {
  const db = readDb();
  if (Object.keys(db.sections).length > 0) return;

  const s1 = createSection("CSE-A");
  const s2 = createSection("CSE-B");
  const sub1 = createSubject("Mathematics");
  const sub2 = createSubject("Data Structures");
  const sub3 = createSubject("Operating Systems");
  addSubjectToSection(s1.id, sub1.id);
  addSubjectToSection(s1.id, sub2.id);
  addSubjectToSection(s2.id, sub2.id);
  addSubjectToSection(s2.id, sub3.id);
  
  // Add demo students
  try {
    createStudent({
      name: "John Doe",
      email: "john@example.com",
      rollNumber: "CSE001",
      sectionId: s1.id,
      faceRegistered: true
    });
    
    createStudent({
      name: "Jane Smith",
      email: "jane@example.com", 
      rollNumber: "CSE002",
      sectionId: s1.id,
      faceRegistered: true
    });
    
    createStudent({
      name: "Mike Johnson",
      email: "mike@example.com",
      rollNumber: "CSE003", 
      sectionId: s2.id,
      faceRegistered: true
    });
    
    console.log('✅ Demo students created');
  } catch (error) {
    console.log('Demo students already exist or error creating them');
  }
}


