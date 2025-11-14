import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { payrollApi } from '@/lib/api';

interface ConfigTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: string) => void;
}

export function ConfigTemplateModal({ open, onOpenChange, onSelectTemplate }: ConfigTemplateModalProps) {
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; description?: string; highlights?: string[] }>>([]);

  useEffect(() => {
    if (!open) return;
    payrollApi.getTemplates().then((res) => {
      const serverTemplates = res.templates || [];
      if (serverTemplates.length > 0) {
        setTemplates(serverTemplates as any);
      } else {
        // fallback defaults if none configured
        setTemplates([
          { id: 'default', name: 'Default Template', description: 'Standard configuration for general employees', highlights: ['50% Basic', '40% HRA', '10% Bonus', '12% PF'] },
          { id: 'tech', name: 'Tech Department Template', description: 'Optimized for technical roles with higher bonus weightage', highlights: ['55% Basic', '35% HRA', '15% Bonus', '8% Score Weight'] },
          { id: 'sales', name: 'Sales Template', description: 'Performance-driven structure for sales team', highlights: ['45% Basic', '30% HRA', '25% Bonus', '10% Score Weight'] },
        ]);
      }
    }).catch(() => {
      // ignore errors and use defaults
      setTemplates([
        { id: 'default', name: 'Default Template', description: 'Standard configuration for general employees', highlights: ['50% Basic', '40% HRA', '10% Bonus', '12% PF'] },
        { id: 'tech', name: 'Tech Department Template', description: 'Optimized for technical roles with higher bonus weightage', highlights: ['55% Basic', '35% HRA', '15% Bonus', '8% Score Weight'] },
        { id: 'sales', name: 'Sales Template', description: 'Performance-driven structure for sales team', highlights: ['45% Basic', '30% HRA', '25% Bonus', '10% Score Weight'] },
      ]);
    });
  }, [open]);

  const handleSelect = (templateId: string) => {
    onSelectTemplate(templateId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Configuration Template</DialogTitle>
          <DialogDescription>
            Choose a pre-configured template to quickly set up salary calculations
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="cursor-pointer rounded-lg border p-4 transition-colors hover:border-primary hover:bg-primary/5"
              onClick={() => handleSelect(template.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {template.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                      >
                        <Check className="h-3 w-3" />
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
