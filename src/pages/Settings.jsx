import React, { useState, useEffect, useRef } from 'react';
import { Camera, User, CheckCircle2, Save, KeyRound, Loader2, X, ScanFace, Trash2, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import * as faceapi from 'face-api.js';
import { useNavigate } from 'react-router-dom';

import userService from '../services/userService';
import ImageCropper from '../components/ImageCropper';
import { getCroppedImg } from '../utils/imgTools';
import FullScreenSpinner from '../components/FullScreenSpinner';
import FaceRecognition from '../components/FaceRecognition';
import ConfirmModal from '../components/ConfirmModal'; // Import Modal mới
import ImageViewer from '../components/ImageViewer';

export default function Settings() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [loadingUser, setLoadingUser] = useState(false);

    // FaceID States
    const [isFaceLoading, setIsFaceLoading] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [faceCount, setFaceCount] = useState(0);

    // Modal Control States
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: '', // 'clearFace' hoặc 'logout'
        title: '',
        message: ''
    });

    const [formData, setFormData] = useState({
        fname: '', username: '', email: '', password: '', confirmPassword: '',
    });

    const [cropModal, setCropModal] = useState({ isOpen: false, image: null, type: null, aspect: 1 });
    const [previews, setPreviews] = useState({ avatar: null, cover: null });
    const [files, setFiles] = useState({ avatar: null, cover: null });
    const [viewerConfig, setViewerConfig] = useState({ isOpen: false, index: 0, images: [] });

    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const openImageViewer = (type) => {
        const imagesToView = [
            {
                _id: 'avatar',
                name: 'Ảnh đại diện',
                url: previews.avatar || `https://ui-avatars.com/api/?name=${formData.username}`
            },
            {
                _id: 'cover',
                name: 'Ảnh bìa',
                url: previews.cover || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80"
            }
        ];

        const initialIndex = type === 'avatar' ? 0 : 1;
        setViewerConfig({ isOpen: true, index: initialIndex, images: imagesToView });
    };

    // 1. Tải Model
    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
            } catch (err) { console.error("Lỗi tải model FaceAPI:", err); }
        };
        loadModels();
    }, []);

    // 2. Lấy thông tin User & Face Count
    const fetchFaceCount = async (username) => {
        try {
            const res = await userService.countFace(username);
            setFaceCount(res.count);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        const fetchUser = async () => {
            setLoadingUser(true);
            try {
                const userData = await userService.getMe();
                setFormData({
                    fname: userData.fname || '',
                    username: userData.username || '',
                    email: userData.email || '',
                    password: '', confirmPassword: '',
                });
                setPreviews({ avatar: userData.avatar, cover: userData.cover });
                if (userData.username) await fetchFaceCount(userData.username);
            } catch (err) { toast.error("Không thể lấy thông tin người dùng"); }
            finally { setLoadingUser(false); }
        };
        fetchUser();
    }, []);

    // 3. Xử lý Đăng ký mặt
    const handleRegisterFace = async (imageSrc) => {
        if (!modelsLoaded) return toast.warning("Hệ thống đang khởi động...");
        setIsFaceLoading(true);
        try {
            const img = await faceapi.fetchImage(imageSrc);
            const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

            if (!detection) {
                toast.error("Không tìm thấy khuôn mặt!");
            } else {
                await userService.registerFace({ username: formData.username, descriptor: Array.from(detection.descriptor) });
                toast.success("Cập nhật FaceID thành công!");
                setIsCameraOpen(false);
                fetchFaceCount(formData.username);
            }
        } catch (err) { toast.error(err.response?.data?.message || "Lỗi hệ thống."); }
        finally { setIsFaceLoading(false); }
    };

    // --- LOGIC XÁC NHẬN CHUNG ---
    const openConfirm = (type) => {
        if (type === 'clearFace') {
            setConfirmModal({
                isOpen: true,
                type: 'clearFace',
                title: 'Xóa dữ liệu FaceID?',
                message: 'Tất cả 5 mẫu gương mặt sẽ bị xóa vĩnh viễn. Bạn sẽ không thể đăng nhập nhanh bằng khuôn mặt.'
            });
        } else if (type === 'logout') {
            setConfirmModal({
                isOpen: true,
                type: 'logout',
                title: 'Đăng xuất tài khoản?',
                message: 'Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng các tính năng của hệ thống.'
            });
        }
    };

    const handleConfirmAction = async () => {
        const type = confirmModal.type;
        setConfirmModal(prev => ({ ...prev, isOpen: false })); // Đóng modal trước

        if (type === 'clearFace') {
            try {
                setLoading(true);
                await userService.clearFace();
                setFaceCount(0);
                toast.success("Đã xóa toàn bộ mẫu mặt.");
            } catch (err) { toast.error("Lỗi khi xóa dữ liệu."); }
            finally { setLoading(false); }
        } else if (type === 'logout') {
            localStorage.clear();
            navigate('/login');
        }
    };

    // --- CÁC HÀM CẬP NHẬT ẢNH & PROFILE GIỮ NGUYÊN ---
    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setCropModal({ isOpen: true, image: reader.result, type: type, aspect: type === 'avatar' ? 1 : 16 / 9 });
            reader.readAsDataURL(file);
            e.target.value = null;
        }
    };

    const handleCropComplete = async (pixels) => {
        console.log('pixels', pixels);
        try {
            const { blob, url } = await getCroppedImg(cropModal.image, pixels);
            setPreviews(prev => ({ ...prev, [cropModal.type]: url }));
            setFiles(prev => ({ ...prev, [cropModal.type]: blob }));
            setCropModal({ isOpen: false, image: null, type: null, aspect: 1 });
        } catch (err) { toast.error("Lỗi khi cắt ảnh"); }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error('Mật khẩu không khớp!');
            setLoading(false);
            return;
        }
        try {
            const data = new FormData();
            data.append('fname', formData.fname);
            data.append('username', formData.username);
            data.append('email', formData.email);
            if (formData.password) data.append('password', formData.password);
            if (files.avatar) data.append('avatar', files.avatar, 'avatar.jpg');
            if (files.cover) data.append('cover', files.cover, 'cover.jpg');
            await userService.updateProfile(data);
            toast.success('Cập nhật thành công');
        } catch (err) { toast.error('Lỗi khi cập nhật'); }
        finally { setLoading(false); }
    };

    return (
        <div className="h-screen flex flex-col bg-white font-sans overflow-hidden select-none">
            {/* Modal Xác nhận dùng chung */}
            <ConfirmModal
                isLoading = {loading}
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={handleConfirmAction}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />

            <AnimatePresence>
                {viewerConfig.isOpen && (
                    <ImageViewer
                        images={viewerConfig.images}
                        initialIndex={viewerConfig.index}
                        onClose={() => setViewerConfig({ ...viewerConfig, isOpen: false })}
                        // Trong trang Settings thường không xóa/đổi tên trực tiếp tại đây nên có thể để trống
                        onDelete={() => { }}
                        onRename={() => { }}
                    />
                )}
            </AnimatePresence>

            {/* Modal Cắt Ảnh */}
            <ImageCropper
                isOpen={cropModal.isOpen}
                image={cropModal.image}
                aspect={cropModal.aspect}
                onCropComplete={handleCropComplete}
                onCancel={() => setCropModal({ ...cropModal, isOpen: false })} />


            {/* Header: Cover & Avatar */}
            <div className="flex-none bg-white border-b border-slate-100 shadow-sm z-10">
                <div className="relative h-40 w-full bg-slate-200">
                    <img
                        src={previews.cover || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80"}
                        alt="Cover"
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => openImageViewer('cover')}
                    />
                    <button type="button" onClick={() => coverInputRef.current?.click()} className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-black/60 transition-all z-20"><Camera size={18} /></button>
                </div>
                <div className="max-w-3xl mx-auto px-6">
                    <div className="relative flex flex-col items-center -mt-12 pb-4">
                        <div className="relative">
                            <img
                                src={previews.avatar || `https://ui-avatars.com/api/?name=${formData.username}`}
                                alt="Avatar"
                                className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => openImageViewer('avatar')}
                            />
                            <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full border-2 border-white shadow-md"><Camera size={14} /></button>
                        </div>
                        <div className="text-center mt-2">
                            <h1 className="text-xl font-black text-slate-900 flex items-center justify-center gap-1">{formData.fname || "User"} <CheckCircle2 size={16} className="text-blue-500" /></h1>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-tight">@{formData.username}</p>
                        </div>
                    </div>
                    <div className="flex justify-center pb-4">
                        <div className="bg-slate-100 p-1 rounded-2xl flex w-full max-w-[320px] border border-slate-200/50">
                            <button onClick={() => setActiveTab('profile')} className={`flex-1 py-2 text-[13px] font-bold rounded-xl transition-all ${activeTab === 'profile' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}>Hồ sơ</button>
                            <button onClick={() => setActiveTab('appearance')} className={`flex-1 py-2 text-[13px] font-bold rounded-xl transition-all ${activeTab === 'appearance' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}>Giao diện</button>
                        </div>
                    </div>
                </div>
            </div>

            {loadingUser ? (
                <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                    <Loader2 className="animate-spin mb-4" size={32} />
                    <p className="text-sm font-medium">Đang tải nội dung...</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto bg-slate-50/30">
                    <main className="max-w-2xl mx-auto px-4 py-8 pb-32">
                        {activeTab === 'profile' ? (
                            <div className="space-y-6">

                                {/* --- QUẢN LÝ FACEID --- */}
                                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                                    <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-transparent">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200"><ScanFace size={20} /></div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">FaceID Bio</h3>
                                                <p className="text-[11px] text-slate-500 font-bold">
                                                    Mẫu hiện tại: <span className={faceCount >= 5 ? 'text-red-500' : 'text-blue-600'}>{faceCount}/5</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {faceCount > 0 && (
                                                <button onClick={() => openConfirm('clearFace')} className="bg-red-50 text-red-500 p-2 rounded-2xl hover:bg-red-100 active:scale-95 transition-all"><Trash2 size={18} /></button>
                                            )}
                                            <button disabled={faceCount >= 5} onClick={() => setIsCameraOpen(true)} className="bg-slate-900 text-white px-4 py-1.5 rounded-2xl text-[10px] font-black hover:bg-blue-600 transition-all shadow-md active:scale-95 disabled:opacity-40">
                                                {faceCount >= 5 ? 'ĐẦY' : 'THÊM'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <AnimatePresence>
                                            {isCameraOpen && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
                                                    <motion.div initial={{ scale: 0.8, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.8, y: 20, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl">
                                                        <div className="p-6 text-center border-b border-slate-50">
                                                            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-3"><ScanFace className="text-blue-600" size={24} /></div>
                                                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Thêm FaceID</h3>
                                                            <p className="text-[11px] text-slate-500 font-bold mt-1 px-6">Gương mặt trong khung để đăng ký mẫu {faceCount + 1}</p>
                                                        </div>
                                                        <div className="p-8 flex justify-center bg-slate-50/50">
                                                            <FaceRecognition onCapture={handleRegisterFace} onClose={() => setIsCameraOpen(false)} loading={isFaceLoading} buttonText="Lưu dữ liệu" />
                                                        </div>
                                                    </motion.div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* --- FORM THÔNG TIN --- */}
                                <form onSubmit={handleUpdate} className="space-y-6">
                                    <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                                        <div className="p-5 border-b border-slate-50 flex items-center gap-2">
                                            <User size={18} className="text-blue-600" />
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Hồ sơ cá nhân</span>
                                        </div>
                                        <div className="p-6 space-y-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-slate-400 ml-1">HỌ TÊN</label>
                                                    <input type="text" className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-100 font-bold text-slate-700" value={formData.fname} onChange={(e) => setFormData({ ...formData, fname: e.target.value })} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-slate-400 ml-1">EMAIL</label>
                                                    <input type="email" className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-100 font-bold text-slate-700" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">Tên đăng nhập</label>
                                                <input type="text" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-slate-700 opacity-70 cursor-not-allowed" value={formData.username} readOnly />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                                        <div className="p-5 border-b border-slate-50 flex items-center gap-2">
                                            <KeyRound size={18} className="text-orange-500" />
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Bảo mật</span>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <input type="password" placeholder="Mật khẩu mới" className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-100 font-bold" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                                <input type="password" placeholder="Xác nhận lại" className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-100 font-bold" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-slate-900 text-white py-5 rounded-[2rem] font-black shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-70">
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                        {loading ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
                                    </button>
                                </form>

                                <button onClick={() => openConfirm('logout')} className="w-full py-4 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-50 rounded-3xl transition-all flex items-center justify-center gap-2">
                                    <LogOut size={16} /> Đăng xuất tài khoản
                                </button>
                            </div>
                        ) : (
                            <div className="p-20 text-center flex flex-col items-center opacity-40">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Camera size={32} /></div>
                                <p className="text-xs font-black uppercase tracking-widest">Giao diện đang cập nhật...</p>
                            </div>
                        )}
                    </main>
                </div>
            )}

            <input type="file" className="hidden" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" />
            <input type="file" className="hidden" ref={coverInputRef} onChange={(e) => handleFileChange(e, 'cover')} accept="image/*" />
        </div>
    );
}