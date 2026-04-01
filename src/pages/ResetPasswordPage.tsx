import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import prodifyLogo from '@/assets/prodify-logo.png';

const MIN_LENGTH = 6;

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) {
      setError(`A senha deve ter pelo menos ${MIN_LENGTH} caracteres`);
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem');
      return;
    }
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      toast.success('Senha atualizada! Você já pode usar a nova senha.');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não foi possível atualizar a senha. Tente novamente.';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] text-[#8892a4]">
        <Loader2 className="h-8 w-8 animate-spin text-[#4F8EF7]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F0F0F] p-6 text-center">
        <img src={prodifyLogo} alt="Prodify" className="h-14 w-14 rounded-full object-cover mb-4" />
        <h1 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Link inválido ou expirado
        </h1>
        <p className="text-sm text-[#8892a4] max-w-sm mb-6">
          Solicite um novo e-mail de recuperação na tela de login.
        </p>
        <Link
          to="/login"
          className="text-sm font-medium text-[#4F8EF7] hover:text-[#6ba3ff] transition-colors"
        >
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] p-6">
      <div className="w-full max-w-[420px] space-y-8 opacity-0 animate-fade-slide-up">
        <div className="flex flex-col items-center gap-2">
          <img src={prodifyLogo} alt="Prodify" className="h-14 w-14 rounded-full object-cover" />
          <span className="text-white text-xl font-semibold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Prodify
          </span>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
          <div className="space-y-1 mb-6">
            <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Nova senha
            </h2>
            <p className="text-[#8892a4] text-sm">
              Digite sua nova senha abaixo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8892a4] uppercase tracking-wider">Nova senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-10 pr-12 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-[#555] text-sm transition-all duration-200 outline-none focus:bg-white/[0.06] focus:border-[#4F8EF7]/60 focus:ring-2 focus:ring-[#4F8EF7]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#8892a4] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8892a4] uppercase tracking-wider">Confirmar senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-[#555] text-sm transition-all duration-200 outline-none focus:bg-white/[0.06] focus:border-[#4F8EF7]/60 focus:ring-2 focus:ring-[#4F8EF7]/20"
                />
              </div>
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !password || !confirm}
              className="w-full h-12 rounded-xl bg-[#4F8EF7] hover:bg-[#3d7de6] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(79,142,247,0.3)] hover:shadow-[0_4px_30px_rgba(79,142,247,0.45)]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Redefinir senha'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#8892a4]">
            <Link to="/login" className="text-[#4F8EF7] hover:text-[#6ba3ff] font-medium transition-colors">
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
