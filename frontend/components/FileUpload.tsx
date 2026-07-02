'use client';

import { useRef, useState, useEffect } from 'react';
import { FileText, Plus, X } from 'lucide-react';
import {
  Attachment,
  AttachmentActions,
  AttachmentAction,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  state: 'idle' | 'uploading' | 'done' | 'error';
}

interface FileUploadProps {
  /** Whether the trigger button should be disabled */
  disabled?: boolean;
  /** Called when a user selects a file from native file picker */
  onFileSelect?: (file: File) => void;
  /** Accepted file extensions / MIME types passed to <input accept> */
  accept?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FileUpload({
  disabled = false,
  onFileSelect,
  accept = '.pdf,.doc,.docx,.csv,.xlsx,.txt',
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState('');

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;

    setUploadError('');

    for (const file of selected) {
      if (file.type.startsWith('image/')) {
        setUploadError('Image files are disabled. Please attach document files only (PDF, DOCX, CSV, XLSX, TXT).');
        continue;
      }
      onFileSelect?.(file);
    }

    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-1">
      {uploadError && (
        <p className="text-[#ffb4ab] text-[10px] font-semibold px-1">{uploadError}</p>
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={handleSelect}
      />

      {/* + trigger button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        title="Attach document to request"
        aria-label="Attach document to request"
        className="
          flex-shrink-0 w-11 h-11 rounded-xl
          bg-[#1f1f27] border border-[#464554]/40
          hover:border-[#6366f1] hover:bg-[#34343d]
          disabled:opacity-40 disabled:cursor-not-allowed
          flex items-center justify-center
          text-[#908fa0] hover:text-[#c0c1ff]
          transition-all cursor-pointer shadow-sm
        "
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}


