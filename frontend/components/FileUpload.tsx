'use client';

import { useRef, useState } from 'react';
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
  /** Whether the trigger button should be disabled (e.g. while AI is typing) */
  disabled?: boolean;
  /** Called after files are selected and appended to the list */
  onFilesChange?: (files: UploadedFile[]) => void;
  /** Accepted file extensions / MIME types passed to <input accept> */
  accept?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * FileUpload
 *
 * Renders:
 * - A `+` icon button that opens the native file picker
 * - A horizontal scrollable row of shadcn Attachment chips for each selected file
 *
 * Usage:
 * ```tsx
 * <FileUpload disabled={isAiTyping} onFilesChange={(files) => …} />
 * ```
 */
export default function FileUpload({
  disabled = false,
  onFilesChange,
  accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.csv,.xlsx,.txt',
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;

    const newFiles: UploadedFile[] = selected.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      state: 'done',
    }));

    const updated = [...files, ...newFiles];
    setFiles(updated);
    onFilesChange?.(updated);

    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleRemove = (idx: number) => {
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    onFilesChange?.(updated);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Attachment chips — shown above the trigger when files are selected */}
      {files.length > 0 && (
        <AttachmentGroup>
          {files.map((file, idx) => (
            <Attachment key={idx} state={file.state}>
              <AttachmentMedia>
                <FileText className="h-4 w-4 text-[#818cf8]" />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle className="text-[#e0e0e0]">
                  {file.name}
                </AttachmentTitle>
                <AttachmentDescription>
                  {formatBytes(file.size)}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction
                  onClick={() => handleRemove(idx)}
                  aria-label={`Remove ${file.name}`}
                  className="text-[#9ca3af] hover:text-rose-400"
                >
                  <X className="h-3 w-3" />
                </AttachmentAction>
              </AttachmentActions>
            </Attachment>
          ))}
        </AttachmentGroup>
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
        title="Attach file"
        aria-label="Attach file"
        className="
          flex-shrink-0 w-11 h-11 rounded-2xl
          bg-[#1a1a2e] border border-[#2a2a4e]
          hover:border-[#6366f1] hover:bg-[#1e1e38]
          disabled:opacity-40 disabled:cursor-not-allowed
          flex items-center justify-center
          text-[#9ca3af] hover:text-[#818cf8]
          transition-all cursor-pointer
        "
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
