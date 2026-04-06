import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PendingInvite {
  id: string;
  productId: string;
  productName: string;
  role: string;
  createdAt: string;
}

export const useInvites = () => {
  const { user } = useAuth();
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingInvites = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    const { data } = await (supabase.from('product_invites') as any)
      .select('*, products!product_invites_product_id_fkey(name)')
      .eq('email', user.email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());
    if (data) {
      setPendingInvites(data.map((d: any) => ({
        id: d.id,
        productId: d.product_id,
        productName: d.products?.name || 'Produto',
        role: d.role,
        createdAt: d.created_at,
      })));
    }
    setLoading(false);
  }, [user?.email]);

  useEffect(() => { fetchPendingInvites(); }, [fetchPendingInvites]);

  const acceptInvite = useCallback(async (id: string, productId: string, role: string) => {
    if (!user) return;
    const { error } = await (supabase.from('product_members') as any)
      .insert({ product_id: productId, user_id: user.id, role });
    if (error) {
      toast.error('Erro ao aceitar convite');
      return;
    }
    await (supabase.from('product_invites') as any)
      .update({ status: 'accepted' })
      .eq('id', id);

    const { data: product } = await supabase.from('products').select('owner_id').eq('id', productId).single();
    if (product?.owner_id) {
      const invite = pendingInvites.find(i => i.id === id);
      await supabase.rpc('create_notification', {
        _user_id: product.owner_id,
        _title: 'Convite aceito',
        _message: `${user.email} aceitou o convite para ${invite?.productName || 'produto'}`,
        _type: 'success',
      });
    }

    toast.success('Convite aceito!');
    await fetchPendingInvites();
  }, [user, pendingInvites, fetchPendingInvites]);

  const declineInvite = useCallback(async (id: string) => {
    if (!user) return;
    const invite = pendingInvites.find(i => i.id === id);
    await (supabase.from('product_invites') as any)
      .update({ status: 'expired' })
      .eq('id', id);

    if (invite) {
      const { data: product } = await supabase.from('products').select('owner_id').eq('id', invite.productId).single();
      if (product?.owner_id) {
        await supabase.rpc('create_notification', {
          _user_id: product.owner_id,
          _title: 'Convite recusado',
          _message: `${user.email} recusou o convite para ${invite.productName}`,
          _type: 'warning',
        });
      }
    }

    toast.info('Convite recusado');
    await fetchPendingInvites();
  }, [user, pendingInvites, fetchPendingInvites]);

  return { pendingInvites, loading, acceptInvite, declineInvite, refetch: fetchPendingInvites };
};
