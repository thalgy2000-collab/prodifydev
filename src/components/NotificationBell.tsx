import { Bell, Info, CheckCircle, AlertTriangle, Mail, CheckCheck, Check, X, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';
import { useInvites, PendingInvite } from '@/hooks/useInvites';
import { useProduct } from '@/contexts/ProductContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  onRead: (id: string, actionUrl?: string | null) => void;
}) => {
  const Icon = typeIcons[notification.type] || Info;
  const color = typeColors[notification.type] || 'text-muted-foreground';
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <button
      onClick={() => onRead(notification.id, notification.actionUrl)}
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
  onDecline,
}: {
  invite: PendingInvite;
  onAccept: (id: string, productId: string, role: string) => void;
  onDecline: (id: string) => void;
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
          <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={() => onAccept(invite.id, invite.productId, invite.role)}>
            <Check className="h-3.5 w-3.5" />
            Aceitar
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onDecline(invite.id)}>
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
  const { pendingInvites, acceptInvite, declineInvite } = useInvites();
  const { fetchProducts } = useProduct();
  const navigate = useNavigate();

  const handleNotificationClick = (id: string, actionUrl?: string | null) => {
    markAsRead(id);
    if (actionUrl) navigate(actionUrl);
  };

  const handleAccept = async (id: string, productId: string, role: string) => {
    await acceptInvite(id, productId, role);
    await fetchProducts();
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
        <ScrollArea className="h-[400px]">
          {pendingInvites.length === 0 && notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            <div className="divide-y divide-border">
              {pendingInvites.map((inv) => (
                <InviteItem key={inv.id} invite={inv} onAccept={handleAccept} onDecline={declineInvite} />
              ))}
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={handleNotificationClick} />
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
