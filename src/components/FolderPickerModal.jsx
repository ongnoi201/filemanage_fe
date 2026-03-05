import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, ChevronRight, X, ChevronLeft } from 'lucide-react';
import folderService from '../services/folderService';

const FolderPickerModal = ({ isOpen, onClose, onConfirm, movingIds }) => {
    const [currentId, setCurrentId] = useState(null);
    const [folders, setFolders] = useState([]);
    const [path, setPath] = useState([{ _id: null, name: 'Drive' }]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadFolders(null);
            setPath([{ _id: null, name: 'Drive' }]);
        }
    }, [isOpen]);

    const loadFolders = async (id) => {
        setLoading(true);
        try {
            const data = await folderService.getFolders(id);
            // Chỉ lấy các folder và loại bỏ folder đang được di chuyển (tránh di chuyển folder vào chính nó)
            const filtered = (data || []).filter(item =>
                item.type === 'folder' && !movingIds.includes(item._id)
            );
            setFolders(filtered);
            setCurrentId(id);
        } catch (error) {
            console.error("Lỗi tải thư mục picker:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (folder) => {
        setPath([...path, { _id: folder._id, name: folder.name }]);
        loadFolders(folder._id);
    };

    const handleGoBack = () => {
        if (path.length > 1) {
            const newPath = path.slice(0, -1);
            const parent = newPath[newPath.length - 1];
            setPath(newPath);
            loadFolders(parent._id);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative bg-white w-full max-w-lg rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Di chuyển đến...</h3>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs text-slate-400">Vị trí:</span>
                                    <span className="text-xs font-bold text-blue-600">{path[path.length - 1].name}</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20} /></button>
                        </div>

                        {/* List Thư mục */}
                        <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
                            {path.length > 1 && (
                                <button onClick={handleGoBack} className="w-full flex items-center gap-3 p-4 text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors mb-2 border border-dashed">
                                    <ChevronLeft size={20} />
                                    <span className="font-medium text-sm">Quay lại thư mục trước</span>
                                </button>
                            )}

                            {loading ? (
                                <div className="flex justify-center py-10 text-blue-500 animate-spin"><Folder /></div>
                            ) : folders.length === 0 ? (
                                <div className="text-center py-20 text-slate-400 text-sm italic">Thư mục này trống</div>
                            ) : (
                                <div className="space-y-1">
                                    {folders.map(folder => (
                                        <button
                                            key={folder._id}
                                            onClick={() => handleNavigate(folder)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-blue-50 rounded-2xl group transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-500">
                                                    <Folder size={20} fill="currentColor" />
                                                </div>
                                                <span className="font-semibold text-slate-700 text-sm">{folder.name}</span>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Action */}
                        <div className="p-6 bg-slate-50 flex gap-3">
                            <button onClick={onClose} className="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-white rounded-2xl transition-all">Hủy</button>
                            <button
                                onClick={() => onConfirm(currentId)}
                                className="flex-[2] py-4 bg-blue-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all"
                            >
                                Di chuyển vào đây
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default FolderPickerModal;