import api from './api';

export const authService = {
    login: async (data: { rollOrId: string; username?: string; password: string }) => {
        const res = await api.post('/auth/login', data);
        return res.data;
    },
    register: async (data: { username: string; rollOrId: string; phone: string; password: string; role: string }) => {
        const res = await api.post('/auth/register', data);
        return res.data;
    },
    getMe: async () => {
        const res = await api.get('/auth/me');
        return res.data;
    },
};

export const studentService = {
    getDashboard: async () => (await api.get('/student/dashboard')).data,
    getTimetable: async () => (await api.get('/student/timetable')).data,
    getAssignments: async () => (await api.get('/student/assignments')).data,
    submitAssignment: async (id: string) => (await api.post(`/student/assignments/${id}/submit`)).data,
    getAttendance: async () => (await api.get('/student/attendance')).data,
};

export const facultyService = {
    getDashboard: async () => (await api.get('/faculty/dashboard')).data,
    getSchedule: async () => (await api.get('/faculty/schedule')).data,
    markAttendance: async (data: { courseId: string; records: { studentId: string; status: string }[] }) =>
        (await api.post('/faculty/attendance/mark', data)).data,
    toggleLive: async (id: string) => (await api.patch(`/faculty/timetable/${id}/live`)).data,
    getSubmissions: async (id: string) => (await api.get(`/faculty/assignments/${id}/submissions`)).data,
    gradeSubmission: async (id: string, data: { studentId: string; grade: number; feedback: string }) =>
        (await api.patch(`/faculty/assignments/${id}/grade`, data)).data,
};

export const adminService = {
    getDashboard: async () => (await api.get('/admin/dashboard')).data,
    getStudents: async () => (await api.get('/admin/students')).data,
    createStudent: async (data: object) => (await api.post('/admin/students', data)).data,
    updateStudent: async (id: string, data: object) => (await api.put(`/admin/students/${id}`, data)).data,
    deleteStudent: async (id: string) => (await api.delete(`/admin/students/${id}`)).data,
    getFaculty: async () => (await api.get('/admin/faculty')).data,
    createFaculty: async (data: object) => (await api.post('/admin/faculty', data)).data,
    updateFaculty: async (id: string, data: object) => (await api.put(`/admin/faculty/${id}`, data)).data,
    deleteFaculty: async (id: string) => (await api.delete(`/admin/faculty/${id}`)).data,
    getAnalytics: async () => (await api.get('/admin/analytics')).data,
};
