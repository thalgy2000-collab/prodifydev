import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const TERMS_VERSION = '1.0';

const TermsModal = ({ onAccepted }: { onAccepted: () => void }) => {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleAccept = async () => {
    if (!user) return;
    setLoading(true);
    await supabase
      .from('profiles')
      .update({ terms_accepted_at: new Date().toISOString() } as any)
      .eq('id', user.id);
    setLoading(false);
    onAccepted();
  };

  const today = new Date().toLocaleDateString('pt-BR');

  return (
    <Dialog open modal>
      <DialogContent
        className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold">
            Termos de Uso e Política de Privacidade
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Versão {TERMS_VERSION} — {today}
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4 max-h-[50vh]">
          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed pr-4">
            <section>
              <h3 className="text-foreground font-semibold mb-2">1. Uso da Plataforma</h3>
              <p>
                A Prodify é uma plataforma de gestão de produtos digitais que oferece
                ferramentas para planejamento estratégico, acompanhamento de OKRs,
                gerenciamento de backlog e sprints. Ao utilizar a plataforma, você
                concorda em utilizá-la de forma responsável e em conformidade com
                as leis aplicáveis. É proibido o uso da plataforma para atividades
                ilegais, disseminação de conteúdo malicioso ou qualquer ação que
                comprometa a integridade do serviço ou de outros usuários.
              </p>
            </section>

            <section>
              <h3 className="text-foreground font-semibold mb-2">2. Privacidade dos Dados</h3>
              <p>
                Respeitamos sua privacidade e estamos comprometidos com a proteção
                dos seus dados pessoais. Coletamos apenas as informações necessárias
                para o funcionamento da plataforma, incluindo nome, e-mail e dados
                de uso. Seus dados são armazenados de forma segura e não são
                compartilhados com terceiros sem seu consentimento, exceto quando
                exigido por lei. Você pode solicitar a exclusão dos seus dados a
                qualquer momento entrando em contato com nossa equipe de suporte.
              </p>
            </section>

            <section>
              <h3 className="text-foreground font-semibold mb-2">3. Responsabilidades do Usuário</h3>
              <p>
                Você é responsável por manter a confidencialidade das suas
                credenciais de acesso e por todas as atividades realizadas em sua
                conta. Compromete-se a fornecer informações verdadeiras e
                atualizadas durante o cadastro e uso da plataforma. Qualquer uso
                não autorizado da sua conta deve ser reportado imediatamente à
                nossa equipe. O usuário é responsável pelo conteúdo que cria e
                compartilha dentro da plataforma.
              </p>
            </section>

            <section>
              <h3 className="text-foreground font-semibold mb-2">4. Limitação de Responsabilidade</h3>
              <p>
                A Prodify é fornecida "como está", sem garantias de qualquer tipo,
                expressas ou implícitas. Não nos responsabilizamos por perdas ou
                danos decorrentes do uso ou incapacidade de uso da plataforma,
                incluindo, mas não se limitando a, perda de dados, interrupções
                de serviço ou falhas técnicas. Nos reservamos o direito de
                modificar, suspender ou descontinuar qualquer aspecto da plataforma
                a qualquer momento, com ou sem aviso prévio.
              </p>
            </section>
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t border-border space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={accepted}
              onCheckedChange={(v) => setAccepted(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-foreground">
              Li e aceito os Termos de Uso e Política de Privacidade
            </span>
          </label>
          <Button
            className="w-full"
            disabled={!accepted || loading}
            onClick={handleAccept}
          >
            {loading ? 'Salvando...' : 'Aceitar e Continuar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsModal;
