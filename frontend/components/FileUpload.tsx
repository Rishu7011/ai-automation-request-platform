'use client';

import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploadProps {
  requestId: string;
  stage: number;
  onUploadSuccess: (attachment: unknown, analysis?: unknown) => void;
}

export default function FileUpload({ requestId, stage, onUploadSuccess }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setIsUploading(true);
    setUploadedFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('requestId', requestId);
      formData.append('stage', stage.toString());

      const res = await fetch('/api/intake/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onUploadSuccess(data.attachment, data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadedFileName(null);
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full my-3">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={onFileSelect}
          accept=".pdf,.docx,.doc,.xlsx,.csv,.png,.jpg,.jpeg,.mp4,text/plain"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          {isUploading ? (
            <div className="flex items-center space-x-2 text-indigo-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Uploading &amp; analyzing &quot;{uploadedFileName}&quot;…</span>
            </div>
          ) : uploadedFileName && !error ? (
            <div className="flex items-center space-x-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Attached: {uploadedFileName}</span>
            </div>
          ) : (
            <>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs text-gray-300">
                <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop files (PDF, DOCX, XLSX, CSV, PNG, MP4)
              </div>
              <p className="text-[10px] text-gray-500">Max size: 15MB. SOPs & spreadsheets will be analyzed by AI.</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-2 flex items-center space-x-2 text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
