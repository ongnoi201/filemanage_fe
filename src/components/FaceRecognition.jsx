import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, X, RefreshCw, CheckCircle } from 'lucide-react';

const FaceRecognition = ({ onCapture, onClose, loading, buttonText = "Xác nhận" }) => {
    const webcamRef = useRef(null);
    const [previewImg, setPreviewImg] = useState(null);

    // Cấu hình camera dọc (3:4)
    const videoConstraints = {
        width: 480,
        height: 640,
        facingMode: "user"
    };

    const capture = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        setPreviewImg(imageSrc);
    };

    const handleConfirm = () => {
        onCapture(previewImg);
    };

    const retake = () => {
        setPreviewImg(null);
    };

    return (
        <div className="flex flex-col items-center space-y-4 w-full animate-in fade-in zoom-in duration-300">
            {/* Container khung hình dọc 3:4 */}
            <div className="relative overflow-hidden rounded-2xl border-4 border-blue-400/50 shadow-2xl bg-black w-full max-w-[280px] aspect-[3/4]">
                {!previewImg ? (
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        className="absolute inset-0 w-full h-full object-cover"
                        mirrored={true} // Gương để người dùng dễ căn chỉnh
                    />
                ) : (
                    <img src={previewImg} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                )}
                
                {/* Overlay loading */}
                {loading && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-400 border-t-transparent mb-2"></div>
                        <p className="text-xs font-medium">Đang xử lý...</p>
                    </div>
                )}

                {/* Khung hướng dẫn quét mặt (UI trang trí) */}
                {!previewImg && !loading && (
                    <div className="absolute inset-0 border-[30px] border-black/20 pointer-events-none">
                         <div className="w-full h-full border-2 border-white/30 rounded-[20%]"></div>
                    </div>
                )}
            </div>

            {/* Nút điều khiển */}
            <div className="flex flex-col gap-2 w-full max-w-[280px]">
                {!previewImg ? (
                    <button
                        onClick={capture}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-lg font-bold"
                    >
                        <Camera size={20} /> Chụp khuôn mặt
                    </button>
                ) : (
                    <div className="flex gap-2 w-full">
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="flex-[2] py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 active:scale-95 transition-all shadow-lg"
                        >
                            <CheckCircle size={20} /> {buttonText}
                        </button>
                        <button
                            onClick={retake}
                            disabled={loading}
                            className="flex-1 py-3 bg-gray-500 text-white rounded-xl flex items-center justify-center hover:bg-gray-600 active:scale-95 transition-all shadow-md"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                )}
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="py-2 text-white/70 hover:text-white text-sm font-medium transition-all underline underline-offset-4"
                >
                    Quay lại đăng nhập thường
                </button>
            </div>
        </div>
    );
};

export default FaceRecognition;