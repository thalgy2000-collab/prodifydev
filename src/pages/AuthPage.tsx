import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, User } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import prodifyLogo from '@/assets/prodify-logo.png';

const REMEMBERED_EMAIL_KEY = 'remembered_email';

const loginSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().trim().email('Insira um e-mail válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

const signupSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').regex(/^[a-zA-ZÀ-ú\s]+$/, 'Apenas letras e espaços'),
  email: z.string().trim().email('Insira um e-mail válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type FormData = z.infer<typeof signupSchema>;

const AuthPage = () => {
  const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!savedEmail);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(isLogin ? loginSchema : signupSchema),
    defaultValues: { fullName: '', email: savedEmail, password: '' },
    mode: 'onChange',
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');
  const fullNameValue = watch('fullName');

  const toggleMode = () => {
    setIsLogin(!isLogin);
    reset({ fullName: '', email: savedEmail, password: '' });
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, data.email);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        toast.success('Login realizado com sucesso!');
      } else {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: { display_name: data.fullName },
          },
        });
        if (error) throw error;
        toast.success('Conta criada! Verifique seu e-mail.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Credenciais inválidas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen flex bg-[#0F0F0F]">
      {/* Left panel — hero illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0F0F0F] to-[#0d1f3c]" />
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-[#4F8EF7]/20 rounded-full blur-[120px] animate-glow-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-[#4F8EF7]/10 rounded-full blur-[100px] animate-glow-pulse [animation-delay:1.5s]" />

        <div className="relative z-10 max-w-md px-12 space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Gerencie seus produtos com{' '}
            <span className="text-[#4F8EF7]">clareza</span> e{' '}
            <span className="text-[#4F8EF7]">propósito</span>.
          </h1>
          <p className="text-[#8892a4] text-lg leading-relaxed">
            OKRs, roadmaps, sprints e backlog — tudo em um só lugar para equipes de produto que querem resultados.
          </p>
          <div className="flex items-center gap-3 pt-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-[#0F0F0F] bg-gradient-to-br from-[#4F8EF7] to-[#2563eb]"
                  style={{ opacity: 1 - i * 0.15 }}
                />
              ))}
            </div>
            
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px] space-y-8 opacity-0 animate-fade-slide-up">
          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <img src={prodifyLogo} alt="Prodify" className="h-14 w-14 rounded-full object-cover" />
            <span className="text-white text-xl font-semibold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Prodify
            </span>
          </div>

          {/* Glassmorphism card */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
            <div className="space-y-1 mb-8">
              <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
              </h2>
              <p className="text-[#8892a4] text-sm">
                {isLogin ? 'Entre com suas credenciais para continuar' : 'Preencha os dados para começar'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Full Name — signup only */}
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#8892a4] uppercase tracking-wider">
                    Nome completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
                    <input
                      type="text"
                      placeholder="Seu nome completo"
                      className={`w-full h-12 pl-10 pr-4 rounded-xl bg-white/[0.04] border text-white placeholder:text-[#555] text-sm transition-all duration-200 outline-none focus:bg-white/[0.06] ${
                        errors.fullName
                          ? 'border-red-500/60 focus:ring-2 focus:ring-red-500/30'
                          : 'border-white/[0.08] focus:border-[#4F8EF7]/60 focus:ring-2 focus:ring-[#4F8EF7]/20'
                      }`}
                      {...register('fullName')}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.fullName.message}
                    </p>
                  )}
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#8892a4] uppercase tracking-wider">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    className={`w-full h-12 pl-10 pr-4 rounded-xl bg-white/[0.04] border text-white placeholder:text-[#555] text-sm transition-all duration-200 outline-none focus:bg-white/[0.06] ${
                      errors.email
                        ? 'border-red-500/60 focus:ring-2 focus:ring-red-500/30'
                        : 'border-white/[0.08] focus:border-[#4F8EF7]/60 focus:ring-2 focus:ring-[#4F8EF7]/20'
                    }`}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#8892a4] uppercase tracking-wider">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`w-full h-12 pl-10 pr-12 rounded-xl bg-white/[0.04] border text-white placeholder:text-[#555] text-sm transition-all duration-200 outline-none focus:bg-white/[0.06] ${
                      errors.password
                        ? 'border-red-500/60 focus:ring-2 focus:ring-red-500/30'
                        : 'border-white/[0.08] focus:border-[#4F8EF7]/60 focus:ring-2 focus:ring-[#4F8EF7]/20'
                    }`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#8892a4] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember / Forgot */}
              {isLogin && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(c) => setRememberMe(!!c)}
                      className="border-white/20 data-[state=checked]:bg-[#4F8EF7] data-[state=checked]:border-[#4F8EF7]"
                    />
                    <label htmlFor="remember" className="text-sm text-[#8892a4] cursor-pointer select-none">
                      Lembrar de mim
                    </label>
                  </div>
                  <button type="button" className="text-sm text-[#4F8EF7] hover:text-[#6ba3ff] transition-colors">
                    Esqueceu a senha?
                  </button>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !emailValue || !passwordValue || (!isLogin && (!fullNameValue || fullNameValue.trim().length < 3))}
                className="w-full h-12 rounded-xl bg-[#4F8EF7] hover:bg-[#3d7de6] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(79,142,247,0.3)] hover:shadow-[0_4px_30px_rgba(79,142,247,0.45)]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isLogin ? 'Entrando...' : 'Criando conta...'}
                  </>
                ) : isLogin ? 'Entrar' : 'Criar conta'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/[0.08]" />
              <span className="text-xs text-[#555] uppercase tracking-wider">ou continue com</span>
              <div className="flex-1 h-px bg-white/[0.08]" />
            </div>

            {/* Social login */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-[#8892a4] text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('github')}
                className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-[#8892a4] text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </button>
            </div>
          </div>

          {/* Switch mode */}
          <p className="text-center text-sm text-[#8892a4]">
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button onClick={toggleMode} className="text-[#4F8EF7] hover:text-[#6ba3ff] font-medium transition-colors">
              {isLogin ? 'Cadastre-se' : 'Fazer login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
