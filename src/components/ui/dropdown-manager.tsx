import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor, TouchSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface DropdownManagerProps {
  title: string;
  description: string;
  items: string[];
  onAdd: (item: string) => Promise<void>;
  onRemove: (item: string) => Promise<void>;
  onReorder?: (orderedItems: string[]) => Promise<void>;
  placeholder?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

function DraggableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center gap-2 p-2 bg-white border rounded-lg shadow-sm"
    >
      <div {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
        <GripVertical className="h-4 w-4" />
      </div>
      {children}
    </div>
  );
}

export const DropdownManager = ({
  title,
  description,
  items,
  onAdd,
  onRemove,
  onReorder,
  placeholder = "Add new item...",
  icon,
  isLoading = false
}: DropdownManagerProps) => {
  const [newItem, setNewItem] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim() || items.includes(newItem.trim())) {
      toast({
        variant: "destructive",
        title: "Invalid Item",
        description: "Item already exists or is empty",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(newItem.trim());
      setNewItem("");
      toast({
        title: "Item Added",
        description: `Successfully added "${newItem.trim()}"`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add item. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (item: string) => {
    if (!confirm(`Are you sure you want to remove "${item}"?`)) return;
    
    try {
      await onRemove(item);
      toast({
        title: "Item Removed",
        description: `Successfully removed "${item}"`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove item. Please try again.",
      });
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over?.id && onReorder) {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      const newOrder = arrayMove(items, oldIndex, newIndex);
      
      try {
        await onReorder(newOrder);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to reorder items. Please try again.",
        });
      }
    }
  };

  const isFormDisabled = isSubmitting || isLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            disabled={isFormDisabled}
            className="flex-1"
          />
          <Button type="submit" disabled={isFormDisabled}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </form>

        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No items yet. Add your first item above!</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Current Items ({items.length})</Label>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={items} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {items.map((item) => (
                    <DraggableItem key={item} id={item}>
                      <span className="flex-1 text-sm">{item}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(item)}
                        className="text-red-500 hover:text-red-700"
                        disabled={isFormDisabled}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DraggableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </CardContent>
    </Card>
  );
};