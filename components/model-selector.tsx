"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type Model = "hermes" | "qwen";

interface ModelSelectorProps {
  value: Model;
  onChange: (value: Model) => void;
  className?: string;
}

const models: { value: Model; label: string; tag: string; description: string }[] = [
  { value: "hermes", label: "Hermes", tag: "General", description: "Best for most tasks" },
  { value: "qwen", label: "Qwen Coder", tag: "Code", description: "Optimized for code" },
];

export function ModelSelector({ value, onChange, className }: ModelSelectorProps) {
  const current = models.find((m) => m.value === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "h-8 gap-2 bg-transparent border border-border/60 hover:border-border hover:bg-accent/50 focus:ring-0 focus:ring-offset-0 text-[13px] font-medium text-foreground px-3 w-auto rounded-lg transition-colors",
          className
        )}
      >
        <SelectValue>
          <span className="flex items-center gap-2">
            <span>{current?.label}</span>
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md leading-none">
              {current?.tag}
            </span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-popover border-border rounded-xl overflow-hidden p-1 shadow-xl">
        {models.map((m) => (
          <SelectItem
            key={m.value}
            value={m.value}
            className="text-sm cursor-pointer rounded-lg py-2.5 px-3 focus:bg-accent"
          >
            <span className="flex flex-col gap-0.5">
              <span className="flex items-center gap-2 font-medium">
                {m.label}
                <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md leading-none">
                  {m.tag}
                </span>
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">{m.description}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
