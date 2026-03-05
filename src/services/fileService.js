import apiService from './callApi';

const fileService = {
    uploadFiles: (formData, onUploadProgress) => {
        return apiService.post('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress,
        });
    },

    getFiles: (folderId = null) => {
        return apiService.get('/files', { folderId });
    },

    renameFile: (id, newName) => {
        return apiService.patch(`/files/${id}/rename`, { name: newName });
    },

    moveFiles: (fileIds, targetFolderId) => {
        return apiService.post('/files/move', { fileIds, targetFolderId });
    },

    deleteItems: (ids) => {
        return apiService.post('/files/delete-items', { ids });
    },

    getRecentFiles: () => {
        return apiService.get('/files/recent');
    },
};

export default fileService;