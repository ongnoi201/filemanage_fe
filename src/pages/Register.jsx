import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react'; // Import icon từ Lucide
import userService from '../services/userService';

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // State quản lý ẩn/hiện mật khẩu
    const [formData, setFormData] = useState({
        fname: '',
        username: '',
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (formData.password.length < 6) {
            return toast.warn('Mật khẩu phải từ 6 ký tự trở lên!');
        }

        setLoading(true);
        try {
            await userService.register(formData);
            toast.success('Đăng ký tài khoản thành công!');
            setTimeout(() => navigate('/login'), 1500);

        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Đăng ký không thành công';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[url('https://www.didongmy.com/vnt_upload/news/03_2024/hinh-nen-4k-la-gi-Didongmy.jpg')] bg-cover bg-center">
            <div className="w-full max-w-lg p-10 mx-4 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl text-white">
                <p className="text-center text-white/60 mb-8">Điền thông tin để bắt đầu</p>

                <form className="space-y-4" onSubmit={handleRegister}>
                    {/* Tên thật (fname) */}
                    <div>
                        <label className="text-sm ml-1 text-white/80">Họ và Tên</label>
                        <input
                            name="fname"
                            type="text"
                            required
                            placeholder="Nguyễn Văn A"
                            value={formData.fname}
                            onChange={handleChange}
                            className="w-full px-4 py-3 mt-1 rounded-xl bg-white/10 border border-white/20 focus:bg-white/20 focus:ring-2 focus:ring-purple-400 outline-none transition-all placeholder:text-white/30"
                        />
                    </div>

                    {/* Tên đăng nhập (username) */}
                    <div>
                        <label className="text-sm ml-1 text-white/80">Tên đăng nhập</label>
                        <input
                            name="username"
                            type="text"
                            required
                            placeholder="vancode_123"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-4 py-3 mt-1 rounded-xl bg-white/10 border border-white/20 focus:bg-white/20 focus:ring-2 focus:ring-purple-400 outline-none transition-all placeholder:text-white/30"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="text-sm ml-1 text-white/80">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 mt-1 rounded-xl bg-white/10 border border-white/20 focus:bg-white/20 focus:ring-2 focus:ring-purple-400 outline-none transition-all placeholder:text-white/30"
                        />
                    </div>

                    {/* Mật khẩu (password) */}
                    <div>
                        <label className="text-sm ml-1 text-white/80">Mật khẩu</label>
                        <div className="relative mt-1"> {/* Thêm relative ở đây */}
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"} // Chuyển đổi type
                                required
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:bg-white/20 focus:ring-2 focus:ring-purple-400 outline-none transition-all placeholder:text-white/30"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold rounded-xl shadow-lg transition-all transform active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Đang đăng ký...' : 'Đăng ký ngay'}
                    </button>
                </form>

                <p className="mt-8 text-center text-white/50 text-sm">
                    Đã có tài khoản? <Link to="/login" className="text-pink-600 font-bold hover:underline">Đăng nhập ngay</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;