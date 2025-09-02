import { useState, useMemo } from "react";

export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedItems = useMemo(() => 
    items.filter(item => selectedIds.includes(item.id)), 
    [items, selectedIds]
  );

  const toggleItem = (id: string, checked: boolean) => {
    setSelectedIds(prev => 
      checked 
        ? [...prev, id]
        : prev.filter(itemId => itemId !== id)
    );
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? items.map(item => item.id) : []);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const isSelected = (id: string) => selectedIds.includes(id);

  return {
    selectedIds,
    selectedItems,
    toggleItem,
    toggleAll,
    clearSelection,
    isSelected,
    hasSelection: selectedIds.length > 0,
    selectedCount: selectedIds.length
  };
}