import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';

const ASPECT_RATIOS = [
    { label: '1:1', value: 1 / 1 },
    { label: '3:4', value: 3 / 4 },
    { label: '4:3', value: 4 / 3 },
    { label: '9:16', value: 9 / 16 },
    { label: '16:9', value: 16 / 9 },
];

const ImageCropper = ({ title, image, onCropComplete, onCancel, isOpen }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspect, setAspect] = useState(ASPECT_RATIOS[0].value);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropCompleteInternal = useCallback((_, pixels) => {
        setCroppedAreaPixels(pixels);
    }, []);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
                    {/* 1. Backdrop: Lớp nền mờ phía sau */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel} // Đóng khi click ra ngoài
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* 2. Modal Container: Phần nội dung chính nổi lên */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50 }} // Bắt đầu từ dưới lên và hơi nhỏ
                        animate={{ opacity: 1, scale: 1, y: 0 }}    // Bay vào vị trí chuẩn
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}     // Biến mất về phía dưới
                        transition={{ 
                            type: "spring", 
                            damping: 25, 
                            stiffness: 300 
                        }}
                        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-xl font-bold text-gray-800">{title || "Chỉnh sửa ảnh"}</h3>
                            <button 
                                onClick={onCancel}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Area Cắt ảnh */}
                        <div className="relative h-[400px] w-full bg-gray-100">
                            <Cropper
                                image={image}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspect}
                                onCropChange={setCrop}
                                onCropComplete={onCropCompleteInternal}
                                onZoomChange={setZoom}
                            />
                        </div>

                        {/* Footer & Controls */}
                        <div className="p-6 bg-white space-y-6">
                            {/* Tỷ lệ khung hình */}
                            <div className="flex flex-row flex-center items-center gap-2">
                                {ASPECT_RATIOS.map((ratio) => (
                                    <button
                                        key={ratio.label}
                                        onClick={() => setAspect(ratio.value)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                                            aspect === ratio.value
                                                ? 'bg-blue-600 text-white shadow-lg'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {ratio.label}
                                    </button>
                                ))}
                            </div>

                            {/* Zoom Slider */}
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-500">Zoom:</span>
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <span className="text-sm font-bold text-blue-600 w-10">{Math.round(zoom * 100)}%</span>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={onCancel}
                                    className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={() => onCropComplete(croppedAreaPixels)}
                                    className="px-8 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                                >
                                    Cắt & Lưu
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ImageCropper;