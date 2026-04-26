import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Rocket, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const JOB_OPTIONS = [
  'Product Manager',
  'Product Owner',
  'Head de Produto',
  'CEO / Fundador',
  'Designer',
  'Desenvolvedor',
  'Analista',
  'Estudante',
  'Outro',
];

const EXPERIENCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'estudante', label: 'Estou começando agora' },
  { value: 'menos_1_ano', label: 'Menos de 1 ano' },
  { value: '1_3_anos', label: '1 a 3 anos' },
  { value: '3_5_anos', label: '3 a 5 anos' },
  { value: '5_mais_anos', label: 'Mais de 5 anos' },
];

const COMPANY_OPTIONS: { value: string; icon: string; label: string }[] = [
  { value: '2-10', icon: '🚀', label: 'Startup (até 50 pessoas)' },
  { value: '51-200', icon: '📈', label: 'Scaleup (50 a 500 pessoas)' },
  { value: '1000+', icon: '🏢', label: 'Empresa (mais de 500 pessoas)' },
  { value: 'solo', icon: '👤', label: 'Freelancer / Autônomo' },
  { value: '11-50', icon: '🎓', label: 'Estudante / Acadêmico' },
];

const GOAL_OPTIONS: { value: string; label: string }[] = [
  { value: 'organizar_okrs', label: 'Organizar meus OKRs' },
  { value: 'gerenciar_backlog', label: 'Gerenciar meu backlog' },
  { value: 'alinhar_estrategia', label: 'Alinhar estratégia e execução' },
  { value: 'melhorar_priorizacao', label: 'Melhorar minha priorização' },
  { value: 'aprender_pm', label: 'Aprender sobre gestão de produto' },
];

const ALL_GOALS_VALUE = 'todas';
const ALL_GOAL_VALUES = GOAL_OPTIONS.map(o => o.value);

const HOW_FOUND_OPTIONS = [
  'LinkedIn',
  'Instagram',
  'Indicação de amigo',
  'Google',
  'YouTube',
  'Comunidade de produto',
  'Outro',
];

interface Props {
  onCompleted: () => void;
}

const WelcomeSurvey = ({ onCompleted }: Props) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [jobTitle, setJobTitle] = useState('');
  const [experience, setExperience] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [mainGoals, setMainGoals] = useState<string[]>([]);
  const [howFound, setHowFound] = useState('');

  const canNext = jobTitle && experience;
  const canFinish = companySize && mainGoals.length > 0 && howFound;

  const toggleGoal = (value: string) => {
    if (value === ALL_GOALS_VALUE) {
      setMainGoals(prev =>
        prev.includes(ALL_GOALS_VALUE) ? [] : [...ALL_GOAL_VALUES, ALL_GOALS_VALUE]
      );
      return;
    }
    setMainGoals(prev =>
      prev.includes(value)
        ? prev.filter(g => g !== value && g !== ALL_GOALS_VALUE)
        : [...prev.filter(g => g !== ALL_GOALS_VALUE), value]
    );
  };

  const handleSubmit = async () => {
    if (!user || !canFinish) return;
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        job_title: jobTitle,
        pm_experience: experience,
        company_size: companySize,
        main_goal: mainGoals.filter(g => g !== ALL_GOALS_VALUE),
        how_found: howFound,
        survey_completed: true,
        survey_completed_at: new Date().toISOString(),
      } as any)
      .eq('id', user.id);
    setLoading(false);
    if (error) {
      toast.error('Erro ao salvar perfil. Tente novamente.');
      return;
    }
    // Garante que o tour externo apareça após o primeiro cadastro,
    // mesmo que o navegador já tenha a flag de sessões anteriores.
    try { localStorage.removeItem('tour_externo'); } catch {}
    toast.success('Perfil configurado! Bem-vindo ao Prodify 🚀');
    onCompleted();
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-background overflow-y-auto">
      {/* LADO ESQUERDO */}
      <div className="hidden md:flex md:w-2/5 lg:w-1/2 relative items-center justify-center p-12 bg-gradient-to-br from-primary/20 via-background to-background border-r border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="relative z-10 max-w-md">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-8 shadow-lg shadow-primary/30">
            <Rocket className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-foreground">
            Bem-vindo ao Prodify! 🚀
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Antes de começar, conta um pouco sobre você. Vamos personalizar sua experiência.
          </p>
        </div>
      </div>

      {/* LADO DIREITO */}
      <div className="flex-1 flex flex-col p-6 sm:p-10 lg:p-16 min-h-screen">
        {/* Progresso */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Step {step} de 2
            </span>
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${step * 50}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-xl w-full">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Configure seu perfil
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Leva menos de 1 minuto
          </p>

          <div className="space-y-8 animate-fade-in" key={step}>
            {step === 1 && (
              <>
                <div className="space-y-3">
                  <Label className="text-base font-medium">Qual é o seu cargo?</Label>
                  <Select value={jobTitle} onValueChange={setJobTitle}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione seu cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Há quanto tempo você trabalha com produto?
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setExperience(opt.value)}
                        className={cn(
                          'relative text-left p-4 rounded-lg border transition-all',
                          'hover:border-primary/50 hover:bg-muted/40',
                          experience === opt.value
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'border-border bg-card'
                        )}
                      >
                        <span className="text-sm font-medium text-foreground">{opt.label}</span>
                        {experience === opt.value && (
                          <Check className="h-4 w-4 text-primary absolute top-3 right-3" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Em qual tipo de empresa você trabalha?
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {COMPANY_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setCompanySize(opt.value)}
                        className={cn(
                          'relative text-left p-4 rounded-lg border transition-all flex items-center gap-3',
                          'hover:border-primary/50 hover:bg-muted/40',
                          companySize === opt.value
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'border-border bg-card'
                        )}
                      >
                        <span className="text-xl">{opt.icon}</span>
                        <span className="text-sm font-medium text-foreground flex-1">{opt.label}</span>
                        {companySize === opt.value && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Qual é o seu principal objetivo com o Prodify?
                  </Label>
                  <p className="text-xs text-muted-foreground">Você pode selecionar mais de uma opção</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[...GOAL_OPTIONS, { value: ALL_GOALS_VALUE, label: 'Todas elas' }].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleGoal(opt.value)}
                        className={cn(
                          'relative text-left p-4 rounded-lg border transition-all',
                          'hover:border-primary/50 hover:bg-muted/40',
                          mainGoals.includes(opt.value)
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'border-border bg-card'
                        )}
                      >
                        <span className="text-sm font-medium text-foreground">{opt.label}</span>
                        {mainGoals.includes(opt.value) && (
                          <Check className="h-4 w-4 text-primary absolute top-4 right-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Como você conheceu o Prodify?</Label>
                  <Select value={howFound} onValueChange={setHowFound}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      {HOW_FOUND_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          {/* Botões */}
          <div className="flex items-center justify-between mt-10 gap-3">
            {step === 2 ? (
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            ) : <div />}

            {step === 1 ? (
              <Button
                onClick={() => setStep(2)}
                disabled={!canNext}
                className="ml-auto"
              >
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canFinish || loading}
              >
                {loading ? 'Salvando...' : 'Começar a usar o Prodify'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSurvey;
