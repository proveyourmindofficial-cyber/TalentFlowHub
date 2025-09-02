import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useDropdownOptions, useAddDropdownOption } from "@/hooks/useDropdowns";

interface DropdownWithAddProps {
  category: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  "data-testid"?: string;
}

export function DropdownWithAdd({
  category,
  value,
  onValueChange,
  placeholder = "Select an option",
  disabled = false,
  "data-testid": testId,
}: DropdownWithAddProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newOption, setNewOption] = useState("");
  
  const { data: options, isLoading } = useDropdownOptions(category);
  const addOption = useAddDropdownOption();

  const handleAddOption = async () => {
    if (!newOption.trim()) return;
    
    try {
      await addOption.mutateAsync({
        category,
        label: newOption.trim(),
        value: newOption.trim().toLowerCase().replace(/\s+/g, '_'),
      });
      
      onValueChange?.(newOption.trim());
      setNewOption("");
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to add option:', error);
    }
  };

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={disabled ? undefined : onValueChange} disabled={disabled}>
        <SelectTrigger data-testid={testId} className="flex-1">
          <SelectValue placeholder={isLoading ? "Loading..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options?.map((option: any) => (
            <SelectItem key={option.id} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {!disabled && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            data-testid={`${testId}-add`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {category.replace('_', ' ').toUpperCase()}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder={`Enter new ${category.replace('_', ' ')}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddOption();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddOption}
                disabled={!newOption.trim() || addOption.isPending}
              >
                {addOption.isPending ? "Adding..." : "Add Option"}
              </Button>
            </div>
          </div>
        </DialogContent>
        </Dialog>
      )}
    </div>
  );
}