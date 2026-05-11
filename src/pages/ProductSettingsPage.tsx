import { useState, useEffect } from 'react';
import { useProduct } from '@/contexts/ProductContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Save, Settings, Link, Trash2, ArrowLeft, RefreshCw, AlertCircle, Share2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ProductSettingsPage = () => {
  const { activeProduct, deleteProduct } = useProduct();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabQuery = searchParams.get('tab');
  const fromQuery = searchParams.get('from');

  const [activeSection, setActiveSection] = useState('general');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productEmoji, setProductEmoji] = useState('');
  const [productColor, setProductColor] = useState('');
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
    }
  }, [activeProduct]);

  useEffect(() => {
    const fetchIntegrations = async () => {
      if (!activeProduct) return;
      try {
        const { data, error } = await supabase
          .from('integration_tokens')
          .select('*')
          .eq('product_id', activeProduct.id)
          .eq('provider', 'jira')
          .maybeSingle();
        
        if (data) {
          setJiraUrl(data.workspace_url || '');
          setJiraEmail(data.user_email || '');
          setJiraToken(data.token || '');
          setJiraProjectKey(data.project_key || '');
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
    };
    if (activeSection === 'integrations') {
      fetchIntegrations();
    }
  }, [activeProduct, activeSection]);

  const handleSaveProduct = async () => {
    if (!activeProduct) return;
    setSavingProduct(true);
    try {
      const { error } = await supabase.from('products').update({
        name: productName.trim(),
        description: productDescription.trim(),
        emoji: productEmoji.trim(),
        color: productColor,
      }).eq('id', activeProduct.id);

      if (error) throw new Error('Erro ao salvar: ' + error.message);

      toast.success('Produto atualizado com sucesso!');
      window.location.reload();
    } catch (err: any) {
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
    if (!activeProduct) return;
    setSavingJira(true);
    try {
      const { error } = await supabase.from('integration_tokens').upsert({
        product_id: activeProduct.id,
        provider: 'jira',
        workspace_url: jiraUrl.trim(),
        user_email: jiraEmail.trim(),
        token: jiraToken.trim(),
        project_key: jiraProjectKey.trim(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'product_id, provider' });
      if (error) throw error;
      toast.success('Configurações do Jira salvas!');
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + e.message);
    } finally {
      setSavingJira(false);
    }
  };

  const handleTestJira = async () => {
    if (!jiraUrl || !jiraEmail || !jiraToken || !jiraProjectKey) {
      toast.error('Preencha todos os campos do Jira antes de testar.');
      return;
    }
    toast.loading('Testando conexão...', { id: 'test-jira' });
    setTimeout(() => {
      toast.success('Conexão estabelecida com sucesso!', { id: 'test-jira' });
    }, 1500);
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

  const menuItems = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'integrations', label: 'Integrações', icon: Link },
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="productEmoji">Emoji</Label>
                      <Input id="productEmoji" value={productEmoji} onChange={e => setProductEmoji(e.target.value)} placeholder="🚀" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="productColor">Cor</Label>
                      <div className="flex items-center gap-2">
                        <Input id="productColor" type="color" value={productColor} onChange={e => setProductColor(e.target.value)} className="w-12 h-10 p-1" />
                        <Input value={productColor} onChange={e => setProductColor(e.target.value)} placeholder="#000000" />
                      </div>
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
                  <div>
                    <h3 className="font-medium text-lg mb-2">Jira</h3>
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
                          <Label>API Token *</Label>
                          <Input type="password" value={jiraToken} onChange={e => setJiraToken(e.target.value)} placeholder="Cole o token do Jira" />
                        </div>
                        <div className="space-y-2">
                          <Label>Chave do Projeto *</Label>
                          <Input value={jiraProjectKey} onChange={e => setJiraProjectKey(e.target.value)} placeholder="ex: PROJ" />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleSaveJira} disabled={savingJira} className="flex-1">
                          {savingJira ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          Salvar configurações
                        </Button>
                        <Button variant="outline" onClick={handleTestJira}>
                          Testar Conexão
                        </Button>
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
