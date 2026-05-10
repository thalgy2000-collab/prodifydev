import { useState, useEffect, useRef } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useProduct } from '@/contexts/ProductContext';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Save, User, Shield, Sliders, Camera, Lock, LogOut, Mail, Trash2, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ProfilePage = () => {
  const { profile, loading, initial, avatarColor, refetch } = useProfile();
  const { activeProduct, deleteProduct } = useProduct();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from');
  const sectionQuery = searchParams.get('section');

  // ✅ TODOS os hooks ANTES de qualquer return condicional
  const [displayName, setDisplayName] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productEmoji, setProductEmoji] = useState('');
  const [productColor, setProductColor] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem('prodify_language') || 'pt-BR');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwStep, setPwStep] = useState<1 | 2 | 3>(1);
  const [pwLoading, setPwLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (sectionQuery) {
      setActiveSection(sectionQuery);
    }
  }, [sectionQuery]);

  const menuItems = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'app', label: 'App', icon: Sliders },
  ];

  const menuItems = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'app', label: 'App', icon: Sliders },
  ];

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setFullName(profile.fullName || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  useEffect(() => {
    if (activeProduct) {
      setProductName(activeProduct.name || '');
      setProductDescription(activeProduct.description || '');
      setProductEmoji(activeProduct.emoji || '');
      setProductColor(activeProduct.color || '');
    }
  }, [activeProduct]);

  // ✅ Returns condicionais SÓ depois de todos os hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2">Carregando perfil...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Não foi possível carregar o perfil.</p>
        <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('A imagem deve ter menos de 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      let avatarUrl = profile.avatarUrl;

      if (avatarPreview && avatarPreview !== profile.avatarUrl) {
        const file = fileInputRef.current?.files?.[0];
        if (file) {
          const fileName = `${profile.id}/avatar.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('avatars').upload(fileName, file, { upsert: true, contentType: 'image/jpeg' });
          if (uploadError) throw new Error('Erro no upload: ' + uploadError.message);
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
          avatarUrl = publicUrl;
        }
      }

      const { error } = await supabase.from('profiles').update({
        display_name: displayName.trim() || null,
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      }).eq('id', profile.id);

      if (error) throw new Error('Erro ao salvar: ' + error.message);

      toast.success('Perfil atualizado com sucesso!');
      await refetch();
      setAvatarPreview(null);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const openPasswordModal = () => {
    setPwStep(1);
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setPwModalOpen(true);
  };

  const handleSendOtp = async () => {
    if (!profile?.email) return;
    setPwLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: profile.email, options: { shouldCreateUser: false } });
      if (error) throw error;
      toast.success(`Código enviado para ${profile.email}`);
      setPwStep(2);
    } catch {
      toast.error('Erro ao enviar código de verificação');
    } finally {
      setPwLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!profile?.email || otpCode.length !== 8) return;
    setPwLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email: profile.email, token: otpCode, type: 'email' });
      if (error) throw error;
      setPwStep(3);
    } catch {
      toast.error('Código inválido ou expirado');
    } finally {
      setPwLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) { toast.error('A senha deve ter no mínimo 6 caracteres'); return; }
    if (newPassword !== confirmPassword) { toast.error('As senhas não coincidem'); return; }
    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Senha alterada com sucesso!');
      setPwModalOpen(false);
    } catch {
      toast.error('Erro ao alterar senha');
    } finally {
      setPwLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    error ? toast.error('Erro ao sair') : toast.success('Desconectado de todos os dispositivos');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'EXCLUIR') return;
    setDeleting(true);
    try {
      const { error } = await (supabase.rpc as any)('delete_user_account');
      if (error) throw error;

      // Sign out the user
      await supabase.auth.signOut();
      toast.success('Conta excluída com sucesso');
      window.location.href = '/';
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir conta');
    } finally {
      setDeleting(false);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem('prodify_language', newLanguage);
    toast.success('Idioma alterado com sucesso!');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row h-full">
        {/* Sidebar (desktop) / Top tabs (mobile) */}
        <div className="w-full lg:w-64 bg-muted/30 border-b lg:border-b-0 lg:border-r border-border p-4 lg:p-6">
          <button
            onClick={() => navigate('/inicio')}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 -ml-1"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Voltar ao Início</span>
          </button>

          <h2 className="text-lg font-semibold mb-4 lg:mb-6">Configurações</h2>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {menuItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
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
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeSection === 'profile' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
                <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
              </div>
              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-6">
                  {/* Avatar */}
                  <div className="flex flex-col items-center">
                    <div className="relative group">
                      <div
                        className="h-32 w-32 rounded-full flex items-center justify-center text-white font-bold text-2xl cursor-pointer overflow-hidden"
                        style={{
                          backgroundColor: (!avatarPreview && !profile.avatarUrl) ? avatarColor : 'transparent',
                          backgroundImage: (avatarPreview || profile.avatarUrl) ? `url(${avatarPreview || profile.avatarUrl})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {!avatarPreview && !profile.avatarUrl && initial}
                      </div>
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}>
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    <p className="text-sm text-muted-foreground mt-2">Clique para alterar avatar</p>
                  </div>

                  {/* Campos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nome completo</Label>
                      <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome completo" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Nome de exibição</Label>
                      <Input id="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Como quer ser chamado" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} placeholder="Conte um pouco sobre você..." rows={3} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>E-mail</Label>
                      <Input value={profile.email || ''} disabled className="opacity-60" />
                      <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado aqui.</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Data de cadastro</Label>
                      <Input value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('pt-BR') : ''} disabled className="opacity-60" />
                    </div>
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Alterações
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Segurança</h1>
                <p className="text-muted-foreground mt-1">Gerencie a segurança da sua conta</p>
              </div>
              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Senha</h3>
                        <p className="text-sm text-muted-foreground">Alterar sua senha</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={openPasswordModal}>
                      <Mail className="h-4 w-4 mr-2" />Alterar Senha
                    </Button>
                  </div>
                  <div className="border-t pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <LogOut className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Sessões</h3>
                        <p className="text-sm text-muted-foreground">Encerrar todas as sessões ativas</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleSignOut}>Sair de todos os dispositivos</Button>
                  </div>
                  <div className="border-t pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Trash2 className="h-5 w-5 text-destructive" />
                      <div>
                        <h3 className="font-medium text-destructive">Excluir conta</h3>
                        <p className="text-sm text-muted-foreground">Remover permanentemente sua conta e todos os dados</p>
                      </div>
                    </div>
                    <Button variant="destructive" onClick={() => setDeleteModalOpen(true)}>Excluir conta</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Modal de alteração de senha */}
              <Dialog open={pwModalOpen} onOpenChange={setPwModalOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Alterar Senha</DialogTitle>
                  </DialogHeader>

                  {pwStep === 1 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Enviaremos um código de verificação para o e-mail:
                      </p>
                      <p className="font-medium">{profile.email}</p>
                      <Button onClick={handleSendOtp} disabled={pwLoading} className="w-full">
                        {pwLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Enviar código de verificação
                      </Button>
                    </div>
                  )}

                  {pwStep === 2 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Digite o código de 6 dígitos enviado para {profile.email}
                      </p>
                      <div className="flex justify-center">
                        <InputOTP maxLength={8} value={otpCode} onChange={setOtpCode}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                            <InputOTPSlot index={6} />
                            <InputOTPSlot index={7} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <Button onClick={handleVerifyOtp} disabled={pwLoading || otpCode.length !== 8} className="w-full">
                        {pwLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Verificar código
                      </Button>
                    </div>
                  )}

                  {pwStep === 3 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nova senha</Label>
                        <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                        <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" />
                      </div>
                      <Button onClick={handleUpdatePassword} disabled={pwLoading} className="w-full">
                        {pwLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Salvar nova senha
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Modal de exclusão de conta */}
              <Dialog open={deleteModalOpen} onOpenChange={(open) => { setDeleteModalOpen(open); if (!open) setDeleteConfirmText(''); }}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-destructive">Excluir conta permanentemente</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Todos os seus dados serão apagados permanentemente. Esta ação não pode ser desfeita.
                    </p>
                    <div className="space-y-2">
                      <Label>Digite <strong>EXCLUIR</strong> para confirmar</Label>
                      <Input
                        value={deleteConfirmText}
                        onChange={e => setDeleteConfirmText(e.target.value)}
                        placeholder="EXCLUIR"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => { setDeleteModalOpen(false); setDeleteConfirmText(''); }}>
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        disabled={deleteConfirmText !== 'EXCLUIR' || deleting}
                        onClick={handleDeleteAccount}
                      >
                        {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Excluir minha conta
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      Erros de Sincronização
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[300px] w-full rounded-md border p-4 bg-muted/30">
                    <ul className="space-y-2 text-sm">
                      {syncErrors.map((err, i) => (
                        <li key={i} className="text-destructive font-mono text-xs pb-2 border-b last:border-0">{err}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                  <DialogFooter>
                    <Button onClick={() => setErrorModalOpen(false)}>Fechar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}



          {activeSection === 'app' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">App</h1>
                <p className="text-muted-foreground mt-1">Configurações gerais do aplicativo</p>
              </div>
              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Palette className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Modo Escuro</h3>
                        <p className="text-sm text-muted-foreground">Alternar entre tema claro e escuro</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={toggle}>
                      {isDark ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                  <div className="border-t pt-6 space-y-2">
                    <Label>Idioma</Label>
                    <select
                      value={language}
                      onChange={e => handleLanguageChange(e.target.value)}
                      className="w-full p-2 border border-border rounded-md bg-background"
                    >
                      <option value="pt-BR">Português (pt-BR)</option>
                      <option value="en">English (en)</option>
                    </select>
                  </div>
                  <div className="border-t pt-6 space-y-3">
                    <h3 className="font-medium">Onboarding</h3>
                    <p className="text-sm text-muted-foreground">Reexibir os tours guiados.</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          try { localStorage.removeItem('tour_externo'); } catch {}
                          toast.success('Tour externo resetado. Recarregue para visualizar.');
                        }}
                      >
                        Resetar tour externo
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          try {
                            Object.keys(localStorage)
                              .filter(k => k.startsWith('tour_interno_'))
                              .forEach(k => localStorage.removeItem(k));
                          } catch {}
                          toast.success('Tour do produto resetado. Acesse um produto para visualizar.');
                        }}
                      >
                        Resetar tour do produto
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          try {
                            Object.keys(localStorage)
                              .filter(k => k.startsWith('tour_'))
                              .forEach(k => localStorage.removeItem(k));
                          } catch {}
                          toast.success('Tours resetados! Serão exibidos na próxima visita a cada aba.');
                        }}
                      >
                        🔄 Resetar todos os tours das features
                      </Button>
                    </div>
                  </div>
                  <div className="border-t pt-6 space-y-2">
                    <h3 className="font-medium">Sobre</h3>
                    <p className="text-sm text-muted-foreground">Versão do app: v1.0.0</p>
                    <Button variant="link" asChild>
                      <a href="https://wa.me/5516994657472" target="_blank" rel="noopener noreferrer">Contato com suporte</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
