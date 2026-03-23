import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import prodifyLogo from '@/assets/prodify-logo.png';

const REMEMBERED_EMAIL_KEY = 'remembered_email';

const AuthPage = () => {
  const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(!!savedEmail);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (rememberMe) { localStorage.setItem(REMEMBERED_EMAIL_KEY, email); } else { localStorage.removeItem(REMEMBERED_EMAIL_KEY); }
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Login realizado com sucesso!');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('Conta criada com sucesso!');
      }
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><Target className="h-6 w-6 text-primary" /></div>
          <CardTitle className="text-2xl">Prodify</CardTitle>
          <CardDescription>{isLogin ? 'Entre na sua conta para acessar seus dados' : 'Crie sua conta para começar'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" /></div>
            <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} /></div>
            {isLogin && (<div className="flex items-center space-x-2"><Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(!!checked)} /><Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Lembrar meu email</Label></div>)}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar conta'}</Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">{isLogin ? 'Criar conta' : 'Fazer login'}</button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;