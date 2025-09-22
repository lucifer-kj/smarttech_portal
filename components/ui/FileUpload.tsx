'use client';

import * as React from "react";
import NextImage from "next/image";
import { cn } from "@/lib/utils/cn";
import { Upload, X, File, Image, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "./Button";

export interface FileUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  onUpload?: (files: File[]) => void;
  onRemove?: (file: File) => void;
  files?: File[];
  disabled?: boolean;
  dragAndDrop?: boolean;
  showPreview?: boolean;
}

interface FileWithPreview extends File {
  preview?: string;
  status?: 'uploading' | 'success' | 'error';
  progress?: number;
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({ 
    className, 
    accept,
    multiple = false,
    maxSize = 10 * 1024 * 1024, // 10MB default
    maxFiles = 10,
    onUpload,
    onRemove,
    files = [],
    disabled = false,
    dragAndDrop = true,
    showPreview = true,
    ...props 
  }, ref) => {
    const [dragActive, setDragActive] = React.useState(false);
    const [fileList, setFileList] = React.useState<FileWithPreview[]>(files);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const getFileIcon = (file: File) => {
      if (file.type.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
      if (file.type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
      return <File className="h-8 w-8 text-gray-500" />;
    };

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const validateFile = (file: File) => {
      if (file.size > maxSize) {
        return `File size must be less than ${formatFileSize(maxSize)}`;
      }
      if (accept && !file.type.match(accept.replace(/\*/g, '.*'))) {
        return 'File type not allowed';
      }
      return null;
    };

    const handleFiles = (newFiles: FileList | File[]) => {
      const filesArray = Array.from(newFiles);
      const validFiles: FileWithPreview[] = [];
      const errors: string[] = [];

      filesArray.forEach(file => {
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          const fileWithPreview: FileWithPreview = file;
          if (file.type.startsWith('image/') && showPreview) {
            fileWithPreview.preview = URL.createObjectURL(file);
          }
          fileWithPreview.status = 'success';
          validFiles.push(fileWithPreview);
        }
      });

      if (errors.length > 0) {
        console.warn('File validation errors:', errors);
      }

      if (validFiles.length > 0) {
        const updatedFiles = multiple ? [...fileList, ...validFiles] : validFiles;
        setFileList(updatedFiles.slice(0, maxFiles));
        onUpload?.(validFiles);
      }
    };

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles && droppedFiles.length > 0) {
        handleFiles(droppedFiles);
      }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        handleFiles(selectedFiles);
      }
    };

    const removeFile = (fileToRemove: FileWithPreview) => {
      const updatedFiles = fileList.filter(file => file !== fileToRemove);
      setFileList(updatedFiles);
      onRemove?.(fileToRemove);
      
      // Clean up preview URL
      if (fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
    };

    const openFileDialog = () => {
      if (!disabled) {
        fileInputRef.current?.click();
      }
    };

    React.useEffect(() => {
      return () => {
        // Clean up preview URLs on unmount
        fileList.forEach(file => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
      };
    }, [fileList]);

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {/* Upload Area */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            dragActive && "border-primary-500 bg-primary-50",
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && "hover:border-primary-400 hover:bg-surface-50",
            "border-surface-300"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled}
          />

          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-surface-100 rounded-full flex items-center justify-center">
              <Upload className="h-6 w-6 text-surface-600" />
            </div>
            
            <div>
              <p className="text-sm font-medium text-surface-900">
                {dragAndDrop ? "Drag and drop files here" : "Choose files to upload"}
              </p>
              <p className="text-xs text-surface-500 mt-1">
                or{' '}
                <button
                  type="button"
                  onClick={openFileDialog}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                  disabled={disabled}
                >
                  browse files
                </button>
              </p>
            </div>

            <div className="text-xs text-surface-400">
              <p>Max file size: {formatFileSize(maxSize)}</p>
              {accept && <p>Accepted formats: {accept}</p>}
              {maxFiles > 1 && <p>Max files: {maxFiles}</p>}
            </div>
          </div>
        </div>

        {/* File List */}
        {fileList.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-surface-900">Uploaded Files</h4>
            <div className="space-y-2">
              {fileList.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between p-3 bg-surface-50 rounded-lg border border-border"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {file.preview ? (
                      <NextImage
                        src={file.preview}
                        alt={file.name}
                        className="h-10 w-10 object-cover rounded"
                        width={40}
                        height={40}
                      />
                    ) : (
                      getFileIcon(file)
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-surface-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {file.status === 'success' && (
                        <CheckCircle className="h-4 w-4 text-success-600" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-danger-600" />
                      )}
                      {file.status === 'uploading' && (
                        <div className="h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                  </div>

                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => removeFile(file)}
                    disabled={disabled}
                    className="ml-2 text-surface-400 hover:text-danger-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);
FileUpload.displayName = "FileUpload";

// Image Upload Component
export interface ImageUploadProps extends Omit<FileUploadProps, 'accept' | 'showPreview'> {
  aspectRatio?: string;
  maxWidth?: number;
  maxHeight?: number;
}

const ImageUpload = React.forwardRef<HTMLDivElement, ImageUploadProps>(
  ({ 
    // aspectRatio = "16/9", // TODO: Implement aspect ratio validation
    // maxWidth = 1920, // TODO: Implement max width validation
    // maxHeight = 1080, // TODO: Implement max height validation
    ...props 
  }, ref) => {
    return (
      <FileUpload
        ref={ref}
        accept="image/*"
        showPreview={true}
        {...props}
      />
    );
  }
);
ImageUpload.displayName = "ImageUpload";

// Document Upload Component
export interface DocumentUploadProps extends Omit<FileUploadProps, 'accept'> {
  allowedTypes?: string[];
}

const DocumentUpload = React.forwardRef<HTMLDivElement, DocumentUploadProps>(
  ({ 
    allowedTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf'],
    ...props 
  }, ref) => {
    const acceptString = allowedTypes.map(type => `.${type}`).join(',');

    return (
      <FileUpload
        ref={ref}
        accept={acceptString}
        showPreview={false}
        {...props}
      />
    );
  }
);
DocumentUpload.displayName = "DocumentUpload";

export { FileUpload, ImageUpload, DocumentUpload };
