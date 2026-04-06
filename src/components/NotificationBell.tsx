import { useState, useEffect, useCallback } from 'react';
import { Bell, Info, CheckCircle, AlertTriangle, Mail, CheckCheck, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';
import { useProduct } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface PendingInviteItem {
  id: string;
  productId: string;
  productName: string;
  role: string;
  createdAt: string;
}

const typeIcons: Record<string, React.ElementType> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  invite: Mail,
};

const typeColors: Record<string, string> = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  invite: 'text-primary',
};

const NotificationItem = ({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
}) => {
  const Icon = typeIcons[notification.type] || Info;
  const color = typeColors[notification.type] || 'text-muted-foreground';
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <button
      onClick={() => onRead(notification.id)}
      className={cn(
        'flex items-start gap-3 w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors',
        !notification.read && 'bg-accent/20'
      )}
    >
      <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', color)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{notification.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-1">{timeAgo}</p>
      </div>
      {!notification.read && (
        <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
      )}
    </button>
  );
};

const InviteItem = ({
  invite,
  onAccept,
  onReject,
}: {
  invite: PendingInviteItem;
  onAccept: (invite: PendingInviteItem) => void;
  onReject: (invite: PendingInviteItem) => void;
}) => {
  const timeAgo = formatDistanceToNow(new Date(invite.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  const roleLabel = invite.role === 'editor' ? 'Editor' : invite.role === 'viewer' ? 'Visualizador' : invite.role;

  return (
    <div className="flex items-start gap-3 w-full text-left px-4 py-3 bg-accent/20">
      <Mail className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">Convite para {invite.productName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Você foi convidado como {roleLabel}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-1">{timeAgo}</p>
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={() => onAccept(invite)}>
            <Check className="h-3.5 w-3.5" />
            Aceitar
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onReject(invite)}>
            <X className="h-3.5 w-3.5" />
            Recusar
          </Button>
        </div>
      </div>
      <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
    </div>
  );
};

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { fetchProducts } = useProduct();
  const { user } = useAuth();
  const [pendingInvites, setPendingInvites] = useState<PendingInviteItem[]>([]);

  const fetchPendingInvites = useCallback(async () => {
    if (!user?.email) return;
    const { data } = await (supabase.from('product_invites') as any)
      .select('*, products!product_invites_product_id_fkey(name)')
      .eq('email', user.email)
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

  const handleAcceptInvite = async (invite: PendingInviteItem) => {
    if (!user) return;
    const { error: memberError } = await (supabase.from('product_members') as any)
      .insert({ product_id: invite.productId, user_id: user.id, role: invite.role });
    if (memberError) {
      toast.error('Erro ao aceitar convite');
      return;
    }
    await (supabase.from('product_invites') as any)
      .update({ status: 'accepted' })
      .eq('id', invite.id);

    // Notify product owner
    const { data: product } = await supabase.from('products').select('owner_id').eq('id', invite.productId).single();
    if (product?.owner_id) {
      await supabase.rpc('create_notification', {
        _user_id: product.owner_id,
        _title: 'Convite aceito',
        _message: `${user.email} aceitou o convite para ${invite.productName}`,
        _type: 'success',
      });
    }

    toast.success(`Você agora é membro de ${invite.productName}!`);
    await fetchProducts();
    await fetchPendingInvites();
  };

  const handleRejectInvite = async (invite: PendingInviteItem) => {
    if (!user) return;
    await (supabase.from('product_invites') as any)
      .update({ status: 'expired' })
      .eq('id', invite.id);

    // Notify product owner
    const { data: product } = await supabase.from('products').select('owner_id').eq('id', invite.productId).single();
    if (product?.owner_id) {
      await supabase.rpc('create_notification', {
        _user_id: product.owner_id,
        _title: 'Convite recusado',
        _message: `${user.email} recusou o convite para ${invite.productName}`,
        _type: 'warning',
      });
    }

    toast.info('Convite recusado');
    await fetchPendingInvites();
  };

  const totalUnread = unreadCount + pendingInvites.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <h3 className="text-sm font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs gap-1 text-muted-foreground"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {pendingInvites.length === 0 && notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            <div className="divide-y divide-border">
              {pendingInvites.map((inv) => (
                <InviteItem key={inv.id} invite={inv} onAccept={handleAcceptInvite} onReject={handleRejectInvite} />
              ))}
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
