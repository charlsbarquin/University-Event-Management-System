import React, { useState } from 'react';
import { uploadService } from '../../services/upload';
import { toast } from 'react-hot-toast';

const MediaGallery = ({ event, onMediaUpdated }) => {
  const [deleting, setDeleting] = useState(null);
  const [localEvent, setLocalEvent] = useState(event);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxType, setLightboxType] = useState('');

  React.useEffect(() => {
    setLocalEvent(event);
  }, [event]);

  const openLightbox = (type, index) => {
    setLightboxType(type);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    if (lightboxType === 'banner') return;
    
    const items = lightboxType === 'image' ? localEvent.images : localEvent.videos;
    setLightboxIndex((lightboxIndex + 1) % items.length);
  };

  const prevImage = () => {
    if (lightboxType === 'banner') return;
    
    const items = lightboxType === 'image' ? localEvent.images : localEvent.videos;
    setLightboxIndex((lightboxIndex - 1 + items.length) % items.length);
  };

  const handleDeleteMedia = async (mediaType, filename) => {
    console.log('🔍 DELETE START:', { 
      mediaType, 
      filename, 
      eventId: localEvent._id
    });
    
    if (!window.confirm(`Delete this ${mediaType}?`)) {
      return;
    }

    const cleanFilename = filename.split('/').pop();
    setDeleting(cleanFilename);
    
    try {
      const result = await uploadService.deleteEventMedia(
        localEvent._id, 
        mediaType, 
        cleanFilename
      );
      
      if (result.success) {
        toast.success('File deleted successfully');
        
        const updatedEvent = { ...localEvent };
        
        if (mediaType === 'banner') {
          updatedEvent.bannerImage = null;
        } else if (mediaType === 'image') {
          updatedEvent.images = updatedEvent.images.filter(img => 
            !img.url.includes(cleanFilename)
          );
        } else if (mediaType === 'video') {
          updatedEvent.videos = updatedEvent.videos.filter(vid => 
            !vid.url.includes(cleanFilename)
          );
        }
        
        setLocalEvent(updatedEvent);
        
        if (onMediaUpdated) {
          onMediaUpdated(updatedEvent);
        }
      }
    } catch (error) {
      toast.error('Delete failed: ' + (error.message || 'Unknown error'));
    } finally {
      setDeleting(null);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return '';
    
    let imageUrl = url;
    if (url.startsWith('/uploads/')) {
      imageUrl = `http://localhost:5000${url}`;
    } else if (!url.startsWith('http')) {
      imageUrl = `http://localhost:5000/uploads/event-images/${url}`;
    }
    
    return `${imageUrl}?t=${Date.now()}`;
  };

  const renderMediaItem = (media, type, index) => {
    const isImage = type === 'banner' || type === 'image';
    const filename = media.url?.split('/').pop() || 'unknown';
    const imageUrl = getImageUrl(media.url);
    
    return (
      <div key={`${type}-${index}`} className="relative group">
        <div 
          className="cursor-pointer"
          onClick={() => openLightbox(type, index)}
        >
          {isImage ? (
            <img 
              src={imageUrl}
              alt={media.caption || `Event ${type}`}
              className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IiNFNUU1RTUiLz48L3N2Zz4=';
              }}
            />
          ) : (
            <div className="w-full h-32 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
              <div className="text-center">
                <span className="text-white text-2xl">🎬</span>
                <p className="text-white text-xs mt-1">Video</p>
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteMedia(type, filename);
          }}
          disabled={deleting === filename}
          className={`absolute top-2 right-2 p-1.5 rounded-full text-xs ${
            deleting === filename 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100'
          } transition-all`}
          title={`Delete ${type}`}
        >
          {deleting === filename ? '⏳' : '✕'}
        </button>
        
        {media.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
            {media.caption}
          </div>
        )}
      </div>
    );
  };

  // Get current lightbox media
  const getLightboxMedia = () => {
    if (lightboxType === 'banner') {
      return { url: localEvent.bannerImage, type: 'banner' };
    } else if (lightboxType === 'image') {
      return localEvent.images[lightboxIndex];
    } else if (lightboxType === 'video') {
      return localEvent.videos[lightboxIndex];
    }
    return null;
  };

  return (
    <div className="mt-4">
      <h4 className="font-semibold text-gray-700 mb-3">Event Media Gallery</h4>
      
      {/* Banner Image */}
      {localEvent.bannerImage && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h5 className="text-sm font-medium text-gray-600">Banner Image</h5>
          </div>
          <div className="grid grid-cols-1">
            {renderMediaItem({ url: localEvent.bannerImage }, 'banner', 0)}
          </div>
        </div>
      )}

      {/* Images Gallery */}
      {localEvent.images?.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h5 className="text-sm font-medium text-gray-600">
              Gallery Images ({localEvent.images.length})
            </h5>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {localEvent.images.map((image, index) => 
              renderMediaItem(image, 'image', index)
            )}
          </div>
        </div>
      )}

      {/* Videos Gallery */}
      {localEvent.videos?.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h5 className="text-sm font-medium text-gray-600">
              Videos ({localEvent.videos.length})
            </h5>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localEvent.videos.map((video, index) => 
              renderMediaItem(video, 'video', index)
            )}
          </div>
        </div>
      )}

      {!localEvent.bannerImage && !localEvent.images?.length && !localEvent.videos?.length && (
        <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">No media uploaded yet.</p>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl max-h-[90vh]">
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white text-3xl z-10 hover:text-gray-300"
            >
              ✕
            </button>
            
            {/* Navigation arrows (for galleries) */}
            {(lightboxType === 'image' || lightboxType === 'video') && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-3xl z-10 hover:text-gray-300"
                >
                  ‹
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-3xl z-10 hover:text-gray-300"
                >
                  ›
                </button>
              </>
            )}
            
            {/* Media display */}
            <div className="flex items-center justify-center h-full">
              {lightboxType === 'banner' || lightboxType === 'image' ? (
                <img
                  src={getImageUrl(getLightboxMedia()?.url)}
                  alt="Full screen view"
                  className="max-w-full max-h-[80vh] object-contain"
                />
              ) : lightboxType === 'video' ? (
                <div className="w-full max-w-4xl">
                  <video
                    src={getImageUrl(getLightboxMedia()?.url)}
                    controls
                    className="w-full"
                    autoPlay
                  />
                  {getLightboxMedia()?.title && (
                    <p className="text-white text-center mt-2">{getLightboxMedia()?.title}</p>
                  )}
                </div>
              ) : null}
            </div>
            
            {/* Caption */}
            {getLightboxMedia()?.caption && (
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-white bg-black bg-opacity-50 inline-block px-4 py-2 rounded-lg">
                  {getLightboxMedia()?.caption}
                </p>
              </div>
            )}
            
            {/* Counter for galleries */}
            {(lightboxType === 'image' || lightboxType === 'video') && (
              <div className="absolute bottom-4 right-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded-lg">
                {lightboxIndex + 1} / {
                  lightboxType === 'image' 
                    ? localEvent.images.length 
                    : localEvent.videos.length
                }
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaGallery;