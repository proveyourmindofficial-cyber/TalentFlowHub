import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Trash2, Edit } from "lucide-react";

interface BulkOperationsProps {
  selectedItems: string[];
  totalItems: number;
  onSelectAll: (checked: boolean) => void;
  onBulkEdit?: () => void;
  onBulkDelete: () => void;
  itemName: string; // e.g., "job", "candidate", "application", "interview"
}

export function BulkOperations({ 
  selectedItems, 
  totalItems, 
  onSelectAll, 
  onBulkEdit, 
  onBulkDelete,
  itemName 
}: BulkOperationsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const isAllSelected = selectedItems.length === totalItems && totalItems > 0;
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < totalItems;

  const handleBulkDelete = () => {
    onBulkDelete();
    setDeleteDialogOpen(false);
  };

  if (selectedItems.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={onSelectAll}
          data-testid="checkbox-select-all"
        />
        <span className="text-sm text-muted-foreground">
          Select all
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={onSelectAll}
          data-testid="checkbox-select-all"
        />
        <span className="text-sm font-medium">
          {selectedItems.length} {itemName}{selectedItems.length !== 1 ? 's' : ''} selected
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        {onBulkEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkEdit}
            data-testid="button-bulk-edit"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Selected
          </Button>
        )}
        
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              data-testid="button-bulk-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedItems.length} {itemName}{selectedItems.length !== 1 ? 's' : ''}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the selected {itemName}s and all related data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">
                Delete {selectedItems.length} {itemName}{selectedItems.length !== 1 ? 's' : ''}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

interface ItemCheckboxProps {
  checked: boolean;
  onChange: () => void;
  "data-testid"?: string;
}

export function ItemCheckbox({ checked, onChange, "data-testid": dataTestId }: ItemCheckboxProps) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={onChange}
      data-testid={dataTestId}
    />
  );
}