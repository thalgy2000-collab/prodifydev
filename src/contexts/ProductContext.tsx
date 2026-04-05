import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Product {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  ownerId: string;
  createdAt: string;
}

export interface ProductMember {
  id: string;
  productId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  email?: string;
  displayName?: string;
  createdAt: string;
}

export interface ProductInvite {
  id: string;
  productId: string;
  email: string;
  role: string;
  status: string;
  token: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface PendingInvite {
  id: string;
  productId: string;
  productName: string;
  role: string;
  createdAt: string;
}

interface ProductContextType {
  products: Product[];
  activeProduct: Product | null;
  setActiveProductId: (id: string | null) => void;
  loading: boolean;
  fetchProducts: () => Promise<void>;
  createProduct: (data: { name: string; description: string; emoji: string; color: string }) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  members: ProductMember[];
  fetchMembers: () => Promise<void>;
  inviteMember: (email: string, role: string) => Promise<{ error?: string }>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: string) => Promise<void>;
  userRole: string | null;
  invites: ProductInvite[];
  fetchInvites: () => Promise<void>;
  createInvite: (email: string, role: string) => Promise<{ error?: string }>;
  cancelInvite: (inviteId: string) => Promise<void>;
  pendingInvites: PendingInvite[];
  fetchPendingInvites: () => Promise<void>;
  acceptInvite: (inviteId: string) => Promise<void>;
  rejectInvite: (inviteId: string) => Promise<void>;
}

const ProductContext = createContext<ProductContextType>({} as ProductContextType);

export const useProduct = () => useContext(ProductContext);

const ACTIVE_PRODUCT_KEY = 'prodify_active_product';

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeProductId, setActiveProductIdState] = useState<string | null>(
    localStorage.getItem(ACTIVE_PRODUCT_KEY)
  );
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<ProductMember[]>([]);
  const [invites, setInvites] = useState<ProductInvite[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

  const setActiveProductId = useCallback((id: string | null) => {
    setActiveProductIdState(id);
    if (id) localStorage.setItem(ACTIVE_PRODUCT_KEY, id);
    else localStorage.removeItem(ACTIVE_PRODUCT_KEY);
  }, []);

  const fetchProducts = useCallback(async () => {
    if (!user) { setProducts([]); setLoading(false); return; }
    const { data } = await (supabase.from('products') as any).select('*');
    if (data) {
      setProducts(data.map((d: any) => ({
        id: d.id, name: d.name, description: d.description,
        emoji: d.emoji, color: d.color, ownerId: d.owner_id, createdAt: d.created_at,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const activeProduct = products.find(p => p.id === activeProductId) || null;

  // If stored product not found in list, clear it
  useEffect(() => {
    if (!loading && activeProductId && !activeProduct && products.length > 0) {
      setActiveProductId(null);
    }
  }, [loading, activeProductId, activeProduct, products, setActiveProductId]);

  const createProduct = useCallback(async (data: { name: string; description: string; emoji: string; color: string }) => {
    if (!user) return;
    const { data: inserted } = await (supabase.from('products') as any)
      .insert({ name: data.name, description: data.description, emoji: data.emoji, color: data.color, owner_id: user.id })
      .select().single();
    if (inserted) {
      // Add owner as member
      await (supabase.from('product_members') as any)
        .insert({ product_id: inserted.id, user_id: user.id, role: 'owner' });
      await fetchProducts();
      setActiveProductId(inserted.id);
    }
  }, [user, fetchProducts, setActiveProductId]);

  const deleteProduct = useCallback(async (id: string) => {
    await (supabase.from('products') as any).delete().eq('id', id);
    if (activeProductId === id) setActiveProductId(null);
    await fetchProducts();
  }, [activeProductId, fetchProducts, setActiveProductId]);

  const fetchMembers = useCallback(async () => {
    if (!activeProductId) { setMembers([]); return; }
    const { data } = await (supabase.from('product_members') as any)
      .select('*, profiles:user_id(email, display_name)')
      .eq('product_id', activeProductId);
    if (data) {
      setMembers(data.map((d: any) => ({
        id: d.id, productId: d.product_id, userId: d.user_id,
        role: d.role, email: d.profiles?.email, displayName: d.profiles?.display_name,
        createdAt: d.created_at,
      })));
    }
  }, [activeProductId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const fetchInvites = useCallback(async () => {
    if (!activeProductId) { setInvites([]); return; }
    const { data } = await (supabase.from('product_invites') as any)
      .select('*')
      .eq('product_id', activeProductId)
      .eq('status', 'pending');
    if (data) {
      setInvites(data.map((d: any) => ({
        id: d.id, productId: d.product_id, email: d.email, role: d.role,
        status: d.status, token: d.token, createdAt: d.created_at, expiresAt: d.expires_at,
      })));
    }
  }, [activeProductId]);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  const inviteMember = useCallback(async (email: string, role: string) => {
    if (!activeProductId || !user) return { error: 'Nenhum produto ativo' };

    const { data: invite, error: inviteError } = await (supabase.from('product_invites') as any)
      .insert({
        product_id: activeProductId,
        invited_by: user.id,
        email: email.trim().toLowerCase(),
        role,
        status: 'pending',
      })
      .select()
      .single();

    if (inviteError) {
      if (inviteError.code === '23505') return { error: 'Este e-mail já foi convidado' };
      return { error: inviteError.message };
    }

    const { error: fnError } = await supabase.functions.invoke('send-invite-email', {
      body: { invite_id: (invite as any).id },
    });

    if (fnError) {
      console.error('Erro ao enviar e-mail:', fnError);
    }

    await fetchMembers();
    return {};
  }, [activeProductId, user, fetchMembers]);

  const createInvite = useCallback(async (email: string, role: string) => {
    if (!activeProductId || !user) return { error: 'Nenhum produto ativo' };
    const { error } = await (supabase.from('product_invites') as any).insert({
      product_id: activeProductId,
      invited_by: user.id,
      email,
      role,
    });
    if (error) return { error: error.message };
    await fetchInvites();
    return {};
  }, [activeProductId, user, fetchInvites]);

  const cancelInvite = useCallback(async (inviteId: string) => {
    await (supabase.from('product_invites') as any).delete().eq('id', inviteId);
    await fetchInvites();
  }, [fetchInvites]);

  const removeMember = useCallback(async (memberId: string) => {
    await (supabase.from('product_members') as any).delete().eq('id', memberId);
    await fetchMembers();
  }, [fetchMembers]);

  const updateMemberRole = useCallback(async (memberId: string, role: string) => {
    await (supabase.from('product_members') as any).update({ role }).eq('id', memberId);
    await fetchMembers();
  }, [fetchMembers]);

  const userRole = user ? (members.find(m => m.userId === user.id)?.role || null) : null;

  const fetchPendingInvites = useCallback(async () => {
    if (!user?.email) { setPendingInvites([]); return; }
    const { data } = await (supabase.from('product_invites') as any)
      .select('*, products:product_id(name)')
      .eq('email', user.email.toLowerCase())
      .eq('status', 'pending');
    if (data) {
      setPendingInvites(data.map((d: any) => ({
        id: d.id,
        productId: d.product_id,
        productName: d.products?.name || 'Produto',
        role: d.role,
        createdAt: d.created_at,
      })));
    }
  }, [user?.email]);

  useEffect(() => { fetchPendingInvites(); }, [fetchPendingInvites]);

  const acceptInvite = useCallback(async (inviteId: string) => {
    if (!user) return;
    const invite = pendingInvites.find(i => i.id === inviteId);
    if (!invite) return;

    await (supabase.from('product_members') as any).insert({
      product_id: invite.productId,
      user_id: user.id,
      role: invite.role,
    });

    await (supabase.from('product_invites') as any)
      .update({ status: 'accepted' })
      .eq('id', inviteId);

    await fetchProducts();
    await fetchPendingInvites();
  }, [user, pendingInvites, fetchProducts, fetchPendingInvites]);

  const rejectInvite = useCallback(async (inviteId: string) => {
    await (supabase.from('product_invites') as any)
      .update({ status: 'expired' })
      .eq('id', inviteId);
    await fetchPendingInvites();
  }, [fetchPendingInvites]);

  return (
    <ProductContext.Provider value={{
      products, activeProduct, setActiveProductId, loading, fetchProducts,
      createProduct, deleteProduct, members, fetchMembers,
      inviteMember, removeMember, updateMemberRole, userRole,
      invites, fetchInvites, createInvite, cancelInvite,
      pendingInvites, fetchPendingInvites, acceptInvite, rejectInvite,
    }}>
      {children}
    </ProductContext.Provider>
  );
};
