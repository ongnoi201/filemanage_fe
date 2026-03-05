export const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = new Image();
    image.src = imageSrc;
    return new Promise((resolve, reject) => {
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(
                image,
                pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
                0, 0, pixelCrop.width, pixelCrop.height
            );
            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error('Canvas is empty'));
                resolve({
                    blob: blob,
                    url: URL.createObjectURL(blob)
                });
            }, 'image/jpeg', 1.0);
        };
        image.onerror = (e) => reject(e);
    });
};