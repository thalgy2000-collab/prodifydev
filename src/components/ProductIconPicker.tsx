import { useRef, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, Smile } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_EMOJIS = ['📦', '🚀', '💡', '🎯', '🛒', '📱', '🎨', '⚡', '🔧', '📊', '🌍', '💎'];
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 10 * 1024 * 1024;

interface Props {
  emoji: string;
  onEmojiChange: (e: string) => void;
  logoUrl: string | null;
  onLogoFileChange: (file: File | null, previewUrl: string | null) => void;
  onRemoveExistingLogo?: () => void;
  emojis?: string[];
}

const ProductIconPicker = ({
  emoji,
  onEmojiChange,
  logoUrl,
  onLogoFileChange,
  onRemoveExistingLogo,
  emojis = DEFAULT_EMOJIS,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const hasLogo = !!(preview || logoUrl);
  const defaultTab = hasLogo ? 'logo' : 'emoji';

  const handleFile = (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG, WebP ou SVG.');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('Imagem muito grande. Máximo 10MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    setFileName(file.name);
    onLogoFileChange(file, url);
  };

  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName(null);
    onLogoFileChange(null, null);
    if (logoUrl && onRemoveExistingLogo) onRemoveExistingLogo();
    if (inputRef.current) inputRef.current.value = '';
  };

  const displayImg = preview || logoUrl;

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="emoji" className="gap-1.5"><Smile className="h-3.5 w-3.5" /> Emoji</TabsTrigger>
        <TabsTrigger value="logo" className="gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Logo</TabsTrigger>
      </TabsList>

      <TabsContent value="emoji" className="mt-3">
        <div className="flex flex-wrap gap-1.5">
          {emojis.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => onEmojiChange(e)}
              disabled={hasLogo}
              className={`text-xl p-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                emoji === e && !hasLogo ? 'bg-primary/15 ring-2 ring-primary' : 'hover:bg-muted'
              }`}
            >{e}</button>
          ))}
        </div>
        {hasLogo && (
          <p className="text-xs text-muted-foreground mt-2">Remova a logo para usar um emoji.</p>
        )}
      </TabsContent>

      <TabsContent value="logo" className="mt-3 space-y-3">
        {displayImg ? (
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <img src={displayImg} alt="logo" className="h-10 w-10 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName || 'Logo atual'}</p>
              <p className="text-xs text-muted-foreground">Pré-visualização</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
              <X className="h-4 w-4 mr-1" /> Remover
            </Button>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Arraste a logo ou clique para selecionar</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP ou SVG · Máx 10MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ProductIconPicker;
