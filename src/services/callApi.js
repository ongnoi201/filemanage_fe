import apiInstance from '../utils/apiInstance';

const apiService = {
    // Method có thể là 'get', 'post', 'put', 'delete', 'patch'
    request(method, url, data = null, config = {}) {
        return apiInstance({
            method,
            url,
            data: method === 'get' ? null : data,
            params: method === 'get' ? data : null,
            ...config, // Cho phép ghi đè header nếu cần trường hợp đặc biệt
        });
    },

    get: (url, params) => apiService.request('get', url, params),
    post: (url, data) => apiService.request('post', url, data),
    put: (url, data) => apiService.request('put', url, data),
    patch: (url, data) => apiService.request('patch', url, data),
    delete: (url) => apiService.request('delete', url),
};

export default apiService;