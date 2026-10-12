import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const HOURS = Array.from({ length: 24 }, (_, h) => h);

/**
 * Preferência do lembrete diário da sprint por e-mail.
 * Lê/salva direto na tabela profiles, isolado do useProfile: se a migration
 * ainda não foi aplicada, apenas esta seção fica indisponível (o resto do app não quebra).
 */
const SprintDigestSettings = () => {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(8);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await (supabase.from('profiles') as any)
        .select('sprint_digest_enabled, sprint_digest_hour')
        .eq('id', user.id)
        .maybeSingle();
      if (error) {
        setAvailable(false);
      } else if (data) {
        setEnabled(!!data.sprint_digest_enabled);
        setHour(data.sprint_digest_hour ?? 8);
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async (next: { enabled: boolean; hour: number }) => {
    if (!user) return;
    setSaving(true);
    const { error } = await (supabase.from('profiles') as any)
      .update({ sprint_digest_enabled: next.enabled, sprint_digest_hour: next.hour })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      toast.error('Não foi possível salvar a preferência.');
      return;
    }
    setEnabled(next.enabled);
    setHour(next.hour);
    toast.success(next.enabled
      ? `Lembrete ativado para ${String(next.hour).padStart(2, '0')}h (Brasília).`
      : 'Lembrete desativado.');
  };

  return (
    <div className="border-t pt-6 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <h3 className="font-medium">Lembrete diário da sprint por e-mail</h3>
            <p className="text-sm text-muted-foreground">
              Receba todo dia um e-mail com as tarefas da sprint atual para hoje e as que estão atrasadas.
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          disabled={loading || saving || !available}
          onCheckedChange={(v) => save({ enabled: v, hour })}
          aria-label="Ativar lembrete diário da sprint"
        />
      </div>

      {!available && (
        <p className="text-sm text-muted-foreground">
          Recurso ainda não disponível neste ambiente (migração pendente no banco).
        </p>
      )}

      {available && enabled && (
        <div className="flex items-center gap-3 pl-8">
          <Label className="text-sm">Enviar às</Label>
          <select
            value={hour}
            disabled={saving}
            onChange={(e) => save({ enabled, hour: Number(e.target.value) })}
            className="p-2 border border-border rounded-md bg-background text-sm"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">horário de Brasília</span>
        </div>
      )}
    </div>
  );
};

export default SprintDigestSettings;
