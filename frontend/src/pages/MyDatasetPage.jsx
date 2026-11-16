import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Database, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Calendar, 
  Filter, 
  Eye, 
  ArrowRight,
  ShieldCheck,
  Maximize2
} from 'lucide-react';

const MyDatasetPage = () => {
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'original', 'augmented'
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchDataset = async () => {
      try {
        const res = await api.get('/students/my-dataset');
        setDataset(res.data);
      } catch (err) {
        console.error("Failed to load dataset summary", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDataset();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-slate-200/70 rounded-2xl"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-square bg-slate-200/70 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isCompleted = dataset?.capture_status === 'COMPLETED';

  // Empty state if not completed
  if (!isCompleted || !dataset.images || dataset.images.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            No Face Dataset Registered Yet
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
            You have not registered your facial images. Complete the 5-step multi-pose capture to generate your 30-image dataset.
          </p>
        </div>
        <div>
          <Link
            to="/face-registration"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-nitte-700 hover:bg-nitte-800 text-white font-bold text-sm shadow-md transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Begin Face Registration</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    );
  }

  const filteredImages = dataset.images.filter((img) => {
    if (filterType === 'original') return img.image_type === 'original';
    if (filterType === 'augmented') return img.image_type === 'augmented';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Summary Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-3 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified in MySQL Database</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Database className="w-7 h-7 text-nitte-700" />
            <span>My Facial Dataset</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center space-x-4">
            <span>
              Captured on: {dataset.completed_at ? new Date(dataset.completed_at).toLocaleDateString() : 'Recent'}
            </span>
            <span>•</span>
            <span>Stored in MySQL LONGBLOB</span>
          </p>
        </div>

        {/* Counter Badges */}
        <div className="flex items-center space-x-3">
          <div className="bg-nitte-50 border border-nitte-100 rounded-xl px-4 py-3 text-center">
            <span className="block text-2xl font-black text-nitte-900">{dataset.total_original_images}</span>
            <span className="text-[11px] font-semibold text-nitte-700 uppercase">Originals</span>
          </div>
          <div className="text-slate-300 font-bold text-xl">+</div>
          <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-center">
            <span className="block text-2xl font-black text-purple-900">{dataset.total_augmented_images}</span>
            <span className="text-[11px] font-semibold text-purple-700 uppercase">Augmented</span>
          </div>
          <div className="text-slate-300 font-bold text-xl">=</div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-center">
            <span className="block text-2xl font-black text-emerald-900">{dataset.total_images}</span>
            <span className="text-[11px] font-semibold text-emerald-700 uppercase">Total Images</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Image Gallery */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        
        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filter View:</span>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'all' ? 'bg-white text-nitte-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Images ({dataset.total_images})
            </button>
            <button
              onClick={() => setFilterType('original')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'original' ? 'bg-white text-nitte-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Originals Only ({dataset.total_original_images})
            </button>
            <button
              onClick={() => setFilterType('augmented')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'augmented' ? 'bg-white text-nitte-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Augmented Only ({dataset.total_augmented_images})
            </button>
          </div>
        </div>

        {/* Image Grid (Responsive) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {filteredImages.map((img) => (
            <div
              key={img.image_id}
              onClick={() => setSelectedImage(img)}
              className="group relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md cursor-pointer transition-all aspect-square flex flex-col justify-end"
            >
              {/* Image stream from backend */}
              <img
                src={`/api/v1/images/${img.image_id}`}
                alt={img.orientation}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
              />

              {/* Top tag badge */}
              <div className="absolute top-2 left-2 z-10 flex space-x-1">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm ${
                    img.image_type === 'original'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-nitte-700 text-white'
                  }`}
                >
                  {img.image_type === 'original' ? 'ORIGINAL' : 'AUG'}
                </span>
              </div>

              {/* Bottom gradient overlay with metadata */}
              <div className="relative z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                <div className="flex items-center justify-between text-[11px] font-bold capitalize">
                  <span>{img.orientation}</span>
                  <span className="text-[9px] text-slate-300 font-mono font-normal">
                    {img.width}×{img.height}
                  </span>
                </div>
                {img.transformation_type && img.transformation_type !== 'none' && (
                  <p className="text-[10px] text-nitte-200 truncate capitalize font-medium">
                    {img.transformation_type.replace('_', ' ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Image Inspection Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl space-y-4 p-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 capitalize">
                {selectedImage.orientation} Pose • {selectedImage.image_type}
              </h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="aspect-square bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
              <img
                src={`/api/v1/images/${selectedImage.image_id}`}
                alt="Selected"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Image ID:</span>
                <span className="font-mono font-bold text-slate-800">#{selectedImage.image_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Resolution:</span>
                <span className="font-mono text-slate-800">{selectedImage.width} × {selectedImage.height} px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Transformation:</span>
                <span className="font-semibold text-nitte-700 capitalize">
                  {selectedImage.transformation_type || 'None (Original Camera Capture)'}
                </span>
              </div>
              {selectedImage.transformation_parameters && (
                <div className="pt-1.5 border-t border-slate-200">
                  <span className="text-slate-500 font-semibold block mb-1">Parameters:</span>
                  <pre className="bg-white p-2 rounded border border-slate-200 text-[10px] font-mono text-slate-700 overflow-x-auto">
                    {selectedImage.transformation_parameters}
                  </pre>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedImage(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyDatasetPage;
