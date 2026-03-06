import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Image as ImageIcon, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

const LockModal = ({ isOpen, onClose, selectedItems, onConfirm, isLoading }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedImage(null);
            setPreviewUrl(null);
        }
    }, [isOpen]);

    const lockConfig = useMemo(() => {
        if (!selectedItems || selectedItems.length === 0) return { mode: 'idle' };

        // THAY ĐỔI TẠI ĐÂY: Dùng every để kiểm tra tính đồng nhất
        // true: Tất cả đều đã có khóa cũ | false: Có ít nhất 1 mục mới chưa từng khóa
        const allHaveKey = selectedItems.every(item => item.protection?.hasImageKey);
        
        // Kiểm tra xem có mục nào đang ở trạng thái 'locked' (đang đóng) không
        const hasLockedItem = selectedItems.some(item => item.protection?.status === 'locked');

        // 1. Chế độ Mở khóa (Unlock)
        if (selectedItems.length === 1 && selectedItems[0].protection?.status === 'locked') {
            return {
                mode: 'unlock',
                check: true, 
                title: 'Giải mã thư mục',
                description: `Sử dụng ảnh chìa khóa để mở: ${selectedItems[0].name}`,
                imagePlaceholder: 'Xác nhận ảnh chìa khóa',
                buttonText: 'XÁC NHẬN MỞ KHÓA',
                buttonColor: 'bg-green-500',
                icon: <Unlock className="text-green-500" size={32} />
            };
        }

        // 2. Chế độ Khóa/Cập nhật (Lock)
        // Chỉ cho phép nếu tất cả mục đang chọn đều đang mở (không có status 'locked')
        if (!hasLockedItem) {
            return {
                mode: 'lock',
                check: allHaveKey,
                title: allHaveKey ? 'Cập nhật khóa nhóm' : 'Thiết lập khóa mới',
                description: allHaveKey 
                    ? `Cập nhật bảo mật cho ${selectedItems.length} mục đã chọn.` 
                    : `Khóa ${selectedItems.length} mục (bao gồm mục chưa có khóa).`,
                imagePlaceholder: allHaveKey 
                    ? 'Chọn ảnh mới (để trống nếu giữ cũ)' 
                    : 'Bắt buộc chọn ảnh khóa mới',
                buttonText: allHaveKey ? 'CẬP NHẬT KHÓA' : 'XÁC NHẬN KHÓA',
                buttonColor: 'bg-blue-600',
                icon: <Lock className="text-blue-500" size={32} />
            };
        }

        return {
            mode: 'error',
            title: 'Lựa chọn không hợp lệ',
            description: 'Vui lòng mở khóa các thư mục đang đóng trước khi thực hiện khóa nhóm.',
            icon: <AlertCircle className="text-red-500" size={32} />
        };
    }, [selectedItems]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrl(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        // Validation logic:
        // - Unlock: Luôn cần ảnh.
        // - Lock mới (!check): Luôn cần ảnh.
        // - Update (check): Cho phép null.
        if (lockConfig.mode === 'unlock' && !selectedImage) return;
        if (lockConfig.mode === 'lock' && !lockConfig.check && !selectedImage) return;
        if (['error', 'idle'].includes(lockConfig.mode)) return;

        onConfirm({
            folderIds: selectedItems.map(f => f._id),
            imageHash: previewUrl,
            mode: lockConfig.mode
        });
    };

    if (!isOpen) return null;

    // Tính toán trạng thái nút dựa trên biến allHaveKey (lockConfig.check)
    const isButtonDisabled = isLoading || (
        lockConfig.mode === 'error' ||
        (lockConfig.mode === 'unlock' && !selectedImage) ||
        (lockConfig.mode === 'lock' && !lockConfig.check && !selectedImage)
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-sm bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
                <div className="p-8">
                    {lockConfig.mode !== 'idle' ? (
                        <>
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                                    {lockConfig.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">{lockConfig.title}</h3>
                                <p className="text-sm text-slate-500 mt-2 px-6">{lockConfig.description}</p>
                            </div>

                            {lockConfig.mode !== 'error' ? (
                                <label className="relative group cursor-pointer block">
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                    <div className={`relative h-44 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden
                                        ${previewUrl ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}>
                                        {previewUrl ? (
                                            <div className="relative w-full h-full p-2">
                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-[1.5rem]" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-white text-[10px] font-bold uppercase tracking-widest">Thay đổi ảnh</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                                                    <ImageIcon className={`transition-colors ${lockConfig.check ? 'text-green-500' : 'text-blue-500'}`} size={24} />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 text-center leading-relaxed">
                                                    {lockConfig.imagePlaceholder}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </label>
                            ) : (
                                <div className="h-44 flex items-center justify-center bg-red-50 rounded-[2rem] border-2 border-red-100 border-dashed p-6 text-center">
                                    <p className="text-xs text-red-500 font-medium italic">{lockConfig.description}</p>
                                </div>
                            )}

                            <div className="mt-8 space-y-3">
                                {lockConfig.mode !== 'error' && (
                                    <button
                                        disabled={isButtonDisabled}
                                        onClick={handleSubmit}
                                        className={`w-full py-4 rounded-2xl text-white font-black text-[11px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2
                                            ${isButtonDisabled ? 'bg-slate-300' : lockConfig.buttonColor}`}
                                    >
                                        {isLoading ? <RefreshCw className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                                        {lockConfig.buttonText}
                                    </button>
                                )}

                                <button onClick={onClose} className="w-full py-3 text-[11px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">
                                    Hủy bỏ
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center py-10">
                            <RefreshCw className="animate-spin text-slate-300 mb-4" size={32} />
                            <p className="text-xs text-slate-400">Đang khởi tạo...</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default LockModal;