import { useState } from 'react';
import { useProduct } from '@/contexts/ProductContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import prodifyLogo from '@/assets/prodify-logo.png';

const EMOJIS = ['📦', '🚀', '💡', '🎯', '🛒', '📱', '🎨', '⚡', '🔧', '📊', '🌍', '💎'];
const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

const PortfolioPage = () => {
  const { products, loading, createProduct, deleteProduct, setActiveProductId } = useProduct();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📦');
  const [color, setColor] = useState('#6366f1');

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Nome é obrigatório'); return; }
    await createProduct({ name, description, emoji, color });
    setOpen(false);
    setName(''); setDescription(''); setEmoji('📦'); setColor('#6366f1');
    toast.success('Produto criado!');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <img src={prodifyLogo} alt="Prodify" className="h-9 w-9 object-contain" />
          <h1 className="text-2xl font-bold tracking-tight">Meus Produtos</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Selecione um produto para gerenciar ou crie um novo.</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(product => (
            <Card
              key={product.id}
              className="group relative cursor-pointer transition-shadow hover:shadow-lg border-2"
              style={{ borderColor: product.color + '33' }}
              onClick={() => setActiveProductId(product.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{product.emoji}</span>
                  <Button
                    variant="ghost" size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); deleteProduct(product.id); toast.success('Produto removido'); }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
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
                  <Label>Emoji</Label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => setEmoji(e)}
                        className={`text-xl p-1.5 rounded-md transition-colors ${emoji === e ? 'bg-primary/15 ring-2 ring-primary' : 'hover:bg-muted'}`}
                      >{e}</button>
                    ))}
                  </div>
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
                <Button onClick={handleCreate} className="w-full">Criar Produto</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;
