import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const res = await api.adminUploadImage(file);
        uploadedUrls.push(res.url);
      }
      onChange([...images, ...uploadedUrls]);
      toast.success(`Uploaded ${uploadedUrls.length} image(s) to R2`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange([...images, trimmed]);
    setUrlInput('');
  };

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-sm border border-dashed px-4 py-6 text-center transition-colors cursor-pointer ${
          dragOver
            ? 'border-[#92400E] bg-[#92400E]/5'
            : 'border-[#E7E5E4] bg-[#FAFAF9] hover:border-[#1C1917]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-[#92400E]" />
        ) : (
          <Upload className="h-6 w-6 text-[#78716C]" />
        )}
        <p className="mt-2 text-xs font-medium text-[#1C1917]">
          {uploading ? 'Uploading to Cloudflare R2...' : 'Drag & drop bag photos or click to browse'}
        </p>
        <p className="mt-0.5 text-[11px] text-[#78716C]">JPEG, PNG, WebP up to 5MB</p>
      </div>

      {/* Optional direct URL input */}
      <div className="flex gap-2">
        <Input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Or paste an existing image URL (https://...)"
          className="h-9 text-xs"
        />
        <Button type="button" variant="outline" size="sm" onClick={addUrl}>
          Add URL
        </Button>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3 pt-1">
          {images.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-sm border border-[#E7E5E4] bg-white"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-[#1C1917] shadow-sm hover:bg-red-600 hover:text-white cursor-pointer"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
