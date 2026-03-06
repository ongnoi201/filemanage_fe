import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Image as ImageIcon, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

// --- HÀM NÉN ẢNH ---
const compressImage = (file, maxWidth = 200, quality = 0.6) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Chuyển về JPEG để có dung lượng thấp nhất
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
            };
        };
        reader.onerror = (error) => reject(error);
    });
};

const LockModal = ({ isOpen, onClose, selectedItems, onConfirm, isLoading }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false); // Trạng thái đang nén ảnh

    useEffect(() => {
        if (isOpen) {
            setSelectedImage(null);
            setPreviewUrl(null);
            setIsProcessing(false);
        }
    }, [isOpen]);

    const lockConfig = useMemo(() => {
        if (!selectedItems || selectedItems.length === 0) return { mode: 'idle' };
        
        const allHaveKey = selectedItems.every(item => item.protection?.hasImageKey);
        const hasLockedItem = selectedItems.some(item => item.protection?.status === 'locked');

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

    // --- THAY ĐỔI TẠI ĐÂY: Xử lý nén ảnh ngay khi chọn ---
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsProcessing(true); // Bật loading cho quá trình nén
            try {
                // Nén ảnh xuống tối đa 200px, chất lượng 60%
                const miniBase64 = await compressImage(file, 200, 0.6);
                setSelectedImage(file);
                setPreviewUrl(miniBase64); // Lưu Base64 đã nén vào preview/hash
            } catch (error) {
                console.error("Lỗi nén ảnh:", error);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleSubmit = () => {
        if (lockConfig.mode === 'unlock' && !previewUrl) return;
        if (lockConfig.mode === 'lock' && !lockConfig.check && !previewUrl) return;
        if (['error', 'idle'].includes(lockConfig.mode)) return;

        onConfirm({
            folderIds: selectedItems.map(f => f._id),
            imageHash: previewUrl, // previewUrl bây giờ là chuỗi đã nén
            mode: lockConfig.mode
        });
    };

    if (!isOpen) return null;

    const isButtonDisabled = isLoading || isProcessing || (
        lockConfig.mode === 'error' ||
        (lockConfig.mode === 'unlock' && !previewUrl) ||
        (lockConfig.mode === 'lock' && !lockConfig.check && !previewUrl)
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
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} disabled={isProcessing} />
                                    <div className={`relative h-44 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden
                                        ${previewUrl ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}>
                                        
                                        {/* Hiển thị loading khi đang nén */}
                                        {isProcessing ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <RefreshCw className="animate-spin text-blue-500" size={24} />
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">Đang tối ưu ảnh...</span>
                                            </div>
                                        ) : previewUrl ? (
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