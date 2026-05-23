import { useMemo, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Users, Package, Activity, Mail, Search, Trash2, ShieldCheck, ShieldOff, UserCheck, UserX } from 'lucide-react';
import prodifyLogo from '@/assets/prodify-logo.png';
import ProductIcon from '@/components/ProductIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfile } from '@/hooks/useProfile';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const formatDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—');
const formatDateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('pt-BR') : '—');

export default function AdminPage() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const { loading, metrics, users, products, events, invites, toggleActive, toggleAdmin, deleteProduct, cancelInvite } = useAdmin();

  const [userSearch, setUserSearch] = useState('');
  const [userDateFilter, setUserDateFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [eventUserFilter, setEventUserFilter] = useState('');
  const [eventPageFilter, setEventPageFilter] = useState('');
  const [eventDateFilter, setEventDateFilter] = useState('');

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter(u => {
      if (q && !(u.email?.toLowerCase().includes(q) || u.displayName?.toLowerCase().includes(q) || u.fullName?.toLowerCase().includes(q))) {
        return false;
      }
      if (userDateFilter && u.createdAt && new Date(u.createdAt) < new Date(userDateFilter)) return false;
      return true;
    });
  }, [users, userSearch, userDateFilter]);

  const eventTypes = useMemo(() => Array.from(new Set(events.map(e => e.eventName))).sort(), [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (eventTypeFilter !== 'all' && e.eventName !== eventTypeFilter) return false;
      if (eventUserFilter && !(e.userEmail?.toLowerCase().includes(eventUserFilter.toLowerCase()))) return false;
      if (eventPageFilter && !(e.page?.toLowerCase().includes(eventPageFilter.toLowerCase()))) return false;
      if (eventDateFilter && new Date(e.createdAt).toDateString() !== new Date(eventDateFilter).toDateString()) return false;
      return true;
    });
  }, [events, eventTypeFilter, eventUserFilter, eventPageFilter, eventDateFilter]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach(e => {
      const day = new Date(e.createdAt).toLocaleDateString('pt-BR');
      map.set(day, (map.get(day) ?? 0) + 1);
    });
    return Array.from(map.entries()).slice(-14).map(([day, count]) => ({ day, count }));
  }, [events]);

  if (profileLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }
  if (!profile?.isAdmin) {
    return <Navigate to="/inicio" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <img src={prodifyLogo} alt="Prodify" className="h-8 w-8 rounded-full" />
            <div>
              <h1 className="text-base font-bold">Prodify Admin</h1>
              <p className="text-xs text-muted-foreground">Painel de administração</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/inicio')}>
            <ArrowLeft className="h-4 w-4" /> Voltar ao app
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={Users} label="Total de usuários" value={metrics.totalUsers} loading={loading} />
          <MetricCard icon={Package} label="Total de produtos" value={metrics.totalProducts} loading={loading} />
          <MetricCard icon={Activity} label="Ativos (7 dias)" value={metrics.activeUsers7d} loading={loading} />
          <MetricCard icon={Mail} label="Eventos registrados" value={metrics.totalEvents} loading={loading} />
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="invites">Convites</TabsTrigger>
          </TabsList>

          {/* USERS */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar por nome ou e-mail..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>
              <Input type="date" className="sm:w-48" value={userDateFilter} onChange={e => setUserDateFilter(e.target.value)} placeholder="Cadastro a partir de" />
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead>Último acesso</TableHead>
                      <TableHead>Produtos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(u => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                                {(u.displayName ?? u.email ?? '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{u.displayName ?? u.fullName ?? '—'}</span>
                              {u.isAdmin && <Badge variant="secondary" className="text-[10px]">Admin</Badge>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{u.email ?? '—'}</TableCell>
                        <TableCell>{formatDate(u.createdAt)}</TableCell>
                        <TableCell>{formatDateTime(u.lastSeenAt)}</TableCell>
                        <TableCell>{u.productsCount}</TableCell>
                        <TableCell>
                          {u.isActive ? (
                            <Badge className="bg-primary/15 text-primary hover:bg-primary/20">Ativo</Badge>
                          ) : (
                            <Badge variant="destructive">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            title={u.isActive ? 'Desativar' : 'Ativar'}
                            onClick={async () => {
                              await toggleActive(u.id, !u.isActive);
                              toast.success(u.isActive ? 'Usuário desativado' : 'Usuário ativado');
                            }}
                          >
                            {u.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title={u.isAdmin ? 'Remover admin' : 'Promover a admin'}
                            onClick={async () => {
                              await toggleAdmin(u.id, !u.isAdmin);
                              toast.success(u.isAdmin ? 'Admin removido' : 'Promovido a admin');
                            }}
                          >
                            {u.isAdmin ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PRODUCTS */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Dono</TableHead>
                      <TableHead>Membros</TableHead>
                      <TableHead>Tarefas</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map(p => (
                      <TableRow key={p.id}>
                        <TableCell><span className="mr-2">{p.emoji}</span>{p.name}</TableCell>
                        <TableCell className="text-muted-foreground">{p.ownerName}</TableCell>
                        <TableCell>{p.membersCount}</TableCell>
                        <TableCell>{p.tasksCount}</TableCell>
                        <TableCell>{formatDate(p.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deletar produto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O produto "{p.name}" e todos os seus dados serão permanentemente removidos.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={async () => {
                                    await deleteProduct(p.id);
                                    toast.success('Produto deletado');
                                  }}
                                >
                                  Deletar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                    {products.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum produto</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EVENTS */}
          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Eventos por dia (últimos 14)</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eventsByDay}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {eventTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Filtrar por usuário (e-mail)" value={eventUserFilter} onChange={e => setEventUserFilter(e.target.value)} />
              <Input placeholder="Filtrar por página" value={eventPageFilter} onChange={e => setEventPageFilter(e.target.value)} />
              <Input type="date" value={eventDateFilter} onChange={e => setEventDateFilter(e.target.value)} />
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Página</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.slice(0, 200).map(e => (
                      <TableRow key={e.id}>
                        <TableCell><Badge variant="outline">{e.eventName}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{e.userEmail ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{e.page ?? '—'}</TableCell>
                        <TableCell>{formatDateTime(e.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                    {filteredEvents.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum evento</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                {filteredEvents.length > 200 && (
                  <div className="p-2 text-xs text-center text-muted-foreground border-t">Mostrando 200 de {filteredEvents.length} eventos</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* INVITES */}
          <TabsContent value="invites" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Enviado em</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map(i => (
                      <TableRow key={i.id}>
                        <TableCell>{i.email}</TableCell>
                        <TableCell className="text-muted-foreground">{i.productName ?? '—'}</TableCell>
                        <TableCell>{formatDate(i.createdAt)}</TableCell>
                        <TableCell><Badge variant="outline">{i.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={async () => {
                              await cancelInvite(i.id);
                              toast.success('Convite cancelado');
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {invites.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum convite pendente</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, loading }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; loading: boolean }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{loading ? '—' : value.toLocaleString('pt-BR')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
