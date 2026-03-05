import apiService from './callApi';

const userService = {
    register: (userData) => {
        return apiService.post('/auth/register', userData);
    },
    
    login: (credentials) => {
        return apiService.post('/auth/login', credentials);
    },

    getStorageStats: () => {
        return apiService.get('/auth/stats');
    },

    getMe: () => {
        return apiService.get('/auth/me');
    },

    registerFace: (faceData) => {
        return apiService.post('/auth/register-face', faceData);
    },

    loginWithFace: (faceData) => {
        return apiService.post('/auth/login-face', faceData);
    },

    // --- Bổ sung mới ---
    countFace: (username) => {
        // Gửi username trong body nếu cần, hoặc để trống nếu backend lấy từ token
        return apiService.post('/auth/face/count', { username });
    },

    clearFace: (username) => {
        // Sử dụng phương thức delete để xóa toàn bộ mẫu mặt
        return apiService.delete('/auth/face/clear');
    },
    // ------------------

    updateProfile: (userData, userId = null) => {
        const url = userId ? `/auth/update?id=${userId}` : '/auth/update';
        const config = {};
        if (userData instanceof FormData) {
            config.headers = { 'Content-Type': 'multipart/form-data' };
        }
        return apiService.put(url, userData, config);
    },

    getAllUsers: () => {
        return apiService.get('/auth/all');
    },

    deleteUser: (userId) => {
        return apiService.delete(`/auth/${userId}`);
    }
};

export default userService;