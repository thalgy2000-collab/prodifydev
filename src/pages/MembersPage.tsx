import { useState } from 'react';
import { useProduct } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUndo } from '@/contexts/UndoContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { UserPlus, Trash2, Users, Mail, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useFeatureTour } from '@/hooks/useFeatureTour';
import { membersTourSteps } from '@/lib/featureTours';

const ROLE_LABELS: Record<string, string> = { owner: 'Dono', editor: 'Editor', viewer: 'Visualizador' };

const MembersPage = () => {
  const { members, removeMember, updateMemberRole, userRole, activeProduct, invites, createInvite, cancelInvite } = useProduct();
  const { user } = useAuth();
  const { push, undoLast } = useUndo();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [inviting, setInviting] = useState(false);

  const handleRemoveMember = async (member: typeof members[number]) => {
    const snap = { ...member };
    if (!activeProduct) return;
    await removeMember(member.id);
    push({
      description: `Membro removido: ${snap.displayName || snap.email || 'Usuário'}`,
      undo: async () => {
        await (supabase.from('product_members') as any).insert({
          id: snap.id, product_id: activeProduct.id, user_id: snap.userId, role: snap.role,
        });
      },
    });
    toast.success(`Membro removido: ${snap.displayName || snap.email || 'Usuário'}`, {
      duration: 8000,
      action: { label: '↩ Desfazer', onClick: () => undoLast() },
    });
  };

  const handleRoleChange = async (member: typeof members[number], newRole: string) => {
    const previous = member.role;
    await updateMemberRole(member.id, newRole);
    push({
      description: `Role alterada: ${member.displayName || member.email || 'Usuário'}`,
      undo: async () => { await updateMemberRole(member.id, previous); },
    });
    toast.success('Role atualizada', {
      duration: 8000,
      action: { label: '↩ Desfazer', onClick: () => undoLast() },
    });
  };

  const isOwner = userRole === 'owner';

  const handleInvite = async () => {
    if (!email.trim()) return;
    setInviting(true);
    const result = await createInvite(email.trim(), role);
    if (result.error) toast.error(result.error);
    else { toast.success('Convite enviado!'); setEmail(''); setRole('editor'); setInviteOpen(false); }
    setInviting(false);
  };

  const getInitial = (name?: string, email?: string) => {
    const val = name || email || '?';
    return val.charAt(0).toUpperCase();
  };

  const getAvatarColor = (name?: string) => {
    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];
    const val = name || '';
    let hash = 0;
    for (let i = 0; i < val.length; i++) hash = val.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const { TourElement } = useFeatureTour('membros', membersTourSteps);

  return (
    <div data-tour-feature="members-list" className="space-y-6">
      {TourElement}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Membros</h1>
          <p className="text-sm text-muted-foreground">Gerencie quem tem acesso a {activeProduct?.name}</p>
        </div>
        <Button data-tour-feature="members-invite" onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" /> Convidar Membro
        </Button>
      </div>

      {/* Members list */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Membros ({members.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback style={{ backgroundColor: getAvatarColor(member.displayName || member.email) }} className="text-white text-sm font-semibold">
                      {getInitial(member.displayName, member.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.displayName || member.email || 'Usuário'}</p>
                    {member.email && member.displayName && (
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isOwner && member.role !== 'owner' ? (
                    <Select value={member.role} onValueChange={v => updateMemberRole(member.id, v)}>
                      <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Visualizador</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                      {ROLE_LABELS[member.role]}
                    </Badge>
                  )}
                  {isOwner && member.userId !== user?.id && (
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => { removeMember(member.id); toast.success('Membro removido'); }}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending invites */}
      {invites.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> Convites Pendentes ({invites.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {invites.map(invite => (
                <div key={invite.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{invite.email}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Enviado em {format(new Date(invite.createdAt), 'dd/MM/yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{ROLE_LABELS[invite.role] || invite.role}</Badge>
                    <Badge variant="secondary" className="text-xs">Pendente</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => { cancelInvite(invite.id); toast.success('Convite cancelado'); }}>
                      <X className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
            <DialogDescription>Envie um convite por e-mail para adicionar um novo membro ao produto.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail</label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" type="email" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Papel</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={inviting || !email.trim()}>
              {inviting ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembersPage;
