import React, { useState, useEffect } from 'react'; // 1. Thêm useEffect
import { PhotoProvider, PhotoSlider } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { Trash2, Edit3, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

const ImageViewer = ({ images, initialIndex, onClose, onDelete, onRename }) => {
    const [index, setIndex] = useState(initialIndex);
    const [isPlaying, setIsPlaying] = useState(false);
    const SLIDE_DURATION = 3000; // Thời gian chuyển ảnh (3 giây)

    // 2. Logic Trình chiếu
    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setIndex((prevIndex) => (prevIndex + 1) % images.length);
            }, SLIDE_DURATION);
        }
        return () => clearInterval(interval); // Clean up khi pause hoặc unmount
    }, [isPlaying, images.length]);

    const photoItems = images.map(img => ({
        key: img._id,
        src: img.url || img.thumbnail || img.path,
        intro: img.name,
    }));

    return (
        <PhotoProvider 
            maskOpacity={0.98}
            pullDownToClose={false}
        >
            <PhotoSlider
                images={photoItems}
                visible={true}
                index={index}
                onIndexChange={setIndex}
                onClose={onClose}
                
                overlayRender={({ index: currentIndex }) => {
                    const currentImg = images[currentIndex];
                    
                    return (
                        <div className="absolute inset-0 pointer-events-none flex flex-col justify-end items-center pb-8">
                            <div className="z-[1000] pointer-events-auto flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
                                
                                {/* Nút Previous */}
                                <button 
                                    onClick={() => {
                                        setIsPlaying(false); // Dừng trình chiếu khi tương tác thủ công
                                        setIndex((prev) => (prev - 1 + images.length) % images.length);
                                    }}
                                    className="p-2 hover:bg-white/10 text-white rounded-full transition-colors active:scale-95"
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <div className="h-4 w-[1px] bg-white/20 mx-1" />

                                {/* Nút Play/Pause - Điều khiển trình chiếu */}
                                <button 
                                    onClick={() => setIsPlaying(!isPlaying)} 
                                    className={`p-2 rounded-full transition-all active:scale-95 ${
                                        isPlaying ? 'bg-blue-500 text-white' : 'hover:bg-white/10 text-white'
                                    }`}
                                >
                                    {isPlaying ? (
                                        <Pause size={18} fill="currentColor" />
                                    ) : (
                                        <Play size={18} fill="currentColor" className="ml-0.5" />
                                    )}
                                </button>

                                {onRename && (
                                    <button 
                                        onClick={() => onRename(currentImg._id, currentImg.name)} 
                                        className="p-2 hover:bg-white/10 text-white rounded-full transition-colors active:scale-95"
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                )}

                                {onDelete && (
                                    <button 
                                        onClick={() => onDelete(currentImg._id)} 
                                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-full transition-colors active:scale-95"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}

                                <div className="h-4 w-[1px] bg-white/20 mx-1" />

                                {/* Nút Next */}
                                <button 
                                    onClick={() => {
                                        setIsPlaying(false); // Dừng trình chiếu khi tương tác thủ công
                                        setIndex((prev) => (prev + 1) % images.length);
                                    }}
                                    className="p-2 hover:bg-white/10 text-white rounded-full transition-colors active:scale-95"
                                >
                                    <ChevronRight size={20} />
                                </button>
                                
                                <span className="ml-2 text-[11px] font-mono text-white/70 pr-2">
                                    {currentIndex + 1}/{images.length}
                                </span>
                            </div>
                        </div>
                    );
                }}
            />
        </PhotoProvider>
    );
};

export default ImageViewer;