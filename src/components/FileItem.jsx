import React, { memo, useRef, useState, useEffect } from 'react';
import { Folder, FileText, CheckCircle2 } from 'lucide-react';

const FileItem = ({ 
    item, 
    viewMode, 
    isSelected, 
    isSelectionMode, 
    isEditing,
    onConfirmEdit,
    onCancelEdit,
    onClick, 
    onLongPress 
}) => {
    const timerRef = useRef(null);
    const inputRef = useRef(null);
    const [tempName, setTempName] = useState(item.name);
    
    const isFolder = item.type === 'folder';
    const isImage = item.url && item.name.match(/\.(jpg|jpeg|png|webp)$/i);

    // Xử lý Focus và Chọn văn bản khi vào chế độ edit
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            // Bôi đen phần tên, bỏ qua phần mở rộng nếu là file
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
        timerRef.current = setTimeout(() => onLongPress(item), 900);
    };

    const handleEnd = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    return (
        <div
            onMouseDown={handleStart}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchEnd={handleEnd}
            onClick={() => !isEditing && onClick(item)}
            className={`relative group transition-all duration-200 cursor-pointer select-none
                ${viewMode === 'grid' ? 'flex flex-col p-2' : 'flex items-center p-3'}
                ${isSelected 
                    ? 'bg-blue-50 ring-2 ring-blue-500 rounded-2xl scale-[0.98]' 
                    : 'bg-white rounded-2xl border border-transparent shadow-sm hover:shadow-md'
                } ${isEditing ? 'ring-2 ring-blue-400 shadow-lg z-10' : ''}`}
        >
            {isSelectionMode && !isEditing && (
                <div className="absolute top-2 left-2 z-10 animate-in zoom-in-50">
                    {isSelected ? (
                        <CheckCircle2 className="w-6 h-6 text-blue-600 fill-white" />
                    ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-white/50" />
                    )}
                </div>
            )}

            <div className={`flex items-center justify-center rounded-xl overflow-hidden
                ${viewMode === 'grid' ? 'w-full aspect-square mb-2' : 'w-12 h-12 mr-4 flex-shrink-0'} 
                ${isFolder ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-600'}`}
            >
                {isFolder ? (
                    <Folder fill="currentColor" className="w-10 h-10 opacity-80" />
                ) : isImage ? (
                    <img src={item.url} alt="" className="w-full h-full object-cover" />
                ) : (
                    <FileText className="w-8 h-8 opacity-80" />
                )}
            </div>

            <div className="min-w-0 flex-1 text-left">
                {isEditing ? (
                    <input
                        ref={inputRef}
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={() => onConfirmEdit(tempName)}
                        onKeyDown={handleKeyDown}
                        className={`w-full text-[13px] font-bold bg-blue-100 rounded px-1 outline-none ring-0 border-none ${viewMode === 'grid' ? 'text-center' : ''}`}
                    />
                ) : (
                    <p className={`text-[13px] font-bold truncate text-slate-700 ${viewMode === 'grid' ? 'text-center' : ''}`}>
                        {item.name}
                    </p>
                )}
                
                <div className={`flex items-center gap-2 mt-0.5 ${viewMode === 'grid' ? 'justify-center' : ''}`}>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {isFolder ? 'Thư mục' : 'Tệp tin'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default memo(FileItem);