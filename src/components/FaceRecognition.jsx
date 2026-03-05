import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, CheckCircle } from 'lucide-react';

const FaceRecognition = ({ onCapture, onClose, loading, buttonText = "Xác nhận" }) => {
    const webcamRef = useRef(null);
    const [previewImg, setPreviewImg] = useState(null);

    // Cấu hình linh hoạt hơn để trình duyệt dễ đáp ứng
    const videoConstraints = {
        // Để ideal thay vì exact để tránh lỗi trên các dòng laptop cũ
        width: { ideal: 1280 },
        height: { ideal: 720 },
        aspectRatio: { ideal: 3 / 4 }, // Ép về dọc nếu có thể
        facingMode: "user"
    };

    const capture = useCallback(() => {
    if (webcamRef.current) {
        // Lấy screenshot theo đúng kích thước thực tế của camera
        const imageSrc = webcamRef.current.getScreenshot(); 
        setPreviewImg(imageSrc);
    }
}, [webcamRef]);

    const handleConfirm = () => {
        if (previewImg) {
            onCapture(previewImg);
        }
    };

    const retake = () => {
        setPreviewImg(null);
    };

    return (
        <div className="flex flex-col items-center space-y-4 w-full animate-in fade-in zoom-in duration-300">
            {/* Sử dụng aspect-ratio trong CSS để đảm bảo khung hiển thị 
               luôn đúng tỉ lệ 3:4 bất kể độ rộng 
            */}
            <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-blue-400/50 shadow-2xl bg-black w-[280px] aspect-[3/4]">
                {!previewImg ? (
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        screenshotQuality={0.9}
                        videoConstraints={videoConstraints}
                        mirrored={true}
                        // Loại bỏ forceScreenshotSourceSize nếu không cần thiết 
                        // để nó tự khớp với khung nhìn
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <img
                        src={previewImg}
                        alt="Preview"
                        // Nếu webcam mirrored={true}, ảnh chụp cần lật lại
                        // Lưu ý: Cân nhắc bỏ scaleX(-1) nếu backend face-api cần ảnh xuôi
                        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                    />
                )}

                {/* Overlay loading & Guide UI */}
                {loading && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-20 backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-400 border-t-transparent mb-2"></div>
                        <p className="text-[11px] font-black uppercase tracking-widest">Đang phân tích...</p>
                    </div>
                )}

                {!previewImg && !loading && (
                    <div className="absolute inset-0 border-[30px] border-black/10 pointer-events-none z-10 flex items-center justify-center">
                        <div className="w-[85%] h-[70%] border-2 border-white/40 rounded-[40%]"></div>
                    </div>
                )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 w-full max-w-[280px]">
                {!previewImg ? (
                    <button
                        onClick={capture}
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-xl font-black text-xs uppercase tracking-widest disabled:opacity-50"
                    >
                        <Camera size={20} /> Chụp khuôn mặt
                    </button>
                ) : (
                    <div className="flex gap-2 w-full">
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="flex-[2] py-4 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 active:scale-95 transition-all"
                        >
                            <CheckCircle size={18} /> {buttonText}
                        </button>
                        <button
                            onClick={retake}
                            disabled={loading}
                            className="flex-1 py-4 bg-slate-200 text-slate-600 rounded-2xl flex items-center justify-center hover:bg-slate-300 active:scale-95 transition-all"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>
                )}

                <button
                    onClick={onClose}
                    disabled={loading}
                    className="py-2 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest transition-all underline underline-offset-4"
                >
                    Hủy bỏ và quay lại
                </button>
            </div>
        </div>
    );
};

export default FaceRecognition;