import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Eye, EyeOff, UserCheck, Lock, User, Loader2 } from 'lucide-react';
import * as faceapi from 'face-api.js'; // Import faceapi
import userService from '../services/userService';
import FaceRecognition from '../components/FaceRecognition';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [faceLoading, setFaceLoading] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false); // State quản lý model
    const [showPassword, setShowPassword] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    // 1. Load Models giống hệt bên Settings
    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
            } catch (err) {
                console.error("Lỗi tải model FaceAPI:", err);
            }
        };
        loadModels();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLoginSuccess = (response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response));
        toast.success(`Chào mừng ${response.username} đã quay trở lại!`);
        setTimeout(() => navigate('/'), 1000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await userService.login(formData);
            handleLoginSuccess(response);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng!');
        } finally {
            setLoading(false);
        }
    };

    // 2. Logic xử lý FaceID (Trích xuất Descriptor tại đây)
    const handleFaceLogin = async (imageSrc) => {
        if (!modelsLoaded) return toast.warning("Hệ thống đang khởi động...");
        setFaceLoading(true);

        try {
            // Tạo một Image object để đảm bảo dữ liệu chuẩn
            const img = new Image();
            img.src = imageSrc;

            // Đợi ảnh load xong để tránh lỗi IBoundingBox null
            await new Promise((resolve) => (img.onload = resolve));

            const detection = await faceapi
                .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({
                    inputSize: 512, // Tăng kích thước đầu vào để chính xác hơn
                    scoreThreshold: 0.55
                }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                toast.error("Không tìm thấy khuôn mặt. Hãy thử lại!");
                setFaceLoading(false);
                return;
            }

            const descriptor = Array.from(detection.descriptor);
            const response = await userService.loginWithFace({ descriptor });
            handleLoginSuccess(response);
        } catch (err) {
            console.error("Chi tiết lỗi FaceAPI:", err);
            toast.error("Lỗi nhận diện. Vui lòng thử lại!");
        } finally {
            setFaceLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[url('https://www.didongmy.com/vnt_upload/news/03_2024/hinh-nen-4k-la-gi-Didongmy.jpg')] bg-cover bg-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

            <div className="relative w-full max-w-md p-8 rounded-[2.5rem] bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Hệ Thống</h2>
                    <p className="text-blue-200 text-xs font-bold uppercase tracking-[0.2em] mt-1">Đăng nhập tài khoản</p>
                </div>

                {isCameraOpen ? (
                    <div className="py-4">
                        <FaceRecognition
                            onCapture={handleFaceLogin}
                            onClose={() => setIsCameraOpen(false)}
                            loading={faceLoading}
                            buttonText="Kiểm tra"
                        />
                    </div>
                ) : (
                    <form className="space-y-5" onSubmit={handleLogin}>
                        <div className="space-y-1.5">
                            <label className="text-white/60 text-[10px] font-black uppercase ml-4 tracking-widest">Tài khoản</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                <input
                                    name="username"
                                    type="text"
                                    required
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:bg-white/10 transition-all font-bold"
                                    placeholder="Username"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-white/60 text-[10px] font-black uppercase ml-4 tracking-widest">Mật khẩu</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:bg-white/10 transition-all font-bold"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="animate-spin" size={18} />}
                            ĐĂNG NHẬP NGAY
                        </button>

                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-white/5"></div>
                            <span className="flex-shrink mx-4 text-white/20 text-[10px] font-black uppercase">Hoặc</span>
                            <div className="flex-grow border-t border-white/5"></div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsCameraOpen(true)}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-sm shadow-inner"
                        >
                            <UserCheck className="text-blue-400" size={20} />
                            SỬ DỤNG FACE ID
                        </button>
                    </form>
                )}

                <div className="mt-8 text-center">
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider">
                        Chưa có tài khoản?{' '}
                        <Link to={'/register'} className="text-blue-400 hover:text-blue-300 transition-colors">
                            Đăng ký ngay
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;