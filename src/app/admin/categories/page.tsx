"use client";

import { useState, useEffect } from "react";
import { AdminGuard, AdminHeaderLayout } from "@/components/admin";
import { CategoryManagement } from "@/components/admin/category-management";
import { CategoryFormDialog } from "@/components/admin/category-form-dialog";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  parent?: {
    id: string;
    name: string;
  };
  isActive: boolean;
  sortOrder: number;
  productsCount: number;
  childrenCount: number;
  children?: {
    id: string;
    name: string;
    isActive: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/categories?includeInactive=true");
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch categories");
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      toast.error("Error fetching categories", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (formData: CategoryFormData) => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create category");
      }

      toast.success("Category created successfully!");
      await fetchCategories();
    } catch (error: any) {
      throw error; // Re-throw to be handled by form
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditCategory = async (formData: CategoryFormData) => {
    if (!editingCategory) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update category");
      }

      toast.success("Category updated successfully!");
      await fetchCategories();
      setEditingCategory(null);
    } catch (error: any) {
      throw error; // Re-throw to be handled by form
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete category");
      }

      toast.success("Category deleted successfully!");
      await fetchCategories();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error("Error deleting category", {
        description: error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (categoryId: string, isActive: boolean) => {
    try {
      const category = categories.find(c => c.id === categoryId);
      if (!category) return;

      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...category,
          isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update category status");
      }

      // Update local state
      setCategories(categories.map(cat => 
        cat.id === categoryId 
          ? { ...cat, isActive }
          : cat
      ));

      toast.success(`Category ${isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (error: any) {
      console.error("Error updating category status:", error);
      toast.error("Error updating category status", {
        description: error.message,
      });
    }
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleFormSubmit = async (formData: CategoryFormData) => {
    if (editingCategory) {
      await handleEditCategory(formData);
    } else {
      await handleCreateCategory(formData);
    }
  };

  return (
    <AdminGuard>
      <AdminHeaderLayout>
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={fetchCategories}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          {/* Categories Management */}
          <CategoryManagement
            categories={categories}
            loading={loading}
            onEdit={openEditDialog}
            onDelete={handleDeleteCategory}
            onToggleStatus={handleToggleStatus}
          />

          {/* Category Form Dialog */}
          <CategoryFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            category={editingCategory}
            categories={categories}
            onSubmit={handleFormSubmit}
            loading={actionLoading}
          />
        </div>
      </AdminHeaderLayout>
    </AdminGuard>
  );
}
