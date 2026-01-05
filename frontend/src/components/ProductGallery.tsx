import type { ProductImage } from '@/types/product';
import { useState } from 'react';

interface ProductGalleryProps {
  images: ProductImage[] | undefined;
  productName: string;
}

const ProductGallery = ({ images, productName }: ProductGalleryProps) => {
  // Use the first image or a fallback if array is empty
  const [selectedImage, setSelectedImage] = useState(images?.[0]?.image_url || "");

  const displayImage = selectedImage || "https://placehold.co/450x450?text=No+Image";

  return (
    <div className="flex flex-col gap-4">
      {/* 1. MAIN IMAGE CONTAINER 
         - Changed 'aspect-square' to fixed 'h-[450px]' 
         - Added 'max-w-[450px]' to constrain width
         - Added 'mx-auto' to center it in the column
      */}
      <div className="h-[450px] w-full max-w-[450px] mx-auto overflow-hidden rounded-xl border border-gray-200 bg-white relative flex items-center justify-center shadow-sm">
        <img 
          src={displayImage} 
          alt={productName} 
          className="max-h-full max-w-full object-contain p-2 transition-transform duration-500 hover:scale-105"
        />
      </div>

      {/* 2. THUMBNAIL GRID */}
      {images && images.length > 1 && (
        // Added 'justify-center' to center thumbnails under the main image
        <div className="flex gap-3 overflow-x-auto pb-2 justify-center px-4">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(img.image_url)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                selectedImage === img.image_url 
                  ? 'border-blue-600 shadow-md ring-2 ring-blue-100' 
                  : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
              }`}
            >
              <img 
                src={img.image_url} 
                alt={`View ${idx + 1}`} 
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;