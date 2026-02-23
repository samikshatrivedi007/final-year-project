import api from './api';

export const authService = {
    login: async (data: { identifier: string; password: string }) => {
        const res = await api.post('/auth/login', { identifier: data.identifier, password: data.password });
        return res.data;
    },
    register: async (data: {
        username: string; rollOrId: string; phone?: string; password: string;
        role: string; course?: string; branch?: string; name?: string; semester?: number; department?: string;
    }) => {
        const res = await api.post('/auth/register', data);
        return res.data;
    },
    // Public: get branches filtered by course (no auth needed)
    getBranches: async (course?: string): Promise<{ _id: string; name: string; course: string }[]> => {
        const res = await api.get('/auth/branches', { params: course ? { course } : {} });
        return res.data;
    },
    getMe: async () => {
        const res = await api.get('/auth/me');
        return res.data;
    },
};

export const settingsService = {
    changePassword: async (data: { oldPassword: string; newPassword: string }) =>
        (await api.patch('/auth/change-password', data)).data,
    updateProfile: async (data: { phone?: string; profileImage?: string }) =>
        (await api.patch('/auth/update-profile', data)).data,
    deleteAccount: async (data: { password: string }) =>
        (await api.delete('/auth/delete-account', { data })).data,
};

export const studentService = {
    getDashboard: async () => (await api.get('/student/dashboard')).data,
    getTimetable: async () => (await api.get('/student/timetable')).data,
    getAssignments: async () => (await api.get('/student/assignments')).data,
    uploadFile: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data.fileUrl as string;
    },
    submitAssignment: async (id: string, fileUrl: string) =>
        (await api.post(`/student/assignments/${id}/submit`, { fileUrl })).data,
    getAttendance: async () => (await api.get('/student/attendance')).data,
    getMarks: async () => (await api.get('/student/marks')).data,
};

export const facultyService = {
    getDashboard: async () => (await api.get('/faculty/dashboard')).data,
    getSchedule: async () => (await api.get('/faculty/schedule')).data,
    getAssignments: async () => (await api.get('/faculty/assignments')).data,
    createAssignment: async (data: { courseId: string; course: string; branch: string; title: string; description: string; dueDate: string }) =>
        (await api.post('/faculty/assignments', data)).data,
    markAttendance: async (data: { courseId: string; timetableId?: string; records: { studentId: string; status: string }[] }) =>
        (await api.post('/faculty/attendance/mark', data)).data,
    toggleLive: async (id: string) => (await api.patch(`/faculty/timetable/${id}/live`)).data,
    getSubmissions: async (id: string) => (await api.get(`/faculty/assignments/${id}/submissions`)).data,
    gradeSubmission: async (id: string, data: { studentId: string; grade: number; feedback: string }) =>
        (await api.patch(`/faculty/assignments/${id}/grade`, data)).data,
    // Updated: accepts both course and branch
    getStudentsByCourseAndBranch: async (course: string, branch: string) =>
        (await api.get('/faculty/students-by-branch', { params: { course, branch } })).data,
    getCourses: async () => (await api.get('/faculty/courses')).data,
};

export const adminService = {
    getDashboard: async () => (await api.get('/admin/dashboard')).data,
    getStudents: async () => (await api.get('/admin/students')).data,
    searchStudent: async (q: string) => (await api.get('/admin/students/search', { params: { q } })).data,
    createStudent: async (data: object) => (await api.post('/admin/students', data)).data,
    updateStudent: async (id: string, data: object) => (await api.put(`/admin/students/${id}`, data)).data,
    deleteStudent: async (id: string) => (await api.delete(`/admin/students/${id}`)).data,
    getStudentMarks: async (studentId: string) => (await api.get(`/admin/students/${studentId}/marks`)).data,
    updateStudentMarks: async (studentId: string, data: object) => (await api.patch(`/admin/students/${studentId}/marks`, data)).data,
    bulkUpdateMarks: async (data: { totalMarks?: number; averageMarks?: number }) => (await api.patch(`/admin/students/marks/bulk`, data)).data,
    getFaculty: async () => (await api.get('/admin/faculty')).data,
    createFaculty: async (data: object) => (await api.post('/admin/faculty', data)).data,
    updateFaculty: async (id: string, data: object) => (await api.put(`/admin/faculty/${id}`, data)).data,
    deleteFaculty: async (id: string) => (await api.delete(`/admin/faculty/${id}`)).data,
    getAnalytics: async () => (await api.get('/admin/analytics')).data,
    // Timetable (supports course+branch filters)
    getTimetable: async (course?: string, branch?: string) => {
        const params: Record<string, string> = {};
        if (course && course !== 'all') params.course = course;
        if (branch && branch !== 'all') params.branch = branch;
        return (await api.get('/admin/timetable', { params })).data;
    },
    createTimetableEntry: async (data: object) => (await api.post('/admin/timetable', data)).data,
    updateTimetableEntry: async (id: string, data: object) => (await api.put(`/admin/timetable/${id}`, data)).data,
    deleteTimetableEntry: async (id: string) => (await api.delete(`/admin/timetable/${id}`)).data,
    getTeacherSchedule: async () => (await api.get('/admin/teacher-schedule')).data,
    // Courses
    getCourses: async () => (await api.get('/admin/courses')).data,
    createCourse: async (data: object) => (await api.post('/admin/courses', data)).data,
    updateCourse: async (id: string, data: object) => (await api.put(`/admin/courses/${id}`, data)).data,
    deleteCourse: async (id: string) => (await api.delete(`/admin/courses/${id}`)).data,
    // Branch management
    getBranches: async (course?: string): Promise<{ _id: string; name: string; course: string }[]> =>
        (await api.get('/admin/branches', { params: course ? { course } : {} })).data,
    createBranch: async (data: { name: string; course: string; description?: string }) =>
        (await api.post('/admin/branches', data)).data,
    updateBranch: async (id: string, data: object) => (await api.put(`/admin/branches/${id}`, data)).data,
    deleteBranch: async (id: string) => (await api.delete(`/admin/branches/${id}`)).data,
    // Superadmin: manage college admins
    getAdmins: async () => (await api.get('/admin/admins')).data,
    deleteAdminUser: async (id: string) => (await api.delete(`/admin/admins/${id}`)).data,
};
