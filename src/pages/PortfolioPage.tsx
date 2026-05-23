import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProduct } from '@/contexts/ProductContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Users, Search, X, ClipboardList, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import ProductTemplateDialog from '@/components/ProductTemplateDialog';
import ProductIconPicker from '@/components/ProductIconPicker';
import ProductIcon from '@/components/ProductIcon';


// Emoji list is handled by ProductIconPicker
const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

interface PortfolioPageProps {
  searchQuery?: string;
}

const PortfolioPage = ({ searchQuery: externalQuery }: PortfolioPageProps) => {
  const { products, loading, createProduct, updateProduct, deleteProduct, setActiveProductId } = useProduct();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📦');
  const [color, setColor] = useState('#6366f1');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [localSearch, setLocalSearch] = useState('');
  const [templateOpen, setTemplateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEmoji, setEditEmoji] = useState('📦');
  const [editColor, setEditColor] = useState('#6366f1');
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoUrl, setEditLogoUrl] = useState<string | null>(null);
  const [editRemoveLogo, setEditRemoveLogo] = useState(false);
  const [saving, setSaving] = useState(false);

  const searchQuery = externalQuery ?? localSearch;
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openEdit = (product: typeof products[number]) => {
    setEditingId(product.id);
    setEditName(product.name);
    setEditDescription(product.description || '');
    setEditEmoji(product.emoji);
    setEditColor(product.color);
    setEditLogoFile(null);
    setEditLogoUrl(product.logoUrl);
    setEditRemoveLogo(false);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    if (!editName.trim()) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      await updateProduct(editingId, {
        name: editName, description: editDescription, emoji: editEmoji, color: editColor,
        logoFile: editLogoFile, removeLogo: editRemoveLogo,
      });
      toast.success('Produto atualizado!');
      setEditingId(null);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao atualizar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Nome é obrigatório'); return; }
    setCreating(true);
    try {
      await createProduct({ name, description, emoji, color, logoFile });
      setOpen(false);
      setName(''); setDescription(''); setEmoji('📦'); setColor('#6366f1'); setLogoFile(null);
      toast.success('Produto criado!');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao criar produto');
    } finally {
      setCreating(false);
    }
  };


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold tracking-tight">Meus Produtos</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Selecione um produto para gerenciar ou crie um novo.</p>

        {/* Search bar */}
        <div className="relative mb-6 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={externalQuery === undefined ? localSearch : externalQuery}
            onChange={e => {
              if (externalQuery === undefined) setLocalSearch(e.target.value);
            }}
            placeholder="Buscar produto..."
            className="pl-9 pr-8 w-full"
            readOnly={externalQuery !== undefined}
          />
          {searchQuery && externalQuery === undefined && (
            <button
              onClick={() => setLocalSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {filteredProducts.length === 0 && searchQuery ? (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhum produto encontrado para "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                className="group relative cursor-pointer transition-shadow hover:shadow-lg border-2"
                style={{ borderColor: product.color + '33' }}
                onClick={() => setActiveProductId(product.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <ProductIcon emoji={product.emoji} logoUrl={product.logoUrl} name={product.name} size={40} emojiClassName="text-3xl" />
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); openEdit(product); }}
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>

                      <Button
                        variant="ghost" size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); deleteProduct(product.id); toast.success('Produto removido'); }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-base mb-1">{product.name}</h3>
                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>Membro</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {!searchQuery && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer border-2 border-dashed border-border hover:border-primary/40 transition-colors">
                    <CardContent className="p-5 flex flex-col items-center justify-center h-full min-h-[140px] text-muted-foreground">
                      <Plus className="h-8 w-8 mb-2" />
                      <span className="text-sm font-medium">Novo Produto</span>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Criar Produto</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do produto" />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve descrição" rows={2} />
                    </div>
                    <div className="space-y-2">
                      <Label>Ícone</Label>
                      <ProductIconPicker
                        emoji={emoji}
                        onEmojiChange={setEmoji}
                        logoUrl={null}
                        onLogoFileChange={(f) => setLogoFile(f)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cor</Label>
                      <div className="flex flex-wrap gap-2">
                        {COLORS.map(c => (
                          <button key={c} onClick={() => setColor(c)}
                            className={`h-7 w-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleCreate} disabled={creating} className="w-full">{creating ? 'Criando…' : 'Criar Produto'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {!searchQuery && (
              <Card
                onClick={() => setTemplateOpen(true)}
                className="cursor-pointer border-2 border-dashed transition-colors hover:bg-primary/5"
                style={{ borderColor: 'hsl(var(--primary) / 0.5)' }}
              >
                <CardContent className="p-5 flex flex-col items-center justify-center h-full min-h-[140px] text-primary">
                  <ClipboardList className="h-8 w-8 mb-2" />
                  <span className="text-sm font-medium">Usar Template</span>
                  <span className="text-xs text-muted-foreground mt-1 text-center">Produto + OKRs prontos</span>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
      <ProductTemplateDialog open={templateOpen} onOpenChange={setTemplateOpen} />

      <Dialog open={editingId !== null} onOpenChange={(o) => { if (!o) setEditingId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Produto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome do produto" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Breve descrição" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <ProductIconPicker
                emoji={editEmoji}
                onEmojiChange={setEditEmoji}
                logoUrl={editRemoveLogo ? null : editLogoUrl}
                onLogoFileChange={(f) => { setEditLogoFile(f); if (f) setEditRemoveLogo(false); }}
                onRemoveExistingLogo={() => { setEditLogoFile(null); setEditLogoUrl(null); setEditRemoveLogo(true); }}
              />

            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setEditColor(c)}
                    className={`h-7 w-7 rounded-full transition-transform ${editColor === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleUpdate} disabled={saving} className="w-full">{saving ? 'Salvando…' : 'Salvar alterações'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortfolioPage;
