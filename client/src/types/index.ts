export interface User {
    id: string;
    username: string;
    role: 'student' | 'faculty' | 'admin' | 'superadmin';
    rollOrId: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    role: string | null;
    isAuthenticated: boolean;
}

export interface TimetableEntry {
    _id: string;
    courseId: { _id: string; name: string; code: string };
    facultyId: { _id: string; name: string };
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string;
    isLive: boolean;
    lectureNumber: number;
}

export interface Assignment {
    _id: string;
    courseId: { _id: string; name: string };
    title: string;
    description: string;
    dueDate: string;
    submissions: { studentId: string; submittedAt: string; grade?: number }[];
}

export interface StudentDashboardData {
    student: { name: string; rollNo: string; semester: number; branch: string };
    timetable: TimetableEntry[];
    pendingAssignments: Assignment[];
    attendanceRate: number;
    happeningNow: TimetableEntry | null;
}

export interface FacultyDashboardData {
    faculty: { name: string; employeeId: string; department: string };
    schedule: TimetableEntry[];
    assignments: Assignment[];
    totalSubmissions: number;
    happeningNow: TimetableEntry | null;
}

export interface AdminDashboardData {
    totalStudents: number;
    totalFaculty: number;
    attendanceRate: number;
    recentStudents: { username: string; rollOrId: string; createdAt: string }[];
    recentFaculty: { username: string; rollOrId: string; createdAt: string }[];
}
