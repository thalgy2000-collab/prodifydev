import { useState, useEffect, useRef } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Loader2, 
  Save, 
  User, 
  Shield, 
  Settings, 
  Bell,
  Camera,
  Lock,
  LogOut,
  Mail,
  Calendar
} from 'lucide-react';

const ProfilePage = () => {
  const { profile, loading, initial, avatarColor, refetch } = useProfile();
  const [displayName, setDisplayName] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [sprintReminders, setSprintReminders] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('pt-BR');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const menuItems = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'preferences', label: 'Preferências', icon: Settings },
    { id: 'notifications', label: 'Notificações', icon: Bell },
  ];

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setFullName(profile.fullName || '');
      setBio(profile.bio || '');
      setEmailUpdates(profile.emailUpdates);
      setSprintReminders(profile.sprintReminders);
      setWeeklySummary(profile.weeklySummary);
      setTheme(profile.theme);
      setLanguage(profile.language);
    }
  }, [profile]);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter menos de 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    
    const updateData: any = {
      display_name: displayName.trim() || null,
      full_name: fullName.trim() || null,
      bio: bio.trim() || null,
      email_updates: emailUpdates,
      sprint_reminders: sprintReminders,
      weekly_summary: weeklySummary,
      theme,
      language,
    };

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profile.id);

    if (error) {
      toast.error('Erro ao salvar alterações');
    } else {
      toast.success('Perfil atualizado com sucesso');
      await refetch();
    }
    setSaving(false);
  };

  const handlePasswordReset = async () => {
    if (!profile?.email) return;
    
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error('Erro ao enviar e-mail de redefinição');
    } else {
      toast.success('E-mail de redefinição enviado com sucesso');
    }
  };

  const handleSignOutAllDevices = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) {
      toast.error('Erro ao sair de todos os dispositivos');
    } else {
      toast.success('Você foi desconectado de todos os dispositivos');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background border-l border-border">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-64 bg-muted/30 border-r border-border p-6">
          <h2 className="text-lg font-semibold mb-6">Configurações</h2>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === item.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
                    <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
                  </div>

                  <Card className="bg-card border-border">
                    <CardContent className="p-6 space-y-6">
                      {/* Avatar Upload */}
                      <div className="flex flex-col items-center">
                        <div className="relative group">
                          <div
                            className="h-32 w-32 rounded-full flex items-center justify-center text-white font-bold text-2xl cursor-pointer overflow-hidden"
                            style={{ backgroundColor: avatarColor }}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {avatarPreview ? (
                              <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                              initial
                            )}
                          </div>
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <Camera className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                        <p className="text-sm text-muted-foreground mt-2">Clique para alterar avatar</p>
                      </div>

                      {/* Form Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Nome completo</Label>
                          <Input
                            id="fullName"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            placeholder="Seu nome completo"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="displayName">Nome de exibição</Label>
                          <Input
                            id="displayName"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            placeholder="Como você quer ser chamado"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={bio}
                          onChange={e => setBio(e.target.value)}
                          placeholder="Conte um pouco sobre você..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">E-mail</Label>
                          <Input
                            id="email"
                            value={profile?.email || ''}
                            disabled
                            className="opacity-60"
                          />
                          <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado aqui.</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Data de cadastro</Label>
                          <Input
                            value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('pt-BR') : ''}
                            disabled
                            className="opacity-60"
                          />
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

              {/* Security Section */}
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
                        <Button variant="outline" onClick={handlePasswordReset}>
                          <Mail className="h-4 w-4 mr-2" />
                          Alterar Senha
                        </Button>
                      </div>

                      <div className="border-t pt-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h3 className="font-medium">Último acesso</h3>
                            <p className="text-sm text-muted-foreground">
                              {profile?.lastLogin 
                                ? new Date(profile.lastLogin).toLocaleString('pt-BR')
                                : 'Não disponível'
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <LogOut className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <h3 className="font-medium">Sessões</h3>
                              <p className="text-sm text-muted-foreground">Encerrar todas as sessões ativas</p>
                            </div>
                          </div>
                          <Button variant="outline" onClick={handleSignOutAllDevices}>
                            Sair de todos os dispositivos
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Preferences Section */}
              {activeSection === 'preferences' && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Preferências</h1>
                    <p className="text-muted-foreground mt-1">Personalize sua experiência</p>
                  </div>

                  <Card className="bg-card border-border">
                    <CardContent className="p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Modo Escuro</Label>
                          <p className="text-sm text-muted-foreground">Alternar entre tema claro e escuro</p>
                        </div>
                        <Switch
                          checked={theme === 'dark'}
                          onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                        />
                      </div>

                      <div className="border-t pt-6">
                        <div className="space-y-2">
                          <Label className="text-base font-medium">Idioma</Label>
                          <p className="text-sm text-muted-foreground mb-3">Selecione seu idioma preferido</p>
                          <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button onClick={handleSave} disabled={saving} className="w-full">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Salvar Preferências
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Notificações</h1>
                    <p className="text-muted-foreground mt-1">Controle suas notificações por e-mail</p>
                  </div>

                  <Card className="bg-card border-border">
                    <CardContent className="p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">E-mail de atualizações</Label>
                          <p className="text-sm text-muted-foreground">Receba atualizações sobre novos recursos</p>
                        </div>
                        <Switch
                          checked={emailUpdates}
                          onCheckedChange={setEmailUpdates}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Lembretes de sprint</Label>
                          <p className="text-sm text-muted-foreground">Seja notificado sobre prazos de sprints</p>
                        </div>
                        <Switch
                          checked={sprintReminders}
                          onCheckedChange={setSprintReminders}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Resumo semanal</Label>
                          <p className="text-sm text-muted-foreground">Receba um resumo das suas atividades semanais</p>
                        </div>
                        <Switch
                          checked={weeklySummary}
                          onCheckedChange={setWeeklySummary}
                        />
                      </div>

                      <Button onClick={handleSave} disabled={saving} className="w-full">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Salvar Preferências
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
