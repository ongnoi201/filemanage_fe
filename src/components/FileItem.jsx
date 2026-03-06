import React, { memo, useRef, useState, useEffect } from 'react';
import { Folder, FileText, CheckCircle2, Lock } from 'lucide-react';

const FileItem = ({ 
    item, 
    viewMode, 
    isSelected, 
    isSelectionMode, 
    isEditing,
    isLocked, 
    onConfirmEdit,
    onCancelEdit,
    onClick, 
    onLongPress 
}) => {
    const timerRef = useRef(null);
    const inputRef = useRef(null);
    const [tempName, setTempName] = useState(item.name);
    
    const isFolder = item.type === 'folder';
    const isImage = item.url && item.name.match(/\.(jpg|jpeg|png|webp|avif)$/i);

    // Tự động focus và bôi đen tên file khi vào chế độ đổi tên
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            const lastDotIndex = item.name.lastIndexOf('.');
            if (!isFolder && lastDotIndex > 0) {
                inputRef.current.setSelectionRange(0, lastDotIndex);
            } else {
                inputRef.current.select();
            }
        }
    }, [isEditing, item.name, isFolder]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') onConfirmEdit(tempName);
        if (e.key === 'Escape') {
            setTempName(item.name);
            onCancelEdit();
        }
    };

    const handleStart = () => {
        if (isSelectionMode || isEditing) return;
        timerRef.current = setTimeout(() => onLongPress(item), 800);
    };

    const handleEnd = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    // Style cho Grid và List
    const containerStyle = viewMode === 'grid' 
        ? 'flex flex-col p-2.5 w-full h-[220px]' 
        : 'flex items-center p-3 h-[76px] w-full';

    const mediaBoxStyle = viewMode === 'grid' 
        ? 'w-full h-36 mb-3' 
        : 'w-14 h-14 mr-4';

    return (
        <div
            onMouseDown={handleStart}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchEnd={handleEnd}
            onClick={() => !isEditing && onClick(item)}
            className={`relative group transition-all duration-300 cursor-pointer select-none overflow-hidden rounded-2xl border
                ${containerStyle}
                ${isSelected 
                    ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20 scale-[0.97]' 
                    : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200'
                } 
                ${isEditing ? 'ring-2 ring-blue-400 shadow-xl z-20' : ''}`}
        >
            {/* 1. Selection Overlay & Checkbox */}
            {isSelectionMode && !isEditing && (
                <div className="absolute top-2 left-2 z-30 animate-in zoom-in-50">
                    {isSelected ? (
                        <div className="bg-blue-600 rounded-full p-0.5 shadow-lg">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-white/60 backdrop-blur-sm" />
                    )}
                </div>
            )}

            {/* 2. Media Container (Ảnh/Icon) */}
            <div className={`relative flex-shrink-0 flex items-center justify-center rounded-xl overflow-hidden transition-colors
                ${mediaBoxStyle}
                ${isFolder ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}
                ${isLocked ? 'opacity-80 grayscale-[0.3]' : ''}`}
            >
                {isFolder ? (
                    <Folder fill="currentColor" className={`${viewMode === 'grid' ? 'w-16 h-16' : 'w-8 h-8'} opacity-90`} />
                ) : isImage ? (
                    <img 
                        src={item.url} 
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                ) : (
                    <FileText className={`${viewMode === 'grid' ? 'w-12 h-12' : 'w-7 h-7'} opacity-70`} />
                )}

                {/* Lock Badge - Nhỏ gọn ở góc ảnh */}
                {isLocked && (
                    <div className="absolute bottom-1.5 right-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-lg border border-white/20">
                        <Lock className="w-3 h-3 text-white" fill="currentColor" />
                    </div>
                )}
                
                {/* Lớp phủ nhẹ khi hover ảnh */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
            </div>

            {/* 3. Info Section (Tên & Loại) */}
            <div className="min-w-0 flex-1 flex flex-col justify-center">
                {isEditing ? (
                    <input
                        ref={inputRef}
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={() => onConfirmEdit(tempName)}
                        onKeyDown={handleKeyDown}
                        className={`w-full text-sm font-semibold bg-blue-100 text-blue-800 rounded-md px-2 py-1 outline-none ring-2 ring-blue-500
                            ${viewMode === 'grid' ? 'text-center' : ''}`}
                    />
                ) : (
                    <p className={`text-[13.5px] font-bold truncate text-slate-700 leading-tight
                        ${viewMode === 'grid' ? 'text-center px-1' : 'pr-4'}`}
                    >
                        {item.name}
                    </p>
                )}
                
                <div className={`flex items-center gap-1.5 mt-1.5 ${viewMode === 'grid' ? 'justify-center' : ''}`}>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {isFolder ? 'Thư mục' : 'Tài liệu'}
                    </span>
                    {isLocked && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-[9px] text-rose-500 font-bold uppercase">Bảo mật</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(FileItem);