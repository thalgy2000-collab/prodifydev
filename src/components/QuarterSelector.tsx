import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  selectedQuarter: string;
  onQuarterChange: (quarter: string) => void;
}

const QuarterSelector = ({ selectedQuarter, onQuarterChange }: Props) => {
  const match = selectedQuarter.match(/Q(\d)\s+(\d{4})/);
  const activeQ = match ? parseInt(match[1]) : 1;
  const year = match ? parseInt(match[2]) : new Date().getFullYear();

  const changeYear = (delta: number) => {
    onQuarterChange(`Q${activeQ} ${year + delta}`);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => changeYear(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold text-foreground min-w-[3rem] text-center">{year}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => changeYear(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map(q => {
          const isActive = q === activeQ;
          return (
            <button
              key={q}
              onClick={() => onQuarterChange(`Q${q} ${year}`)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
            >
              Q{q}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuarterSelector;
