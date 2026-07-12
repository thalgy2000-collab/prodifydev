import { useState, useEffect } from 'react';
import { useProduct } from '@/contexts/ProductContext';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Save, Settings, Link as LinkIcon, Trash2, ArrowLeft, RefreshCw, AlertCircle, Share2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductIconPicker from '@/components/ProductIconPicker';
import { uploadProductLogo, deleteProductLogo } from '@/lib/productLogo';

const ProductSettingsPage = () => {
  const { activeProduct, deleteProduct, fetchProducts } = useProduct();
  const { profile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabQuery = searchParams.get('tab');
  const fromQuery = searchParams.get('from');

  const [activeSection, setActiveSection] = useState('general');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productEmoji, setProductEmoji] = useState('');
  const [productColor, setProductColor] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  // Jira Integration states
  const [jiraUrl, setJiraUrl] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [jiraProjectKey, setJiraProjectKey] = useState('');
  const [savingJira, setSavingJira] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [lastJiraSync, setLastJiraSync] = useState<{timestamp: string, results: any} | null>(null);
  const [isJiraActive, setIsJiraActive] = useState(false);

  // Google Calendar states
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [googleCalendarToken, setGoogleCalendarToken] = useState<string | null>(null);
  const [syncingGoogle, setSyncingGoogle] = useState(false);

  useEffect(() => {
    if (tabQuery) {
      setActiveSection(tabQuery);
    }
  }, [tabQuery]);

  useEffect(() => {
    if (activeProduct) {
      setProductName(activeProduct.name || '');
      setProductDescription(activeProduct.description || '');
      setProductEmoji(activeProduct.emoji || '');
      setProductColor(activeProduct.color || '');
      setCurrentLogoUrl(activeProduct.logoUrl || null);
      setLogoFile(null);
      setRemoveLogo(false);
    }
  }, [activeProduct]);

  useEffect(() => {
    const fetchIntegrations = async () => {
      if (!activeProduct || !profile) return;
      try {
        const { data, error } = await supabase
          .from('integration_tokens')
          .select('workspace_url, project_key, config, is_active')
          .eq('product_id', activeProduct.id)
          .eq('user_id', profile.id)
          .eq('provider', 'jira')
          .maybeSingle();
        
        if (data) {
          setJiraUrl(data.workspace_url || '');
          setJiraProjectKey(data.project_key || '');
          setJiraEmail((data.config as any)?.email || '');
          setJiraToken('');
          setIsJiraActive(data.is_active || false);
        }
      } catch (err) {
        console.error('Error fetching integrations:', err);
      }
      
      const lastSync = localStorage.getItem(`last_jira_sync_${activeProduct.id}`);
      if (lastSync) {
        try {
          setLastJiraSync(JSON.parse(lastSync));
        } catch (e) {}
      }

      // Google Calendar check
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (session?.provider_token && session?.user?.app_metadata?.provider === 'google') {
        await supabase.from('integration_tokens').upsert({
          user_id: profile.id,
          product_id: activeProduct.id,
          provider: 'google_calendar',
          token_encrypted: session.provider_token,
          is_active: true
        }, { onConflict: 'user_id,product_id,provider' });
        
        // Update URL to remove access_token from hash if possible
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }

      const { data: gData } = await supabase
        .from('integration_tokens')
        .select('is_active, token_encrypted')
        .eq('product_id', activeProduct.id)
        .eq('user_id', profile.id)
        .eq('provider', 'google_calendar')
        .maybeSingle();

      if (gData?.is_active && gData?.token_encrypted) {
        setGoogleCalendarConnected(true);
        setGoogleCalendarToken(gData.token_encrypted);
      } else {
        setGoogleCalendarConnected(false);
        setGoogleCalendarToken(null);
      }
    };
    if (activeSection === 'integrations') {
      fetchIntegrations();
    }
  }, [activeProduct, activeSection, profile]);

  const handleSaveProduct = async () => {
    if (!activeProduct || !user) return;
    setSavingProduct(true);
    try {
      let nextLogoUrl: string | null | undefined = undefined; // undefined = no change

      if (logoFile) {
        toast.loading('Enviando logo...', { id: 'logo-upload' });
        nextLogoUrl = await uploadProductLogo(logoFile, user.id, activeProduct.id);
        toast.dismiss('logo-upload');
      } else if (removeLogo && currentLogoUrl) {
        try { await deleteProductLogo(currentLogoUrl); } catch (e) { console.warn(e); }
        nextLogoUrl = null;
      }

      const update: any = {
        name: productName.trim(),
        description: productDescription.trim(),
        emoji: productEmoji.trim(),
        color: productColor,
      };
      if (nextLogoUrl !== undefined) update.logo_url = nextLogoUrl;

      const { error } = await supabase.from('products').update(update).eq('id', activeProduct.id);
      if (error) throw new Error('Erro ao salvar: ' + error.message);

      toast.success('Produto atualizado com sucesso!');
      await fetchProducts();
      window.location.reload();
    } catch (err: any) {
      toast.dismiss('logo-upload');
      toast.error(err.message || 'Erro ao salvar alterações');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!activeProduct) return;
    if (!window.confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) return;
    try {
      await deleteProduct(activeProduct.id);
      toast.success('Produto excluído com sucesso!');
      navigate('/produtos');
    } catch (err: any) {
      toast.error('Erro ao excluir produto');
    }
  };

  const handleSaveJira = async () => {
    if (!activeProduct || !profile) return;
    setSavingJira(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-task', {
        body: {
          action: 'save',
          provider: 'jira',
          product_id: activeProduct.id,
          user_id: profile.id,
          jira_url: jiraUrl.trim(),
          jira_email: jiraEmail.trim(),
          jira_token: jiraToken.trim(),
          jira_project_key: jiraProjectKey.trim()
        }
      });
      if (error) throw error;
      toast.success('Configurações do Jira salvas!');
      setIsJiraActive(true);
      setJiraToken('');
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + e.message);
    } finally {
      setSavingJira(false);
    }
  };

  const handleTestJira = async () => {
    if (!activeProduct || !profile) return;
    if (!jiraUrl || !jiraEmail || (!jiraToken && !isJiraActive) || !jiraProjectKey) {
      toast.error('Preencha todos os campos do Jira antes de testar.');
      return;
    }
    toast.loading('Testando conexão...', { id: 'test-jira' });
    try {
      const { data, error } = await supabase.functions.invoke('sync-task', {
        body: {
          action: 'test',
          provider: 'jira',
          product_id: activeProduct.id,
          user_id: profile.id,
          jira_url: jiraUrl.trim(),
          jira_email: jiraEmail.trim(),
          jira_token: jiraToken.trim() || undefined,
          jira_project_key: jiraProjectKey.trim()
        }
      });
      if (error) throw error;
      toast.success('Conexão estabelecida com sucesso!', { id: 'test-jira' });
    } catch (e: any) {
      toast.error('Erro ao testar conexão: ' + e.message, { id: 'test-jira' });
    }
  };

  const handleDisconnectJira = async () => {
    if (!activeProduct || !profile) return;
    try {
      const { error } = await supabase
        .from('integration_tokens')
        .update({ is_active: false })
        .eq('product_id', activeProduct.id)
        .eq('user_id', profile.id)
        .eq('provider', 'jira');
      if (error) throw error;
      setIsJiraActive(false);
      setJiraUrl('');
      setJiraEmail('');
      setJiraToken('');
      setJiraProjectKey('');
      toast.success('Integração desconectada com sucesso.');
    } catch (e: any) {
      toast.error('Erro ao desconectar: ' + e.message);
    }
  };

  const handleRunSync = async (direction: 'prodify_to_jira' | 'jira_to_prodify' | 'both') => {
    if (!activeProduct || !profile) return;
    if (!jiraUrl || !jiraEmail || !jiraToken || !jiraProjectKey) {
      toast.error('Salve as configurações do Jira antes de sincronizar.');
      return;
    }
    setIsSyncing(true);
    setSyncErrors([]);
    try {
      const { data, error } = await supabase.functions.invoke('sync-jira', {
        body: {
          direction,
          product_id: activeProduct.id,
          user_id: profile.id,
          jira_url: jiraUrl,
          jira_token: jiraToken,
          jira_email: jiraEmail,
          jira_project_key: jiraProjectKey
        }
      });
      if (error) throw error;
      
      const results = data || { created_in_jira: 0, updated_in_jira: 0, imported_from_jira: 0, errors: [] };
      const resultText = `${results.created_in_jira || 0} criadas no Jira · ${results.imported_from_jira || 0} importadas`;
      
      const syncData = { timestamp: new Date().toISOString(), results };
      setLastJiraSync(syncData);
      localStorage.setItem(`last_jira_sync_${activeProduct.id}`, JSON.stringify(syncData));

      if (results.errors && results.errors.length > 0) {
        setSyncErrors(results.errors);
        toast.warning(
          <div className="flex flex-col gap-2">
            <span>Sincronização concluída com {results.errors.length} erros.</span>
            <Button variant="outline" size="sm" onClick={() => setErrorModalOpen(true)}>Ver erros</Button>
          </div>
        );
      } else {
        toast.success(`Sincronização concluída! ${resultText}`);
      }
    } catch (e: any) {
      toast.error('Erro na sincronização: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar.events',
        redirectTo: `${window.location.origin}/configuracoes?tab=integrations`,
        queryParams: { access_type: 'offline', prompt: 'consent' }
      }
    });
    if (error) toast.error('Erro ao conectar Google: ' + error.message);
  };

  const handleDisconnectGoogle = async () => {
    if (!activeProduct || !profile) return;
    try {
      await supabase
        .from('integration_tokens')
        .update({ is_active: false })
        .eq('product_id', activeProduct.id)
        .eq('user_id', profile.id)
        .eq('provider', 'google_calendar');
      setGoogleCalendarConnected(false);
      setGoogleCalendarToken(null);
      toast.success('Google Calendar desconectado.');
    } catch (e: any) {
      toast.error('Erro ao desconectar: ' + e.message);
    }
  };

  const handleSyncGoogle = async () => {
    if (!activeProduct || !googleCalendarToken) return;
    setSyncingGoogle(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
        body: {
          action: 'push_all',
          product_id: activeProduct.id,
          access_token: googleCalendarToken
        }
      });
      if (error) throw error;
      toast.success(`✅ ${data?.synced_count || 0} eventos enviados ao Google Calendar`);
    } catch (e: any) {
      if (e.message?.includes('401')) {
         toast.error('Sessão do Google expirada. Reconecte sua conta.');
         setGoogleCalendarConnected(false);
      } else {
         toast.error('Erro na sincronização: ' + e.message);
      }
    } finally {
      setSyncingGoogle(false);
    }
  };

  const menuItems = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'integrations', label: 'Integrações', icon: LinkIcon },
    { id: 'share', label: 'Compartilhar', icon: Share2 },
    { id: 'danger', label: 'Perigo', icon: AlertTriangle },
  ];

  if (!activeProduct) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Nenhum produto selecionado.</p>
        <Button onClick={() => navigate('/produtos')}>Ir para Portfólio</Button>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header com Breadcrumb */}
      <div className="px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate max-w-[150px]">{activeProduct.name}</span>
          <span>&gt;</span>
          <span className="text-foreground font-medium">Configurações</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-full lg:w-64 bg-card border-b lg:border-b-0 lg:border-r border-border p-4 lg:p-6 shrink-0 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 lg:mb-6">Configurações do Produto</h2>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {menuItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveSection(id);
                  navigate(`/configuracoes?tab=${id}`, { replace: true });
                }}
                className={`flex-shrink-0 lg:w-full flex items-center gap-2 lg:gap-3 px-3 py-2 rounded-lg text-left transition-colors whitespace-nowrap ${
                  activeSection === id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeSection === 'general' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Geral</h1>
                <p className="text-muted-foreground mt-1">Gerencie as informações principais do produto.</p>
              </div>
              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Nome do produto</Label>
                    <Input id="productName" value={productName} onChange={e => setProductName(e.target.value)} placeholder="Nome do produto" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productDescription">Descrição</Label>
                    <Textarea id="productDescription" value={productDescription} onChange={e => setProductDescription(e.target.value)} placeholder="Descrição do produto" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Ícone do produto</Label>
                    <ProductIconPicker
                      emoji={productEmoji || '📦'}
                      onEmojiChange={setProductEmoji}
                      logoUrl={removeLogo ? null : currentLogoUrl}
                      onLogoFileChange={(f) => {
                        setLogoFile(f);
                        if (f) setRemoveLogo(false);
                      }}
                      onRemoveExistingLogo={() => setRemoveLogo(true)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productColor">Cor</Label>
                    <div className="flex items-center gap-2 max-w-xs">
                      <Input id="productColor" type="color" value={productColor} onChange={e => setProductColor(e.target.value)} className="w-12 h-10 p-1" />
                      <Input value={productColor} onChange={e => setProductColor(e.target.value)} placeholder="#000000" />
                    </div>
                  </div>
                  <Button onClick={handleSaveProduct} disabled={savingProduct} className="w-full">
                    {savingProduct ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar alterações
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'integrations' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
                <p className="text-muted-foreground mt-1">Conecte o Prodify com outras ferramentas</p>
              </div>
              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-6">
                  {fromQuery === 'backlog' && (
                    <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-md text-primary font-medium flex items-center gap-2">
                      <span className="text-xl">💡</span> Configure sua integração com Jira ou Linear para sincronizar seu backlog automaticamente
                    </div>
                  )}

                  <div className="border-b border-border pb-6 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-lg flex items-center gap-2">
                        📅 Google Calendar
                      </h3>
                      {googleCalendarConnected && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 rounded-full border border-green-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Conectado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Envie eventos do Prodify para sua agenda pessoal.</p>
                    
                    {!googleCalendarConnected ? (
                      <Button onClick={handleConnectGoogle} variant="outline" className="w-full sm:w-auto">
                        Conectar Google Calendar
                      </Button>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={handleSyncGoogle} disabled={syncingGoogle} className="w-full sm:w-auto">
                          {syncingGoogle ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                          Sincronizar eventos pendentes →
                        </Button>
                        <Button variant="destructive" onClick={handleDisconnectGoogle} className="w-full sm:w-auto">
                          Desconectar
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-lg">Jira</h3>
                      {isJiraActive && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 rounded-full border border-green-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Integração ativa
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Sincronize tarefas do Backlog com o Jira.</p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Workspace URL *</Label>
                          <Input value={jiraUrl} onChange={e => setJiraUrl(e.target.value)} placeholder="ex: https://suaempresa.atlassian.net" />
                        </div>
                        <div className="space-y-2">
                          <Label>User Email *</Label>
                          <Input value={jiraEmail} onChange={e => setJiraEmail(e.target.value)} placeholder="seu@email.com" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>API Token {isJiraActive ? '' : '*'}</Label>
                          <Input type="password" value={jiraToken} onChange={e => setJiraToken(e.target.value)} placeholder={isJiraActive ? "••••••••• (já configurado)" : "Cole o token do Jira"} />
                        </div>
                        <div className="space-y-2">
                          <Label>Chave do Projeto *</Label>
                          <Input value={jiraProjectKey} onChange={e => setJiraProjectKey(e.target.value)} placeholder="ex: PROJ" />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleSaveJira} disabled={savingJira} className="flex-1">
                          {savingJira ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          {isJiraActive ? 'Atualizar configurações' : 'Salvar configurações'}
                        </Button>
                        <Button variant="outline" onClick={handleTestJira}>
                          Testar Conexão
                        </Button>
                        {isJiraActive && (
                          <Button variant="destructive" onClick={handleDisconnectJira}>
                            Desconectar
                          </Button>
                        )}
                      </div>

                      {/* Bloco de Sincronização Bidirecional */}
                      <div className="mt-8 pt-6 border-t border-border">
                        <h4 className="font-medium mb-3">Sincronização em Lote</h4>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" onClick={() => handleRunSync('prodify_to_jira')} disabled={isSyncing}>
                            {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                            Prodify para Jira
                          </Button>
                          <Button variant="outline" onClick={() => handleRunSync('jira_to_prodify')} disabled={isSyncing}>
                            {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                            Jira para Prodify
                          </Button>
                          <Button variant="default" onClick={() => handleRunSync('both')} disabled={isSyncing}>
                            {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                            Sincronização Completa
                          </Button>
                        </div>
                        
                        {lastJiraSync && (
                          <div className="mt-3 text-xs text-muted-foreground bg-muted/30 p-2 rounded flex items-center justify-between">
                            <span>Última sinc: {new Date(lastJiraSync.timestamp).toLocaleString('pt-BR')}</span>
                            <span>{lastJiraSync.results?.created_in_jira || 0} criadas, {lastJiraSync.results?.imported_from_jira || 0} importadas</span>
                          </div>
                        )}
                        
                        {syncErrors.length > 0 && (
                          <Button variant="ghost" size="sm" className="mt-2 text-destructive hover:text-destructive/80" onClick={() => setErrorModalOpen(true)}>
                            <AlertCircle className="h-4 w-4 mr-2" /> Ver {syncErrors.length} erros da última sincronização
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-6">
                    <h3 className="font-medium text-lg mb-2">Linear</h3>
                    <p className="text-sm text-muted-foreground mb-4">Sincronize tarefas do Backlog com o Linear.</p>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input type="password" placeholder="Cole a API Key do Linear" />
                      </div>
                      <Button variant="outline" onClick={() => toast.info('Funcionalidade em desenvolvimento')}>Salvar Token Linear</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Modal de Erros de Sync */}
              <Dialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
                <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      Erros de Sincronização
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="flex-1 mt-2">
                    <div className="space-y-2">
                      {syncErrors.map((err, i) => (
                        <div key={i} className="p-2 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded">
                          {err}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <DialogFooter>
                    <Button onClick={() => setErrorModalOpen(false)}>Fechar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {activeSection === 'share' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Compartilhar</h1>
                <p className="text-muted-foreground mt-1">Visibilidade pública e compartilhamento do produto.</p>
              </div>
              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-6">
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Share2 className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium">Roadmap Público em Breve</h3>
                    <p className="text-sm text-muted-foreground max-w-md mt-2">
                      Em breve você poderá gerar um link público seguro para compartilhar seu roadmap, metas e updates com stakeholders que não possuem acesso ao Prodify.
                    </p>
                    <Button variant="outline" className="mt-6 pointer-events-none">Em desenvolvimento</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'danger' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-destructive">Zona de Perigo</h1>
                <p className="text-muted-foreground mt-1">Ações destrutivas e irreversíveis.</p>
              </div>
              <Card className="bg-card border-red-200 dark:border-red-800">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="font-medium text-red-600 dark:text-red-400">Excluir Produto</h3>
                    <p className="text-sm text-muted-foreground">Esta ação apagará todo o roadmap, backlog, okrs e membros deste produto. Não pode ser desfeita.</p>
                  </div>
                  <Button variant="destructive" onClick={handleDeleteProduct}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Produto Permanentemente
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductSettingsPage;
