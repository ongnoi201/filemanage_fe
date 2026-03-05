import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { LayoutGrid, List, Loader2, Clock } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

// Components
import FileItem from '../components/FileItem';
import ActionDock from '../components/ActionDock';
import ImageViewer from '../components/ImageViewer';
import ConfirmModal from '../components/ConfirmModal';

// Services
import fileService from '../services/fileService';

export default function Recent() {
    // --- STATES ---
    const [viewMode, setViewMode] = useState('grid');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);

    // States cho Modals/Viewer
    const [viewerConfig, setViewerConfig] = useState({ isOpen: false, index: 0 });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, ids: [] });

    // --- FETCH DATA ---
    const loadData = async () => {
        try {
            setLoading(true);
            const response = await fileService.getRecentFiles();
            setFiles(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
            setFiles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // --- COMPUTED VALUES ---
    // Lọc danh sách chỉ chứa ảnh để dùng cho ImageViewer
    const imageFiles = useMemo(() => {
        // Sử dụng (files || []) để đảm bảo luôn có mảng để filter
        return (files || []).filter(f => f.type === 'file');
    }, [files]);

    const isSelectionMode = selectedIds.length > 0;

    // --- HANDLERS ---

    // Mở viewer hoặc chọn file
    const handleItemClick = useCallback((item) => {
        if (selectedIds.length > 0) {
            // Chế độ đang chọn nhiều
            setSelectedIds(prev =>
                prev.includes(item._id) ? prev.filter(i => i !== item._id) : [...prev, item._id]
            );
        } else {
            // Chế độ bình thường
            if (item.type === 'file' && imageFiles.some(img => img.id === item._id)) {
                const index = imageFiles.findIndex(img => img.id === item._id);
                setViewerConfig({ isOpen: true, index });
            } else {
                console.log("Mở file/folder:", item.name);
            }
        }
    }, [selectedIds, imageFiles]);

    const handleLongPress = useCallback((id) => {
        if (!selectedIds.includes(id)) {
            setSelectedIds(prev => [...prev, id]);
        }
    }, [selectedIds]);

    // Xử lý Xóa
    const requestDelete = (ids) => {
        const targetIds = Array.isArray(ids) ? ids : [ids];
        if (targetIds.length === 0) return;
        setConfirmDelete({ isOpen: true, ids: targetIds });
    };

    const executeDelete = async () => {
        try {
            await fileService.deleteItems(confirmDelete.ids);
            // Cập nhật UI ngay lập tức
            setFiles(prev => prev.filter(f => !confirmDelete.ids.includes(f.id)));
            setSelectedIds([]);
            setViewerConfig({ isOpen: false, index: 0 });
        } catch (error) {
            alert("Không thể xóa các mục đã chọn.");
        } finally {
            setConfirmDelete({ isOpen: false, ids: [] });
        }
    };

    return (
        <div className="min-h-screen bg-white mt-23 pb-35 font-sans select-none">

            {/* HEADER */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 px-6 py-4 shadow-sm">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <Clock size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">Gần đây</h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {loading ? 'Đang cập nhật...' : `${files?.length} hoạt động`}
                            </p>
                        </div>
                    </div>

                    <div className="flex bg-slate-100 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="max-w-5xl mx-auto px-6 mt-20">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <p className="text-sm font-medium">Đang chuẩn bị tệp tin...</p>
                    </div>
                ) : (files && files.length > 0) ? (
                    <div className={viewMode === 'grid'
                        ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5"
                        : "flex flex-col gap-3"
                    }>
                        {files.map((file, index) => (
                            <FileItem
                                key={file.id || index}
                                item={file}
                                viewMode={viewMode}
                                isSelectionMode={isSelectionMode}
                                isSelected={selectedIds.includes(file.id)}
                                onClick={handleItemClick}
                                onLongPress={handleLongPress}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32">
                        <p className="text-slate-400 text-sm">Chưa có hoạt động gần đây.</p>
                    </div>
                )}
            </main>

            {/* ACTION DOCK */}
            <ActionDock
                selectedCount={selectedIds.length}
                onEdit={() => console.log("Rename modal sẽ mở ở đây")}
                onMove={() => console.log("Move modal sẽ mở ở đây")}
                onDelete={() => requestDelete(selectedIds)}
                onCancel={() => setSelectedIds([])}
            />

            {/* IMAGE VIEWER */}
            <AnimatePresence>
                {viewerConfig.isOpen && (
                    <ImageViewer
                        images={imageFiles}
                        initialIndex={viewerConfig.index}
                        onClose={() => setViewerConfig(prev => ({ ...prev, isOpen: false }))}
                        onDelete={(id) => requestDelete(id)}
                        onRename={(id, name) => console.log("Sửa tên:", name)}
                    />
                )}
            </AnimatePresence>

            {/* CONFIRM MODAL */}
            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                title="Xóa mục đã chọn?"
                message={`Bạn có chắc chắn muốn xóa ${confirmDelete.ids.length} mục này? Dữ liệu sẽ được chuyển vào thùng rác.`}
                onConfirm={executeDelete}
                onCancel={() => setConfirmDelete({ isOpen: false, ids: [] })}
            />
        </div>
    );
}