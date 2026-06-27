import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProduct } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { QualitativeResearch, QualitativeMethod } from '@/types/research';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2, Video, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function QualitativeTab({ onUpdate }: { onUpdate: () => void }) {
  const { activeProduct } = useProduct();
  const { user } = useAuth();
  const [data, setData] = useState<QualitativeResearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [intervieweeName, setIntervieweeName] = useState('');
  const [intervieweeRole, setIntervieweeRole] = useState('');
  const [method, setMethod] = useState<QualitativeMethod>('Entrevista Individual');
  const [interviewDate, setInterviewDate] = useState('');
  const [duration, setDuration] = useState('');
  const [recordingLink, setRecordingLink] = useState('');

  const fetchData = async () => {
    if (!activeProduct) return;
    setLoading(true);
    const { data: res, error } = await supabase
      .from('qualitative_research')
      .select('*')
      .eq('product_id', activeProduct.id)
      .order('created_at', { ascending: false });
    
    if (!error && res) setData(res as QualitativeResearch[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeProduct]);

  const handleSubmit = async () => {
    if (!title.trim() || !intervieweeName.trim() || !activeProduct || !user) return;

    const { error } = await supabase.from('qualitative_research').insert({
      product_id: activeProduct.id,
      user_id: user.id,
      title,
      interviewee_name: intervieweeName,
      interviewee_role: intervieweeRole,
      method,
      interview_date: interviewDate || null,
      duration_minutes: parseInt(duration) || null,
      recording_link: recordingLink,
    });

    if (error) {
      toast.error('Erro ao salvar pesquisa.');
      console.error(error);
    } else {
      toast.success('Pesquisa qualitativa criada!');
      setOpen(false);
      resetForm();
      fetchData();
      onUpdate();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta entrevista?')) return;
    const { error } = await supabase.from('qualitative_research').delete().eq('id', id);
    if (!error) {
      fetchData();
      onUpdate();
    }
  };

  const resetForm = () => {
    setTitle('');
    setIntervieweeName('');
    setIntervieweeRole('');
    setMethod('Entrevista Individual');
    setInterviewDate('');
    setDuration('');
    setRecordingLink('');
  };

  const formatDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Pesquisas Qualitativas</h2>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Registro</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Entrevista / Sessão Qualitativa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Título / Tópico Principal</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Dores na gestão financeira" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Entrevistado *</Label>
                  <Input value={intervieweeName} onChange={e => setIntervieweeName(e.target.value)} placeholder="Ex: Maria Silva" />
                </div>
                <div className="space-y-2">
                  <Label>Cargo / Perfil</Label>
                  <Input value={intervieweeRole} onChange={e => setIntervieweeRole(e.target.value)} placeholder="Ex: Gerente Comercial" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-1">
                  <Label>Data</Label>
                  <Input type="date" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} />
                </div>
                <div className="space-y-2 col-span-1">
                  <Label>Duração (min)</Label>
                  <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Ex: 45" />
                </div>
                <div className="space-y-2 col-span-1">
                  <Label>Método</Label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={method} 
                    onChange={e => setMethod(e.target.value as QualitativeMethod)}
                  >
                    <option value="Entrevista Individual">Entrevista</option>
                    <option value="Grupo Focal">Grupo Focal</option>
                    <option value="Pesquisa Contextual">Contextual</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Link da Gravação (opcional)</Label>
                <Input value={recordingLink} onChange={e => setRecordingLink(e.target.value)} placeholder="https://zoom.us/..." />
              </div>
              <Button onClick={handleSubmit} className="w-full mt-4" disabled={!title || !intervieweeName}>Salvar Registro</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border text-muted-foreground">
          Nenhuma pesquisa qualitativa cadastrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map(item => (
            <div key={item.id} className="rounded-xl border border-border bg-card p-5 relative group transition-all hover:border-primary/50">
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex gap-2 items-center mb-3">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500">
                  {item.method}
                </span>
                {item.interview_date && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formatDate(item.interview_date)}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-foreground font-medium flex items-center gap-1.5 mt-2">
                👤 {item.interviewee_name}
              </p>
              {item.interviewee_role && (
                <p className="text-xs text-muted-foreground ml-5">{item.interviewee_role}</p>
              )}
              
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  {item.duration_minutes ? `${item.duration_minutes} min` : '-- min'}
                </div>
                {item.recording_link && (
                  <a href={item.recording_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1">
                    Gravação <Video className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
