import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react'; // Thêm Loader2 từ lucide

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, isLoading = false }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isLoading ? onCancel : undefined} // Không cho đóng khi đang load
                        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
                    />
                    
                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
                    >
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                            <p className="mt-2 text-slate-500 text-sm leading-relaxed">{message}</p>
                        </div>

                        <div className="flex border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={isLoading}
                                className="flex-1 px-6 py-4 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Hủy bỏ
                            </button>
                            
                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={isLoading}
                                className="flex-1 px-6 py-4 text-sm font-semibold text-red-600 hover:bg-red-50 border-l border-slate-100 transition-colors flex items-center justify-center min-h-[56px] disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Xác nhận"
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;