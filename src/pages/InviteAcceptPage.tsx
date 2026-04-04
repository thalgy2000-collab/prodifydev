import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const InviteAcceptPage = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'ready' | 'accepted' | 'error' | 'expired'>('loading');
  const [invite, setInvite] = useState<any>(null);
  const [productName, setProductName] = useState('');
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const checkInvite = async () => {
      if (!token) { setStatus('error'); return; }

      const { data, error } = await (supabase.from('product_invites') as any)
        .select('*, products:product_id(name)')
        .eq('token', token)
        .maybeSingle();

      if (error || !data) { setStatus('error'); return; }

      if (data.status !== 'pending') { setStatus('error'); return; }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setStatus('expired');
        return;
      }

      setInvite(data);
      setProductName(data.products?.name || 'Produto');

      if (!user) {
        // Store token and redirect to login
        localStorage.setItem('pending_invite_token', token);
        navigate('/login', { replace: true });
        return;
      }

      setStatus('ready');
    };

    checkInvite();
  }, [token, user, authLoading, navigate]);

  const handleAccept = async () => {
    if (!invite || !user) return;
    setAccepting(true);

    try {
      // Add as member
      const { error: memberError } = await (supabase.from('product_members') as any)
        .insert({ product_id: invite.product_id, user_id: user.id, role: invite.role });

      if (memberError) {
        if (memberError.code === '23505') {
          toast.info('Você já é membro deste produto');
        } else {
          toast.error('Erro ao aceitar convite');
          setAccepting(false);
          return;
        }
      }

      // Update invite status
      await (supabase.from('product_invites') as any)
        .update({ status: 'accepted' })
        .eq('id', invite.id);

      localStorage.removeItem('pending_invite_token');
      toast.success('Convite aceito! Bem-vindo ao produto.');
      setStatus('accepted');

      // Redirect to app
      setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch {
      toast.error('Erro inesperado');
      setAccepting(false);
    }
  };

  if (status === 'loading' || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Verificando convite...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader><CardTitle className="text-center">Convite inválido</CardTitle></CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">Este convite não existe ou já foi utilizado.</p>
            <Button onClick={() => navigate('/')}>Ir para o app</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader><CardTitle className="text-center">Convite expirado</CardTitle></CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">Este convite expirou. Peça ao dono do produto para enviar um novo.</p>
            <Button onClick={() => navigate('/')}>Ir para o app</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader><CardTitle className="text-center">Convite aceito! 🎉</CardTitle></CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">Redirecionando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader><CardTitle className="text-center">Convite para produto</CardTitle></CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Você foi convidado para participar de <strong className="text-foreground">{productName}</strong> como <strong className="text-foreground">{invite?.role === 'editor' ? 'Editor' : 'Visualizador'}</strong>.
          </p>
          <Button onClick={handleAccept} disabled={accepting} className="w-full">
            {accepting ? 'Aceitando...' : 'Aceitar Convite'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteAcceptPage;
