import { Outlet, Link, useLocation } from 'react-router-dom';

const navItems = [
    { name: 'Thống kê', path: '/', icon: '📊' },
    { name: 'Gần đây', path: '/recent', icon: '🕒' },
    { name: 'Quản lý', path: '/manage', icon: '📂' },
    { name: 'Cài đặt', path: '/settings', icon: '⚙️' },
];

export default function MainLayout() {
    const { pathname } = useLocation();

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-white text-gray-800">
            {/* Sidebar cho Desktop */}
            <aside className="hidden md:flex w-64 bg-white shadow-md flex-col sticky top-0 h-screen">
                <div className="p-6 text-2xl font-bold text-blue-600 tracking-tight">PhotoCloud</div>
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === item.path ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Bottom Navigation cho Mobile */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-3 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex flex-col items-center gap-1 transition-colors ${pathname === item.path ? 'text-blue-600 font-bold' : 'text-gray-400'}`}
                    >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-[10px] uppercase tracking-wider">{item.name}</span>
                    </Link>
                ))}
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}