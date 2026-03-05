import React from 'react';

const FullScreenSpinner = ({title}) => {
    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white/5 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold text-sm animate-pulse">
                    {title}
                </p>
            </div>
        </div>
    );
};

export default FullScreenSpinner;