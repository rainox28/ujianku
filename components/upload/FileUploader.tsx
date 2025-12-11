// components/upload/FileUploader.tsx
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export function FileUploader({
  onUploadComplete,
  onUploadError,
  className,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0];
      if (!selectedFile) return;

      // Validate file type
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ];

      if (!validTypes.includes(selectedFile.type)) {
        setError("Format file tidak didukung. Gunakan PDF, DOCX, atau PPTX.");
        onUploadError?.("Invalid file type");
        return;
      }

      // Validate file size (16MB max)
      if (selectedFile.size > 16 * 1024 * 1024) {
        setError("Ukuran file maksimal 16MB");
        onUploadError?.("File too large");
        return;
      }

      setFile(selectedFile);
      setError(null);
      setUploading(true);

      try {
        // Create form data
        const formData = new FormData();
        formData.append("file", selectedFile);

        // Upload to UploadThing via our API
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Upload failed");
        }

        setUploadedUrl(data.url);
        onUploadComplete(data.url);
      } catch (err: any) {
        setError(err.message || "Gagal mengupload file");
        onUploadError?.(err.message);
        setFile(null);
      } finally {
        setUploading(false);
      }
    },
    [onUploadComplete, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        [".pptx"],
    },
  });

  const removeFile = () => {
    setFile(null);
    setUploadedUrl(null);
    setError(null);
  };

  if (uploadedUrl && file) {
    return (
      <div
        className={cn(
          "flex items-center gap-4 p-4 bg-success-50 rounded-xl border border-success-200",
          className
        )}
      >
        <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-success-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{file.name}</p>
          <p className="text-sm text-success-600">Upload berhasil!</p>
        </div>
        <button
          onClick={removeFile}
          className="p-2 hover:bg-success-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    );
  }

  if (file && uploading) {
    return (
      <div
        className={cn(
          "flex items-center gap-4 p-4 bg-primary-50 rounded-xl border border-primary-200",
          className
        )}
      >
        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
          <div className="loading-spinner text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{file.name}</p>
          <p className="text-sm text-primary-600">Mengupload...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-primary-500 bg-primary-50"
            : "border-gray-300 hover:border-primary-400 hover:bg-primary-50/50",
          error && "border-danger-300 bg-danger-50/50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {error ? (
            <AlertCircle className="w-10 h-10 text-danger-400 mb-3" />
          ) : (
            <Upload className="w-10 h-10 text-gray-400 mb-3" />
          )}
          <p className="mb-2 text-sm text-gray-500">
            {error ? (
              <span className="text-danger-600">{error}</span>
            ) : isDragActive ? (
              <span className="text-primary-600 font-medium">
                Drop file di sini...
              </span>
            ) : (
              <>
                <span className="font-semibold text-primary-600">
                  Klik untuk upload
                </span>{" "}
                atau drag & drop
              </>
            )}
          </p>
          <p className="text-xs text-gray-400">
            PDF, DOCX, atau PPTX (Max 16MB)
          </p>
        </div>
      </div>
    </div>
  );
}
