import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Eye, X, ChevronLeft, ChevronRight, Download, Sparkles, ZoomIn } from 'lucide-react';

export interface ScreenshotItem {
  id: number;
  src: string;
  title: string;
  category: string;
  description: string;
}

export const APP_SCREENSHOTS: ScreenshotItem[] = [
  {
    id: 1,
    src: '/assets/screenshot 1.jpg',
    title: 'OrionStore Main Explorer',
    category: 'Home & Feed',
    description: 'Neobrutalist store UI featuring verified APK packages and open-source tools.',
  },
  {
    id: 2,
    src: '/assets/screenshot 2.jpg',
    title: 'Instant Download Engine',
    category: 'Downloads',
    description: 'Direct in-app multi-threaded APK download manager with live speed tracking.',
  },
  {
    id: 3,
    src: '/assets/screenshot 3.jpg',
    title: 'App Categories & Filters',
    category: 'Navigation',
    description: 'Instant filtering by Android APK, Media, Vision AI, Tools, and Web 3D.',
  },
  {
    id: 4,
    src: '/assets/screenshot 4.jpg',
    title: 'In-App Live Update Notifier',
    category: 'Releases',
    description: 'Automatic GitHub tag comparison and version difference checker.',
  },
  {
    id: 5,
    src: '/assets/screenshot 5.jpg',
    title: 'Repository Deep Dive Modal',
    category: 'Details',
    description: 'Complete release notes, file size breakdown, commit history, and direct links.',
  },
  {
    id: 6,
    src: '/assets/screenshot 6.jpg',
    title: 'Developer Starred Collection',
    category: 'Favorites',
    description: 'Curated list of high-value tools, terminal utilities, and Android mods.',
  },
  {
    id: 7,
    src: '/assets/screenshot 7.jpg',
    title: 'Package Security Sentinel',
    category: 'Security',
    description: 'Verified digital signatures and SHA256 integrity checks for safe installs.',
  },
  {
    id: 8,
    src: '/assets/screenshot 8.jpg',
    title: 'Responsive Mobile Layout',
    category: 'Mobile UX',
    description: 'Engineered for smooth 120Hz gesture interaction and high touch responsiveness.',
  },
  {
    id: 9,
    src: '/assets/screenshot 9.jpg',
    title: 'Dynamic Theme & Neobrutalism',
    category: 'Styling',
    description: 'Bold black borders, cream grid textures, and high-contrast yellow accents.',
  },
  {
    id: 10,
    src: '/assets/screenshot 10.jpg',
    title: 'Offline Cache & Fast Sync',
    category: 'Performance',
    description: 'Sub-millisecond navigation cached locally with background stale-while-revalidate.',
  },
];

interface AppScreenshotsGalleryProps {
  onClose?: () => void;
}

export const AppScreenshotsGallery: React.FC<AppScreenshotsGalleryProps> = () => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(APP_SCREENSHOTS.map((s) => s.category)))];

  const filteredScreenshots = activeCategory === 'All'
    ? APP_SCREENSHOTS
    : APP_SCREENSHOTS.filter((s) => s.category === activeCategory);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex - 1 + APP_SCREENSHOTS.length) % APP_SCREENSHOTS.length);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % APP_SCREENSHOTS.length);
    }
  };

  return (
    <div className="w-full my-6 select-none">
      {/* Container Box */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border-[3px] sm:border-4 border-black p-4 sm:p-6 shadow-[5px_5px_0px_#000] sm:shadow-[7px_7px_0px_#000]">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b-2 border-black mb-4 gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#FFE600] border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_#000] flex-shrink-0">
              <ImageIcon className="w-4 h-4 text-black stroke-[2.5]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base tracking-[0.1em] uppercase text-[#6B21A8]">
                  APP SCREENSHOTS & GALLERY
                </h3>
                <span className="text-[10px] font-mono font-black bg-black text-[#FFE600] px-2 py-0.5 rounded-full">
                  {APP_SCREENSHOTS.length} PHOTOS
                </span>
              </div>
              <p className="font-mono text-[11px] text-neutral-600">
                Official high-resolution interface captures and feature previews
              </p>
            </div>
          </div>

          {/* Quick Info Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-600 bg-[#FAF6EE] border-2 border-black px-3 py-1.5 rounded-xl shadow-[1.5px_1.5px_0px_#000]">
            <Sparkles className="w-3.5 h-3.5 text-[#FF5E00]" />
            <span>Click any image to enlarge</span>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto hide-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 text-[11px] sm:text-xs font-bold font-mono rounded-xl border-2 border-black whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_#000]'
                  : 'bg-[#FAF6EE] text-neutral-700 hover:bg-neutral-100 shadow-[1px_1px_0px_#000]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {filteredScreenshots.map((item, idx) => {
            const originalIndex = APP_SCREENSHOTS.findIndex((s) => s.id === item.id);
            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedImageIndex(originalIndex)}
                className="group relative bg-[#FAF6EE] border-2 border-black rounded-xl sm:rounded-2xl overflow-hidden shadow-[2px_2px_0px_#000] sm:shadow-[3px_3px_0px_#000] cursor-pointer flex flex-col transition-all"
              >
                {/* Thumbnail Image Container */}
                <div className="relative aspect-[9/16] w-full bg-neutral-900 overflow-hidden">
                  <img
                    src={item.src}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/assets/orion_logo_512.png';
                    }}
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="p-2 bg-[#FFE600] border-2 border-black rounded-xl text-black shadow-[2px_2px_0px_#000]">
                      <ZoomIn className="w-4 h-4 stroke-[2.5]" />
                    </span>
                  </div>

                  {/* Top Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="text-[9px] font-mono font-black bg-black/85 text-white px-1.5 py-0.5 rounded shadow">
                      #{item.id}
                    </span>
                  </div>
                </div>

                {/* Footer Caption */}
                <div className="p-2 sm:p-2.5 bg-white border-t-2 border-black flex flex-col justify-between flex-1">
                  <h4 className="font-black text-xs text-black truncate leading-tight">
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-neutral-500">
                    <span className="truncate">{item.category}</span>
                    <Eye className="w-3 h-3 text-neutral-400 group-hover:text-black flex-shrink-0" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImageIndex(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-white border-4 border-black rounded-2xl sm:rounded-3xl shadow-[8px_8px_0px_#000] overflow-hidden flex flex-col max-h-[92vh]"
            >
              {/* Modal Top Bar */}
              <div className="p-3 sm:p-4 bg-[#FFE600] border-b-4 border-black flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-3 h-3 bg-black rounded-full" />
                  <div className="min-w-0">
                    <h3 className="font-black text-xs sm:text-sm uppercase tracking-tight text-black truncate">
                      {APP_SCREENSHOTS[selectedImageIndex].title}
                    </h3>
                    <p className="font-mono text-[10px] text-neutral-800">
                      Screenshot {selectedImageIndex + 1} of {APP_SCREENSHOTS.length} — {APP_SCREENSHOTS[selectedImageIndex].category}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={APP_SCREENSHOTS[selectedImageIndex].src}
                    download={`OrionStore-screenshot-${selectedImageIndex + 1}.jpg`}
                    className="p-1.5 bg-white border-2 border-black rounded-xl text-black hover:bg-neutral-100 shadow-[1.5px_1.5px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                    title="Download high-resolution image"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                  </a>
                  <button
                    onClick={() => setSelectedImageIndex(null)}
                    className="p-1.5 bg-white border-2 border-black rounded-xl text-black hover:bg-neutral-100 shadow-[1.5px_1.5px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Main Image Viewer Area */}
              <div className="relative flex-1 bg-neutral-950 flex items-center justify-center p-2 sm:p-4 min-h-[300px] sm:min-h-[460px] overflow-hidden">
                <img
                  src={APP_SCREENSHOTS[selectedImageIndex].src}
                  alt={APP_SCREENSHOTS[selectedImageIndex].title}
                  className="max-h-[62vh] w-auto max-w-full object-contain rounded-lg border-2 border-black/50 shadow-2xl"
                />

                {/* Left Navigation Arrow */}
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-[#FFE600] border-2 border-black rounded-xl shadow-[3px_3px_0px_#000] text-black hover:bg-yellow-300 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer z-10"
                  title="Previous image"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[3]" />
                </button>

                {/* Right Navigation Arrow */}
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#FFE600] border-2 border-black rounded-xl shadow-[3px_3px_0px_#000] text-black hover:bg-yellow-300 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer z-10"
                  title="Next image"
                >
                  <ChevronRight className="w-5 h-5 stroke-[3]" />
                </button>
              </div>

              {/* Description Footer */}
              <div className="p-3 sm:p-4 bg-[#FAF6EE] border-t-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="font-mono text-xs text-neutral-800">
                  {APP_SCREENSHOTS[selectedImageIndex].description}
                </p>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-mono font-bold bg-white border border-black px-2 py-0.5 rounded">
                    1080 × 2400 HD
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-[#FFE600] border border-black px-2 py-0.5 rounded">
                    VERIFIED
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
