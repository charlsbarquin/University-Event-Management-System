// src/components/upload/FileUploadModal.jsx
import React, { useState, useRef } from 'react';
import { uploadService } from '../../services/upload';
import { toast } from 'react-hot-toast';

const FileUploadModal = ({ eventId, mediaType, onClose, onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Filter files based on mediaType
    const filteredFiles = selectedFiles.filter(file => {
      if (mediaType === 'banner') {
        return file.type.startsWith('image/');
      } else if (mediaType === 'images') {
        return file.type.startsWith('image/');
      } else if (mediaType === 'videos') {
        return file.type.startsWith('video/');
      }
      return false;
    });
    
    setFiles(prev => [...prev, ...filteredFiles.map(file => 
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        status: 'pending'
      })
    )]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    // Filter files based on mediaType
    const filteredFiles = droppedFiles.filter(file => {
      if (mediaType === 'banner') {
        return file.type.startsWith('image/');
      } else if (mediaType === 'images') {
        return file.type.startsWith('image/');
      } else if (mediaType === 'videos') {
        return file.type.startsWith('video/');
      }
      return false;
    });
    
    setFiles(prev => [...prev, ...filteredFiles.map(file => 
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        status: 'pending'
      })
    )]);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('mediaType', mediaType);
    
    files.forEach(file => {
      if (mediaType === 'banner') {
        formData.append('banner', file);
      } else if (mediaType === 'images') {
        formData.append('images', file);
      } else if (mediaType === 'videos') {
        formData.append('videos', file);
      }
    });

    try {
      const result = await uploadService.uploadEventMedia(eventId, formData);
      
      // Simulate progress for better UX
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      if (result.success) {
        setProgress(100);
        toast.success(`Uploaded ${result.data.uploadedFiles.length} file(s) successfully`);
        onUploadComplete?.(result.data);
        setTimeout(() => onClose(), 1000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => {
      const newFiles = [...prev];
      // Revoke object URL to prevent memory leak
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const openFilePicker = () => {
    fileInputRef.current.click();
  };

  const getMediaTypeText = () => {
    switch(mediaType) {
      case 'banner': return 'Event Banner';
      case 'images': return 'Event Images';
      case 'videos': return 'Event Videos';
      default: return 'Files';
    }
  };

  const getAcceptType = () => {
    switch(mediaType) {
      case 'banner': return 'image/*';
      case 'images': return 'image/*';
      case 'videos': return 'video/*';
      default: return '*/*';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Upload {getMediaTypeText()}
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 text-xl"
              disabled={uploading}
            >
              ✕
            </button>
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept={getAcceptType()}
            multiple={mediaType !== 'banner'}
            className="hidden"
          />

          {/* Dropzone */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={openFilePicker}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              uploading ? 'cursor-not-allowed bg-gray-100' : 'border-gray-300 hover:border-primary-500 hover:bg-primary-50'
            }`}
          >
            <div className="text-gray-600">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 font-medium">
                {uploading ? 'Upload in progress...' : 'Click or drag files here'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {mediaType === 'banner' ? 'Single image file (max 10MB)' :
                 mediaType === 'images' ? 'Multiple image files (max 10MB each)' :
                 'Multiple video files (max 50MB each)'}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openFilePicker();
                }}
                disabled={uploading}
                className={`mt-4 px-4 py-2 rounded-md ${
                  uploading 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                Select Files
              </button>
            </div>
          </div>

          {/* File Preview */}
          {files.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-2">Selected Files ({files.length})</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      {file.type.startsWith('image/') && (
                        <img 
                          src={file.preview} 
                          alt={file.name} 
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      {file.type.startsWith('video/') && (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-600">🎬</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1]}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="text-red-500 hover:text-red-700"
                      disabled={uploading}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {uploading && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 rounded-md"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              className={`px-4 py-2 rounded-md ${
                files.length === 0 || uploading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {uploading ? 'Uploading...' : `Upload ${files.length} File(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;