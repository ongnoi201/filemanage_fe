import apiService from './callApi';

const folderService = {
    getFolders: (parentId = null) => {
        return apiService.get('/folders', { parentId });
    },
    createFolder: (name, parentId = null) => {
        return apiService.post('/folders', { 
            name: name.trim(), 
            parentId 
        });
    },
    renameFolder: (id, newName) => {
        return apiService.patch(`/folders/${id}/rename`, { 
            name: newName.trim() 
        });
    },
    moveFolder: (id, newParentId) => {
        return apiService.patch(`/folders/${id}/move`, { 
            newParentId 
        });
    },
    deleteFolder: (id) => {
        return apiService.delete(`/folders/${id}`);
    },
    searchAll: (q) => {
        return apiService.get('/folders/search', { q });
    }
};

export default folderService;