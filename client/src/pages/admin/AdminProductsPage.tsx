import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { ProductDTO } from '@shared/schemas/product.schema';
import { api } from '@/lib/api';
import { formatLKR } from '@/lib/utils';
import { AdminShell } from '@/components/admin/AdminShell';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const CATEGORIES = [
  'Handbags',
  'Tote Bags',
  'Backpacks',
  'Travel Bags',
  'Wallets & Clutches',
  "Men's Collection",
];

export function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: api.adminGetProducts,
  });

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductDTO | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    category: 'Handbags',
    priceLkr: '',
    compareAtPriceLkr: '',
    stockQty: '15',
    description: '',
    material: '',
    dimensions: '',
    images: [] as string[],
    isActive: true,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      category: 'Handbags',
      priceLkr: '',
      compareAtPriceLkr: '',
      stockQty: '15',
      description: '',
      material: '',
      dimensions: '',
      images: [],
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (p: ProductDTO) => {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category,
      priceLkr: String(p.priceLkr),
      compareAtPriceLkr: p.compareAtPriceLkr ? String(p.compareAtPriceLkr) : '',
      stockQty: String(p.stockQty),
      description: p.description,
      material: p.specs.material || '',
      dimensions: p.specs.dimensions || '',
      images: p.images,
      isActive: p.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.images.length === 0) {
      toast.error('Please upload or add at least one product image');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        priceLkr: Number(form.priceLkr),
        compareAtPriceLkr: form.compareAtPriceLkr ? Number(form.compareAtPriceLkr) : null,
        stockQty: Number(form.stockQty) || 0,
        description: form.description.trim(),
        images: form.images,
        specs: {
          material: form.material.trim() || undefined,
          dimensions: form.dimensions.trim() || undefined,
        },
        isActive: form.isActive,
      };

      if (editing) {
        await api.adminUpdateProduct(editing.id, payload);
        toast.success('Product updated');
      } else {
        await api.adminCreateProduct(payload);
        toast.success('Product added to catalog');
      }

      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: ProductDTO) => {
    if (!confirm(`Remove "${p.name}" from catalog?`)) return;
    try {
      await api.adminDeleteProduct(p.id);
      toast.success('Product removed');
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const products = (data?.products || []).filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <AdminShell title="Products">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#78716C]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-9"
            />
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add New Bag
          </Button>
        </div>

        <div className="rounded-sm border border-[#E7E5E4] bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price (LKR)</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-[#78716C]">
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-[#78716C]">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images[0] || ''}
                          alt={p.name}
                          className="h-12 w-10 rounded-sm border border-[#E7E5E4] object-cover"
                        />
                        <span className="font-medium text-[#1C1917]">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#78716C]">{p.category}</TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {formatLKR(p.priceLkr)}
                    </TableCell>
                    <TableCell className="tabular-nums">{p.stockQty}</TableCell>
                    <TableCell>
                      {p.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Hidden</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-700 hover:text-red-800"
                          onClick={() => void handleDelete(p)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? `Edit ${editing.name}` : 'Add New Bag'}
        description="Upload bag photography to Cloudflare R2 and set LKR pricing."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="prod-name">Bag Name *</Label>
              <Input
                id="prod-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="prod-cat">Category *</Label>
              <Select
                id="prod-cat"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="prod-price">Price (LKR) *</Label>
              <Input
                id="prod-price"
                type="number"
                required
                min={100}
                value={form.priceLkr}
                onChange={(e) => setForm({ ...form, priceLkr: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="prod-compare">Compare At (LKR)</Label>
              <Input
                id="prod-compare"
                type="number"
                value={form.compareAtPriceLkr}
                onChange={(e) => setForm({ ...form, compareAtPriceLkr: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="prod-stock">Stock Qty *</Label>
              <Input
                id="prod-stock"
                type="number"
                required
                min={0}
                value={form.stockQty}
                onChange={(e) => setForm({ ...form, stockQty: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="prod-desc">Description *</Label>
            <Textarea
              id="prod-desc"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="prod-mat">Material</Label>
              <Input
                id="prod-mat"
                value={form.material}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
                placeholder="Full-Grain Cowhide Leather"
              />
            </div>
            <div>
              <Label htmlFor="prod-dim">Dimensions</Label>
              <Input
                id="prod-dim"
                value={form.dimensions}
                onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                placeholder="34cm x 25cm x 12cm"
              />
            </div>
          </div>

          <div>
            <Label>Product Photography (Cloudflare R2) *</Label>
            <ImageUploader
              images={form.images}
              onChange={(images) => setForm({ ...form, images })}
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="accent-[#1C1917]"
            />
            Visible on Storefront
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update Bag' : 'Create Bag'}
            </Button>
          </div>
        </form>
      </Dialog>
    </AdminShell>
  );
}
