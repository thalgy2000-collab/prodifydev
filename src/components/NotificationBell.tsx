import { Bell, Info, CheckCircle, AlertTriangle, Mail, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';
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

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
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
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            <div className="divide-y divide-border">
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
