import React from 'react';
import { Pencil, Move, Trash2, X } from 'lucide-react';

const ActionDock = ({ selectedCount, onEdit, onMove, onDelete, onCancel }) => {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto bg-slate-900/95 backdrop-blur-xl text-white p-4 rounded-[2rem] flex justify-around items-center shadow-2xl z-50 animate-in slide-in-from-bottom-10">

            {/* Nút Sửa: Chỉ hiện khi chọn đúng 1 item */}
            {selectedCount === 1 && (
                <button
                    onClick={onEdit}
                    className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
                >
                    <Pencil className="w-5 h-5 text-amber-400" />
                    <span className="text-[9px] font-bold">SỬA</span>
                </button>
            )}

            {/* Nút Di chuyển */}
            <button
                onClick={onMove}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
            >
                <Move className="w-5 h-5 text-blue-400" />
                <span className="text-[9px] font-bold">DI CHUYỂN</span>
            </button>

            {/* Nút Xóa */}
            <button
                onClick={onDelete}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
            >
                <Trash2 className="w-5 h-5 text-red-400" />
                <span className="text-[9px] font-bold">XÓA</span>
            </button>

            <div className="w-px h-6 bg-slate-700 mx-2" />

            {/* Nút Hủy */}
            <button
                onClick={onCancel}
                className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
            >
                <X className="w-5 h-5 text-slate-400" />
                <span className="text-[9px] font-bold text-slate-400">HỦY</span>
            </button>
        </div>
    );
};

export default ActionDock;