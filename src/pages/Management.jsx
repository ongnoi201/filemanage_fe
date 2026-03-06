import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Grid, List, ArrowUpDown, ChevronRight, Plus, FolderPlus, UploadCloud, X, Loader2, Folder } from 'lucide-react';
import FileItem from '../components/FileItem';
import ActionDock from '../components/ActionDock';
import ConfirmModal from '../components/ConfirmModal';
import FolderPickerModal from '../components/FolderPickerModal';
import ImageViewer from '../components/ImageViewer';
import { AnimatePresence } from 'framer-motion';
import folderService from '../services/folderService';
import fileService from '../services/fileService';
import { toast } from 'react-toastify';
import LockModal from '../components/LockModal';

export default function Management() {
    // --- STATE ---
    const [items, setItems] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState(''); // Fix tìm kiếm
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('name');
    const [loading, setLoading] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [path, setPath] = useState([{ _id: null, name: 'Drive' }]);

    // State cho Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [creatingInFolder, setCreatingInFolder] = useState(undefined);
    const [editingId, setEditingId] = useState(null);
    const [viewerData, setViewerData] = useState({ isOpen: false, index: 0 });

    const [isLockModalOpen, setIsLockModalOpen] = useState(false);
    const [loadingLock, setLoadingLock] = useState(false);
    const [pendingFolder, setPendingFolder] = useState(null);

    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20
    });
    const [loadingMore, setLoadingMore] = useState(false);

    const isSelectionMode = selectedIds.length > 0;

    // Lấy danh sách các object folder hoàn chỉnh từ selectedIds để truyền vào modal
    const selectedFolderItems = useMemo(() => {
        return items.filter(item => item.type === 'folder' && selectedIds.includes(item._id));
    }, [items, selectedIds]);

    // Kiểm tra xem ActionDock có nên hiện nút Lock hay không (chỉ hiện khi chọn toàn folder)
    const isOnlyFoldersSelected = useMemo(() => {
        return selectedIds.length > 0 && selectedFolderItems.length === selectedIds.length;
    }, [selectedIds, selectedFolderItems]);

    // --- DEBOUNCE LOGIC ---
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            if (searchQuery) setSelectedIds([]); // Reset chọn khi search mới
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // --- LOGIC LỌC ẢNH ---
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const imageItems = useMemo(() => {
        return items.filter(item =>
            item.type === 'file' &&
            imageExtensions.includes(item.name?.split('.').pop()?.toLowerCase())
        );
    }, [items]);

    // --- FETCH DATA ---
    const loadData = useCallback(async () => {
        // 1. Quản lý trạng thái Loading
        if (pagination.currentPage === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            if (debouncedSearch.trim()) {
                // --- LOGIC TÌM KIẾM ---
                const response = await folderService.searchAll(debouncedSearch);

                // Chuẩn hóa dữ liệu từ search
                const searchFolders = (response?.folders || []).map(f => ({
                    ...f,
                    type: 'folder'
                }));
                const searchFiles = (response?.files || []).map(f => ({
                    ...f,
                    type: 'file'
                }));

                const combinedSearchData = [...searchFolders, ...searchFiles];

                // Nếu search, thường ta sẽ hiển thị tất cả kết quả 1 lần hoặc theo phân trang search riêng
                // Ở đây ta set thẳng vào items
                setItems(combinedSearchData);

                // Reset pagination về trạng thái ảo để không hiện nút "Xem thêm" khi đang search
                // (Trừ khi bạn có API search phân trang riêng)
                setPagination({
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: combinedSearchData.length,
                    itemsPerPage: 20
                });

            } else {
                // --- LOGIC LẤY DỮ LIỆU THƯ MỤC THÔNG THƯỜNG ---
                const [folders, fileResponse] = await Promise.all([
                    pagination.currentPage === 1
                        ? folderService.getFolders(currentFolderId)
                        : Promise.resolve([]),
                    fileService.getFiles(currentFolderId, pagination.currentPage, pagination.itemsPerPage)
                ]);

                const files = fileResponse?.files || [];

                if (fileResponse?.pagination) {
                    setPagination(fileResponse.pagination);
                }

                const newItems = [
                    ...(folders || []).map(f => ({ ...f, type: 'folder' })),
                    ...files.map(f => ({ ...f, type: 'file' }))
                ];

                setItems(prev => {
                    if (pagination.currentPage === 1) return newItems;

                    // Gộp và lọc trùng (Tránh lỗi duplicate key React)
                    const combined = [...prev, ...newItems];
                    const uniqueMap = new Map();
                    combined.forEach(item => uniqueMap.set(item._id, item));
                    return Array.from(uniqueMap.values());
                });
            }
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
            toast.error("Không thể kết nối máy chủ");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [currentFolderId, debouncedSearch, pagination.currentPage, pagination.itemsPerPage]);

    useEffect(() => { loadData(); }, [loadData]);

    // --- ACTIONS ---

    const handleLockConfirm = async ({ folderIds, imageHash, mode }) => {
        setLoadingLock(true);
        const toastId = toast.loading(mode === 'lock' ? "Đang thiết lập khóa..." : "Đang xác thực...");
        try {
            if (mode === 'lock') {
                await folderService.lockFolders(folderIds, imageHash);
                toast.update(toastId, { render: "Đã khóa thư mục", type: "success", isLoading: false, autoClose: 2000 });
            } else {
                // mode === 'unlock'
                await folderService.unlockFolder(folderIds[0], imageHash);
                toast.update(toastId, { render: "Mở khóa thành công", type: "success", isLoading: false, autoClose: 2000 });

                // TỰ ĐỘNG VÀO FOLDER NẾU ĐANG TRONG LUỒNG TRUY CẬP
                if (pendingFolder && pendingFolder._id === folderIds[0]) {
                    navigateToFolder(pendingFolder);
                    setPendingFolder(null); // Reset sau khi xong
                }
            }

            await loadData();
            setIsLockModalOpen(false);
            setSelectedIds([]);
        } catch (error) {
            const msg = error.response?.data?.message || "Ảnh chìa khóa không đúng!";
            toast.update(toastId, { render: msg, type: "error", isLoading: false, autoClose: 2000 });
        } finally {
            setLoadingLock(false);
        }
    };

    const handleConfirmCreate = async (name) => {
        if (!name.trim()) return setCreatingInFolder(undefined);
        try {
            const newFolder = await folderService.createFolder(name, currentFolderId);
            setItems(prev => [{ ...newFolder, type: 'folder' }, ...prev]);
            toast.success("Đã tạo thư mục");
        } catch (error) { toast.error("Lỗi tạo thư mục"); }
        finally { setCreatingInFolder(undefined); }
    };

    const handleFileUpload = async (e) => {
        const files = e.target.files;
        if (!files?.length) return;

        const formData = new FormData();
        Array.from(files).forEach(f => formData.append('files', f));
        if (currentFolderId) formData.append('folderId', currentFolderId);

        const toastId = toast.loading("Đang tải lên...");
        setIsAddMenuOpen(false);

        try {
            const uploaded = await fileService.uploadFiles(formData);
            setItems(prev => [...(uploaded || []).map(f => ({ ...f, type: 'file' })), ...prev]);
            toast.update(toastId, { render: "Thành công!", type: "success", isLoading: false, autoClose: 2000 });
        } catch (error) {
            toast.update(toastId, { render: "Lỗi tải lên", type: "error", isLoading: false, autoClose: 2000 });
        }
    };

    const handleConfirmEdit = async (id, newName) => {
        const item = items.find(i => i._id === id);
        if (!item || item.name === newName) return setEditingId(null);
        try {
            item.type === 'folder' ? await folderService.renameFolder(id, newName) : await fileService.renameFile(id, newName);
            setItems(prev => prev.map(i => i._id === id ? { ...i, name: newName } : i));
            toast.success("Đã đổi tên");
        } catch (error) { toast.error("Lỗi đổi tên"); }
        finally { setEditingId(null); setSelectedIds([]); }
    };

    const handleConfirmDelete = async () => {
        setLoadingDelete(true);
        try {
            await fileService.deleteItems(selectedIds);
            setItems(prev => prev.filter(i => !selectedIds.includes(i._id)));
            toast.success("Đã xóa");
            setSelectedIds([]);
        } catch (error) { toast.error("Lỗi xóa mục"); }
        finally {
            setIsDeleteModalOpen(false);
            setLoadingDelete(false);
        }
    };

    const handleConfirmMove = async (targetId) => {
        if (targetId === currentFolderId) return setIsMoveModalOpen(false);
        const toastId = toast.loading("Đang di chuyển...");
        try {
            await Promise.all(selectedIds.map(id => {
                const item = items.find(i => i._id === id);
                return item?.type === 'folder' ? folderService.moveFolder(id, targetId) : fileService.moveFiles(id, targetId);
            }));
            setItems(prev => prev.filter(i => !selectedIds.includes(i._id)));
            toast.update(toastId, { render: "Đã di chuyển", type: "success", isLoading: false, autoClose: 2000 });
            setSelectedIds([]);
        } catch (error) { toast.update(toastId, { render: "Lỗi di chuyển", type: "error", isLoading: false, autoClose: 2000 }); }
        finally { setIsMoveModalOpen(false); }
    };

    // --- NAVIGATION ---
    const handleItemClick = useCallback((item) => {
        if (selectedIds.length > 0) {
            setSelectedIds(prev => prev.includes(item._id) ? prev.filter(i => i !== item._id) : [...prev, item._id]);
        } else if (item.type === 'folder') {
            // --- LOGIC MỚI: KIỂM TRA KHÓA ---
            if (item.protection?.status === 'locked') {
                setPendingFolder(item); // Lưu folder này lại
                setIsLockModalOpen(true); // Mở modal để yêu cầu nhập ảnh khóa
                return; // Dừng lại không cho vào folder
            }
            // -------------------------------

            // Nếu không khóa hoặc đã mở, thực hiện điều hướng bình thường
            navigateToFolder(item);
        } else {
            // Xử lý xem ảnh (giữ nguyên)
            const ext = item.name?.split('.').pop()?.toLowerCase();
            if (imageExtensions.includes(ext)) {
                const idx = imageItems.findIndex(img => img._id === item._id);
                setViewerData({ isOpen: true, index: idx });
            }
        }
    }, [selectedIds, imageItems, debouncedSearch]);

    // Tách hàm điều hướng ra để tái sử dụng
    const navigateToFolder = (folder) => {
        if (debouncedSearch) {
            setSearchQuery('');
            setDebouncedSearch('');
        }

        // RESET QUAN TRỌNG Ở ĐÂY
        setItems([]); // Xóa sạch danh sách cũ ngay lập tức
        setCurrentFolderId(folder._id);
        setPagination({
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 20
        });
        // ----------------------

        setPath(prev => [...prev, { _id: folder._id, name: folder.name }]);
        setSelectedIds([]);
        setCreatingInFolder(undefined);
        setIsAddMenuOpen(false);
    };

    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return (a.name || "").localeCompare(b.name || "");
        });
    }, [items]);

    return (
        <div className="min-h-screen bg-white pb-32 font-sans text-slate-900 select-none">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 px-4 py-4">
                <div className="max-w-5xl mx-auto space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm trong Drive..."
                            className="w-full bg-slate-100 border-none rounded-2xl py-2.5 pl-10 pr-10 text-sm focus:ring-2 focus:ring-blue-500/10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-slate-200 rounded-full">
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                            {debouncedSearch ? (
                                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                                    Kết quả cho "{debouncedSearch}"
                                </span>
                            ) : (
                                path.map((crumb, index) => (
                                    <React.Fragment key={crumb._id || 'root'}>
                                        <button
                                            onClick={() => {
                                                setPath(path.slice(0, index + 1));
                                                setCurrentFolderId(crumb._id);
                                                setSelectedIds([]);
                                                setPagination(prev => ({ ...prev, currentPage: 1 }));
                                                setItems([]);
                                            }}
                                            className={`text-sm px-2 py-1 rounded-lg whitespace-nowrap ${index === path.length - 1 ? 'font-bold text-blue-600 bg-blue-50' : 'text-slate-400'}`}
                                        >
                                            {crumb.name}
                                        </button>
                                        {index < path.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                                    </React.Fragment>
                                ))
                            )}
                        </nav>
                        <div className="flex gap-1 pl-2">
                            <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="p-2 text-slate-500">
                                {viewMode === 'grid' ? <List size={18} /> : <Grid size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 mt-36">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <p className="text-sm font-medium">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <>
                        {/* Hiển thị danh sách nếu có items HOẶC đang trong chế độ tạo mới */}
                        {(sortedItems.length > 0 || creatingInFolder === currentFolderId) ? (
                            <div className="flex flex-col w-full"> {/* Container bọc ngoài để quản lý dòng chảy dọc */}

                                {/* 1. Phần Grid/List Items */}
                                <div className={viewMode === 'grid'
                                    ? 'grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4'
                                    : 'flex flex-col gap-2'}>

                                    {/* Luôn ưu tiên hiển thị ô tạo mới ở đầu danh sách */}
                                    {creatingInFolder === currentFolderId && (
                                        <FileItem
                                            item={{ name: 'Thư mục mới', type: 'folder' }}
                                            viewMode={viewMode}
                                            isEditing={true}
                                            onConfirmEdit={handleConfirmCreate}
                                            onCancelEdit={() => setCreatingInFolder(undefined)}
                                        />
                                    )}

                                    {/* Danh sách các items hiện có */}
                                    {sortedItems.map((item) => (
                                        <FileItem
                                            key={item._id}
                                            item={item}
                                            isLocked={item.protection?.status === 'locked'}
                                            viewMode={viewMode}
                                            isSelected={selectedIds.includes(item._id)}
                                            isSelectionMode={isSelectionMode}
                                            isEditing={editingId === item._id}
                                            onConfirmEdit={(n) => handleConfirmEdit(item._id, n)}
                                            onCancelEdit={() => setEditingId(null)}
                                            onClick={() => handleItemClick(item)}
                                            onLongPress={() => setSelectedIds(p => [...p, item._id])}
                                        />
                                    ))}
                                </div>

                                {/* 2. Phần Nút "Xem thêm" - Đưa ra ngoài Grid để căn giữa tuyệt đối */}
                                {/* 2. Phần Nút "Xem thêm" */}
                                {!loading && !debouncedSearch && pagination.currentPage < pagination.totalPages && (
                                    <div className="flex justify-center w-full mt-12 pb-10">
                                        <button
                                            disabled={loadingMore} // Vô hiệu hóa khi đang load
                                            onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))}
                                            className="group flex items-center gap-3 px-10 py-3.5 bg-white hover:bg-blue-600 text-slate-600 hover:text-white border border-slate-200 hover:border-blue-600 rounded-2xl text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {loadingMore ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Đang tải...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Xem thêm</span>
                                                    <svg
                                                        className="w-4 h-4 transition-transform group-hover:translate-y-0.5"
                                                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Chỉ hiện khi cả danh sách rỗng VÀ không có lệnh tạo mới */
                            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                                <div className="bg-slate-50 p-6 rounded-full mb-4">
                                    <Folder className="w-12 h-12 text-slate-200" />
                                </div>
                                <p className="font-medium">Không tìm thấy mục nào</p>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Float Actions */}
            <input type="file" id="file-upload" multiple className="hidden" onChange={handleFileUpload} />

            <ActionDock
                selectedCount={selectedIds.length}
                onEdit={() => setEditingId(selectedIds[0])}
                onMove={() => setIsMoveModalOpen(true)}
                onDelete={() => setIsDeleteModalOpen(true)}
                onCancel={() => setSelectedIds([])}
                showLock={isOnlyFoldersSelected}
                isLocked={selectedFolderItems.every(f => f.protection?.status === 'locked')}
                onLockToggle={() => setIsLockModalOpen(true)}
            />

            {!isSelectionMode && !debouncedSearch && (
                <button onClick={() => setIsAddMenuOpen(true)} className="fixed bottom-24 right-5 w-12 h-12 bg-blue-400 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all z-40">
                    <Plus size={32} strokeWidth={3} />
                </button>
            )}

            {/* Modals */}
            <AnimatePresence>
                {viewerData.isOpen && (
                    <ImageViewer
                        images={imageItems}
                        initialIndex={viewerData.index}
                        onClose={() => setViewerData({ ...viewerData, isOpen: false })}
                        onDelete={(id) => { setViewerData({ ...viewerData, isOpen: false }); setSelectedIds([id]); setIsDeleteModalOpen(true); }}
                        onRename={(id) => { setViewerData({ ...viewerData, isOpen: false }); setEditingId(id); }}
                    />
                )}

                {isLockModalOpen && (
                    <LockModal
                        isOpen={isLockModalOpen}
                        isLoading={loadingLock}
                        // Nếu có pendingFolder (do click), ưu tiên folder đó. Nếu không lấy từ selection (do dùng ActionDock)
                        selectedItems={pendingFolder ? [pendingFolder] : selectedFolderItems}
                        onClose={() => {
                            setIsLockModalOpen(false);
                            setPendingFolder(null); // Reset nếu người dùng đóng modal
                        }}
                        onConfirm={handleLockConfirm}
                    />
                )}
            </AnimatePresence>

            {isAddMenuOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]" onClick={() => setIsAddMenuOpen(false)}>
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-8" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                            <button onClick={() => { setCreatingInFolder(currentFolderId);; setIsAddMenuOpen(false); }} className="flex flex-col items-center gap-3 p-6 bg-amber-50 rounded-[2rem]">
                                <FolderPlus size={40} className="text-amber-500" />
                                <span className="text-[11px] font-black text-amber-600 uppercase">Thư mục</span>
                            </button>
                            <button onClick={() => document.getElementById('file-upload').click()} className="flex flex-col items-center gap-3 p-6 bg-blue-50 rounded-[2rem]">
                                <UploadCloud size={40} className="text-blue-600" />
                                <span className="text-[11px] font-black text-blue-600 uppercase">Tải file</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal isLoading={loadingDelete} isOpen={isDeleteModalOpen} title="Xóa mục đã chọn?" message="Dữ liệu sẽ mất vĩnh viễn." onConfirm={handleConfirmDelete} onCancel={() => setIsDeleteModalOpen(false)} />
            <FolderPickerModal isOpen={isMoveModalOpen} movingIds={selectedIds} onClose={() => setIsMoveModalOpen(false)} onConfirm={handleConfirmMove} />
        </div>
    );
}