const fs = require('fs');
const path = require('path');

const targetFile = path.join('src', 'pages', 'SprintsPage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Fix duplicated imports
content = content.replace(/import { useState, useRef, useEffect, DragEvent } from 'react';([\s\S]*?)import { supabase } from '@\/integrations\/supabase\/client';\s*import { useState, useRef, useEffect, DragEvent } from 'react';([\s\S]*?)import { supabase } from '@\/integrations\/supabase\/client';/, 'import { useState, useRef, useEffect, DragEvent } from \'react\';$2import { supabase } from \'@/integrations/supabase/client\';');

// 2. Add SelectGroup, SelectLabel, Progress, PieChart icon imports
content = content.replace(
  "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';",
  "import { Select, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';\nimport { Progress } from '@/components/ui/progress';"
);
content = content.replace(
  "import { Plus, Zap, Trash2, AlertTriangle, ArrowUp, ArrowDown, Minus, CircleAlert, User, ClipboardCheck, Calendar, CheckCircle2 } from 'lucide-react';",
  "import { Plus, Zap, Trash2, AlertTriangle, ArrowUp, ArrowDown, Minus, CircleAlert, User, ClipboardCheck, Calendar, CheckCircle2, PieChart } from 'lucide-react';"
);

// 3. Add state for Sprint Review Modal
const statesToAdd = `
  // Resolve pending tasks modal
  const [resolvePendingOpen, setResolvePendingOpen] = useState(false);
  const [resolveTargetSprintId, setResolveTargetSprintId] = useState<string>('backlog');

  const handleResolvePending = async () => {
    if (!selectedSprint) return;
    const pendingTasks = sprintTasks.filter(t => t.status !== 'done');
    for (const task of pendingTasks) {
      if (resolveTargetSprintId === 'backlog') {
        await updateTask(task.id, { sprintId: undefined });
      } else {
        await updateTask(task.id, { sprintId: resolveTargetSprintId });
      }
    }
    setResolvePendingOpen(false);
    toast.success(\`\${pendingTasks.length} tarefa(s) movida(s) com sucesso.\`);
  };
`;
content = content.replace(
  "// Close sprint confirmation",
  statesToAdd + "\n  // Close sprint confirmation"
);

// 4. Update selectedSprint logic
content = content.replace(
  "  const activeSprints = sprints.filter(s => s.status !== 'completed');\n  const selectedSprint = activeSprint || activeSprints[0];",
  `  const activeSprints = sprints.filter(s => s.status !== 'completed');
  const completedSprints = sprints.filter(s => s.status === 'completed');
  const [selectedSprintIdOverride, setSelectedSprintIdOverride] = useState<string | null>(null);
  
  const selectedSprint = sprints.find(s => s.id === selectedSprintIdOverride) || activeSprint || activeSprints[0];`
);

// 5. Update Sprint selector rendering
const oldSelector = `{activeSprints.length > 1 && (
            <Select value={selectedSprint?.id || ''} onValueChange={() => {}}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {activeSprints.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}`;

const newSelector = `{sprints.length > 1 && (
            <Select value={selectedSprint?.id || ''} onValueChange={setSelectedSprintIdOverride}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {activeSprints.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Ativas</SelectLabel>
                    {activeSprints.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {completedSprints.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Concluídas</SelectLabel>
                    {completedSprints.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          )}`;

content = content.replace(oldSelector, newSelector);

// 6. Update Encerrar Sprint modal text
content = content.replace(
  "`${done} tarefa(s) concluída(s) e ${notDone} tarefa(s) não concluída(s) serão devolvidas ao backlog. Deseja encerrar a sprint?`",
  "`${done} tarefa(s) concluída(s) e ${notDone} tarefa(s) pendente(s). Você poderá decidir o que fazer com as tarefas pendentes na tela de relatório da sprint. Deseja encerrar a sprint?`"
);

// 7. Render Sprint Review if selectedSprint.status === 'completed'
const sprintReviewRender = `
      {/* Sprint Review (when completed) */}
      {selectedSprint?.status === 'completed' ? (
        <div className="flex-1 overflow-y-auto space-y-6 max-w-3xl mx-auto w-full pt-4 pb-20">
          <div className="flex flex-col items-center justify-center p-8 bg-card rounded-xl border border-border text-center">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <PieChart className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Relatório da Sprint</h2>
            <p className="text-muted-foreground mt-2 max-w-md">A sprint <strong>{selectedSprint.name}</strong> foi encerrada. Veja abaixo o resumo de desempenho e resolva as tarefas que ficaram pendentes.</p>
            
            {(() => {
              const total = sprintTasks.length;
              const done = sprintTasks.filter(t => t.status === 'done').length;
              const pending = total - done;
              const percent = total > 0 ? Math.round((done / total) * 100) : 0;
              
              return (
                <div className="mt-8 w-full space-y-6 text-left">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-secondary/30 p-4 rounded-lg border border-border">
                      <p className="text-sm font-medium text-muted-foreground">Total de Tarefas</p>
                      <p className="text-3xl font-bold mt-1">{total}</p>
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-lg border border-border">
                      <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                      <p className="text-3xl font-bold mt-1 text-primary">{done}</p>
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-lg border border-border">
                      <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                      <p className="text-3xl font-bold mt-1 text-destructive">{pending}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <Label>Progresso de Conclusão</Label>
                      <span className="font-mono font-medium">{percent}%</span>
                    </div>
                    <Progress value={percent} className="h-3" />
                  </div>

                  {pending > 0 && (
                    <div className="mt-8 pt-6 border-t border-border">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Tarefas Pendentes ({pending})
                        </h3>
                        <Button onClick={() => setResolvePendingOpen(true)}>Resolver Pendências</Button>
                      </div>
                      <div className="space-y-3">
                        {sprintTasks.filter(t => t.status !== 'done').map(task => (
                          <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                            <span className="font-medium text-sm">{task.title}</span>
                            <Badge variant="outline">{task.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        /* Kanban board */
`;

content = content.replace(
  "{/* Kanban board */}",
  sprintReviewRender
);

const resolvePendingDialog = `
      {/* Resolve Pending Tasks Dialog */}
      <Dialog open={resolvePendingOpen} onOpenChange={setResolvePendingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resolver Pendências</DialogTitle>
            <DialogDescription>
              Escolha o destino das {selectedSprint ? tasks.filter(t => t.sprintId === selectedSprint.id && t.status !== 'done').length : 0} tarefa(s) pendente(s).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-3 block">Mover tarefas para:</Label>
            <Select value={resolveTargetSprintId} onValueChange={setResolveTargetSprintId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog (Sem sprint)</SelectItem>
                {activeSprints.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Sprints Ativas</SelectLabel>
                    {activeSprints.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResolvePendingOpen(false)}>Cancelar</Button>
            <Button onClick={handleResolvePending}>Confirmar Movimentação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
`;

content = content.replace(
  "      {/* Edit sprint task dialog */}",
  resolvePendingDialog + "\n      {/* Edit sprint task dialog */}"
);

// We need to close the ternary for sprint review render
content = content.replace(
  "      {/* Alert dialog for incomplete criteria */}",
  "      )} {/* End Sprint Review / Kanban ternary */}\n\n      {/* Alert dialog for incomplete criteria */}"
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('SprintsPage.tsx updated successfully.');
