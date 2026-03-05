import axios from 'axios';

// Tạo một instance của axios
const apiInstance = axios.create({
    baseURL: 'https://filemanage-be.onrender.com/api', // Thay thế bằng URL của bạn
    timeout: 30000,
});

// Xử lý Request trước khi gửi đi (ví dụ: đính kèm Token)
apiInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Xử lý Response sau khi nhận về (ví dụ: bắt lỗi 401, 500)
apiInstance.interceptors.response.use(
    (response) => response.data, // Chỉ lấy dữ liệu trả về từ server
    (error) => {
        // Bạn có thể xử lý thông báo lỗi tập trung tại đây
        const message = error.response?.data?.message || 'Đã có lỗi xảy ra';
        console.error('API Error:', message);
        return Promise.reject(error);
    }
);

export default apiInstance;