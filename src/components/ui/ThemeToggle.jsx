import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle({ variant = 'buttons' }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const Item = ({ value, label, icon: Icon }) => (
    <button
      type="button"
      onClick={() => setTheme(value)}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm transition-colors
        ${theme === value ? 'bg-accent text-accent-foreground' : 'bg-background hover:bg-accent hover:text-accent-foreground'}`}
      aria-pressed={theme === value}
      title={label}
    >
      {Icon ? <Icon size={16} /> : null}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  if (variant === 'select') {
    return (
      <label className="inline-flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Tema</span>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="rounded-md border bg-background px-2 py-1"
        >
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
          <option value="system">Sistema</option>
        </select>
        <span className="text-xs text-muted-foreground">({resolvedTheme})</span>
      </label>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Item value="light" label="Claro" icon={Sun} />
      <Item value="dark" label="Oscuro" icon={Moon} />
    </div>
  );
}
