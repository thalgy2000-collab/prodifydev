import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  color?: string;
}

export function TagInput({ value, onChange, placeholder = 'Digite e pressione Enter', color = 'bg-primary/15 text-primary border-primary/30' }: TagInputProps) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const t = input.trim();
    if (!t) return;
    if (value.includes(t)) { setInput(''); return; }
    onChange([...value, t]);
    setInput('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKey}
        onBlur={addTag}
        placeholder={placeholder}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag, i) => (
            <Badge key={i} variant="outline" className={`${color} gap-1 pr-1`}>
              {tag}
              <button type="button" onClick={() => remove(i)} className="hover:bg-background/30 rounded p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
