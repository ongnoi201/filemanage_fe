import React, { useState, useEffect } from 'react';
import { Image, Folder, MoreHorizontal, Loader2 } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';
// Import userService bạn đã định nghĩa
import userService from '../services/userService';
import FullScreenSpinner from '../components/FullScreenSpinner';

export default function Dashboard() {
    // 1. Khởi tạo state để lưu dữ liệu từ API
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // 2. Gọi API khi component load
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await userService.getStorageStats();
                if (response.success) {
                    setStats(response.data);
                }
            } catch (error) {
                console.error("Lỗi khi lấy thống kê:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // 3. Chuẩn bị dữ liệu cho biểu đồ BarChart
    // Vì API hiện tại chưa trả về chi tiết từng folder, ta dùng dữ liệu tổng hợp
    const CHART_DATA = [
        { name: 'Ảnh', count: stats?.counts?.photos, color: '#3b82f6' },
        { name: 'Thư mục', count: stats?.counts?.folders, color: '#10b981' },
        { name: 'Tệp gốc', count: stats?.counts?.rootFiles, color: '#f59e0b' },
    ];

    // Chuyển đổi đơn vị Bytes sang GB để hiển thị (Nếu backend trả về bytes)
    // Giả sử backend trả về đơn vị phù hợp, nếu là bytes hãy chia cho 1024^3
    const formatGB = (bytes) => (bytes / (1024 * 1024 * 1024)).toFixed(4);

    // Lấy thông số từ API
    const usedStorage = stats?.storage.used;
    const totalStorage = stats?.storage.total;
    const usedPercentage = parseFloat(stats?.storage.usedPercentage);

    return (
        <div className="min-h-screen bg-white font-sans select-none pb-20">
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 px-6 py-5">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Tổng quan hệ thống</h1>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.1em]">Báo cáo dữ liệu thời gian thực</p>
                </div>
            </header>

            {!loading ? (
                <main className="max-w-6xl mx-auto px-6 mt-28 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Thẻ Tổng số ảnh - Lấy từ stats.counts.photos */}
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                                <Image size={32} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tổng số ảnh</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-3xl font-black text-slate-900">{stats.counts.photos.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Thẻ Thư mục - Lấy từ stats.counts.folders */}
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                                <Folder size={32} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thư mục hiện có</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-3xl font-black text-slate-900">{stats.counts.folders}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Biểu đồ phân bổ dữ liệu */}
                        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <h3 className="font-black text-slate-800 tracking-tight mb-8">Phân bổ tệp tin</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={CHART_DATA} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={45}>
                                            {CHART_DATA.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Widget Dung lượng thực tế */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center">
                            <h3 className="font-black text-slate-800 tracking-tight self-start mb-6">Bộ nhớ hệ thống</h3>

                            <div className="relative flex items-center justify-center my-4">
                                <svg className="w-44 h-44 transform -rotate-90">
                                    <circle cx="88" cy="88" r="75" stroke="#f1f5f9" strokeWidth="14" fill="transparent" />
                                    <circle
                                        cx="88" cy="88" r="75" stroke="#3b82f6" strokeWidth="14" fill="transparent"
                                        strokeDasharray={471}
                                        strokeDashoffset={471 - (471 * (usedPercentage / 100))}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-3xl font-black text-slate-900">{usedPercentage}%</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đã dùng</span>
                                </div>
                            </div>

                            <div className="w-full space-y-3 mt-6">
                                <div className="flex justify-between p-4 bg-slate-50 rounded-2xl">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Đang dùng</span>
                                    <span className="text-sm font-black text-blue-600">{formatGB(usedStorage)} GB</span>
                                </div>
                                <div className="flex justify-between p-4 bg-slate-50 rounded-2xl">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Còn trống</span>
                                    <span className="text-sm font-black text-slate-700">{formatGB(stats.storage.remaining)} GB</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                    <Loader2 className="animate-spin mb-4" size={32} />
                    <p className="text-sm font-medium">Đang tính toán thống kê...</p>
                </div>
            )}

        </div>
    );
}