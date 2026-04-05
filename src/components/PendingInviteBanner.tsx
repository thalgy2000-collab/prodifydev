import { useProduct } from '@/contexts/ProductContext';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const roleLabels: Record<string, string> = {
  viewer: 'Visualizador',
  editor: 'Editor',
  owner: 'Proprietário',
};

export const PendingInviteBanner = () => {
  const { pendingInvites, acceptInvite, rejectInvite } = useProduct();

  if (pendingInvites.length === 0) return null;

  const handleAccept = async (invite: typeof pendingInvites[0]) => {
    await acceptInvite(invite.id);
    toast.success(`Você agora é membro de ${invite.productName}!`);
  };

  const handleReject = async (id: string) => {
    await rejectInvite(id);
    toast.info('Convite recusado.');
  };

  return (
    <div className="space-y-2 px-6 pt-4">
      {pendingInvites.map((invite) => (
        <div
          key={invite.id}
          className="flex items-center justify-between gap-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3"
        >
          <p className="text-sm">
            Você foi convidado para <strong>{invite.productName}</strong> como{' '}
            <strong>{roleLabels[invite.role] || invite.role}</strong>
          </p>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" onClick={() => handleAccept(invite)} className="gap-1">
              <Check className="h-4 w-4" /> Aceitar
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleReject(invite.id)} className="gap-1">
              <X className="h-4 w-4" /> Recusar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
