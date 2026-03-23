import { useState } from 'react';
import { useProduct } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, string> = { owner: 'Dono', editor: 'Editor', viewer: 'Visualizador' };

const MembersPage = () => {
  const { members, inviteMember, removeMember, updateMemberRole, userRole, activeProduct } = useProduct();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [inviting, setInviting] = useState(false);

  const isOwner = userRole === 'owner';

  const handleInvite = async () => {
    if (!email.trim()) return;
    setInviting(true);
    const result = await inviteMember(email, role);
    if (result.error) toast.error(result.error);
    else { toast.success('Membro convidado!'); setEmail(''); }
    setInviting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Membros</h1>
        <p className="text-sm text-muted-foreground">Gerencie quem tem acesso a {activeProduct?.name}</p>
      </div>

      {isOwner && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserPlus className="h-4 w-4" /> Convidar Membro</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" className="flex-1" />
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite} disabled={inviting}>Convidar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Membros ({members.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{member.displayName || member.email || 'Usuário'}</p>
                  {member.email && member.displayName && (
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  )}
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
    </div>
  );
};

export default MembersPage;
