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
import { Loader2, Save, User, Shield, Settings, Sliders, Camera, Lock, LogOut, Mail, Calendar, Palette, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const ProfilePage = () => {
  const { profile, loading, initial, avatarColor, refetch } = useProfile();
  const { activeProduct, deleteProduct } = useProduct();
  const { isDark, toggle } = useTheme();

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

  const menuItems = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'product', label: 'Produto', icon: Settings },
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
      // Refetch products if needed, but since useProduct doesn't have refetch, maybe call fetchProducts
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
    } catch (err: any) {
      toast.error('Erro ao excluir produto');
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem('prodify_language', newLanguage);
    toast.success('Idioma alterado com sucesso!');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-64 bg-muted/30 border-r border-border p-6">
          <h2 className="text-lg font-semibold mb-6">Configurações</h2>
          <nav className="space-y-1">
            {menuItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
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
        <div className="flex-1 p-8">
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
                  <div className="grid grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-2 gap-4">
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
            </div>
          )}

          {activeSection === 'product' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Produto</h1>
                <p className="text-muted-foreground mt-1">Gerencie as configurações do seu produto</p>
              </div>
              {activeProduct ? (
                <>
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
                  <Card className="bg-card border-red-200 dark:border-red-800">
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <h3 className="font-medium text-red-600 dark:text-red-400">Zona de perigo</h3>
                        <p className="text-sm text-muted-foreground">Ações irreversíveis</p>
                      </div>
                      <Button variant="destructive" onClick={handleDeleteProduct} className="w-full">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Produto
                      </Button>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">Nenhum produto ativo selecionado.</p>
                  </CardContent>
                </Card>
              )}
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
                  <div className="border-t pt-6 space-y-2">
                    <h3 className="font-medium">Sobre</h3>
                    <p className="text-sm text-muted-foreground">Versão do app: v1.0.0</p>
                    <Button variant="link" asChild>
                      <a href="mailto:suporte@prodify.com">Contato com suporte</a>
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
