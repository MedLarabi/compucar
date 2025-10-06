"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Key,
  Plus,
  Upload,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  Ban,
  RotateCcw,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface LicenseKey {
  id: string;
  keyValue: string;
  status: "AVAILABLE" | "ASSIGNED" | "USED" | "REVOKED";
  assignedAt: string | null;
  usedAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  notes: string | null;
  createdAt: string;
  assignedToOrder?: {
    orderNumber: string;
    createdAt: string;
  } | null;
  assignedToUser?: {
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface LicenseKeyManagementProps {
  productId: string;
  productName: string;
}

type SortField = 'createdAt' | 'keyValue' | 'status' | 'assignedAt' | 'assignedToOrder';
type SortDirection = 'asc' | 'desc';

export function LicenseKeyManagement({ productId, productName }: LicenseKeyManagementProps) {
  const [licenseKeys, setLicenseKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showCsvDialog, setShowCsvDialog] = useState(false);
  const [editingKey, setEditingKey] = useState<LicenseKey | null>(null);
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);

  // Sorting states
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Form states
  const [newKey, setNewKey] = useState("");
  const [newKeys, setNewKeys] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchLicenseKeys();
  }, [productId]);

  // Sorting functions
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedLicenseKeys = () => {
    const sorted = [...licenseKeys].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'keyValue':
          aValue = a.keyValue.toLowerCase();
          bValue = b.keyValue.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'assignedAt':
          aValue = a.assignedAt ? new Date(a.assignedAt) : new Date(0);
          bValue = b.assignedAt ? new Date(b.assignedAt) : new Date(0);
          break;
        case 'assignedToOrder':
          aValue = a.assignedToOrder?.orderNumber?.toLowerCase() || '';
          bValue = b.assignedToOrder?.orderNumber?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const fetchLicenseKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/products/${productId}/license-keys`);
      const data = await response.json();
      
      if (data.success) {
        setLicenseKeys(data.licenseKeys);
      } else {
        toast.error("Failed to fetch license keys");
      }
    } catch (error) {
      console.error("Error fetching license keys:", error);
      toast.error("Failed to fetch license keys");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSingleKey = async () => {
    if (!newKey.trim()) {
      toast.error("Please enter a license key");
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}/license-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: newKey.trim(), notes })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("License key added successfully");
        setNewKey("");
        setNotes("");
        setShowAddDialog(false);
        fetchLicenseKeys();
      } else {
        toast.error(data.error || "Failed to add license key");
      }
    } catch (error) {
      console.error("Error adding license key:", error);
      toast.error("Failed to add license key");
    }
  };

  const handleBulkAdd = async () => {
    const keys = newKeys.split('\n').map(k => k.trim()).filter(k => k);
    
    if (keys.length === 0) {
      toast.error("Please enter license keys");
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}/license-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKeys: keys, notes })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Added ${data.created} license keys successfully`);
        if (data.errors.length > 0) {
          toast.warning(`${data.errors.length} keys had errors`);
        }
        setNewKeys("");
        setNotes("");
        setShowBulkDialog(false);
        fetchLicenseKeys();
      } else {
        toast.error(data.error || "Failed to add license keys");
      }
    } catch (error) {
      console.error("Error adding license keys:", error);
      toast.error("Failed to add license keys");
    }
  };

  const handleCsvImport = async () => {
    if (!csvContent.trim()) {
      toast.error("Please paste CSV content");
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}/license-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent, notes })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Imported ${data.created} license keys successfully`);
        if (data.errors.length > 0) {
          toast.warning(`${data.errors.length} keys had errors`);
        }
        setCsvContent("");
        setNotes("");
        setShowCsvDialog(false);
        fetchLicenseKeys();
      } else {
        toast.error(data.error || "Failed to import license keys");
      }
    } catch (error) {
      console.error("Error importing license keys:", error);
      toast.error("Failed to import license keys");
    }
  };

  const handleEditKey = async (key: LicenseKey) => {
    if (!key.keyValue.trim()) {
      toast.error("Please enter a license key");
      return;
    }

    try {
      const response = await fetch(`/api/admin/license-keys/${key.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          keyValue: key.keyValue, 
          notes: key.notes 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("License key updated successfully");
        setEditingKey(null);
        fetchLicenseKeys();
      } else {
        toast.error(data.error || "Failed to update license key");
      }
    } catch (error) {
      console.error("Error updating license key:", error);
      toast.error("Failed to update license key");
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/admin/license-keys/${keyId}`, {
        method: "DELETE"
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("License key deleted successfully");
        fetchLicenseKeys();
      } else {
        toast.error("Failed to delete license key");
      }
    } catch (error) {
      console.error("Error deleting license key:", error);
      toast.error("Failed to delete license key");
    } finally {
      setDeleteKeyId(null);
    }
  };

  const handleKeyAction = async (keyId: string, action: string, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/license-keys/${keyId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        fetchLicenseKeys();
      } else {
        toast.error(data.error || "Failed to perform action");
      }
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error("Failed to perform action");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Available</Badge>;
      case "ASSIGNED":
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Assigned</Badge>;
      case "USED":
        return <Badge className="bg-purple-100 text-purple-800"><Key className="h-3 w-3 mr-1" />Used</Badge>;
      case "REVOKED":
        return <Badge className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />Revoked</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = {
    total: licenseKeys.length,
    available: licenseKeys.filter(k => k.status === "AVAILABLE").length,
    assigned: licenseKeys.filter(k => k.status === "ASSIGNED").length,
    used: licenseKeys.filter(k => k.status === "USED").length,
    revoked: licenseKeys.filter(k => k.status === "REVOKED").length
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            License Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse">Loading license keys...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              License Keys for {productName}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage license keys for this virtual product
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add License Key</DialogTitle>
                  <DialogDescription>
                    Add a single license key to this product
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="key">License Key</Label>
                    <Input
                      id="key"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="Enter license key"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional notes about this key"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSingleKey}>Add Key</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Bulk Add
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bulk Add License Keys</DialogTitle>
                  <DialogDescription>
                    Add multiple license keys (one per line)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bulk-keys">License Keys</Label>
                    <Textarea
                      id="bulk-keys"
                      value={newKeys}
                      onChange={(e) => setNewKeys(e.target.value)}
                      placeholder="Enter license keys, one per line"
                      rows={8}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bulk-notes">Notes (Optional)</Label>
                    <Textarea
                      id="bulk-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional notes for these keys"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkAdd}>Add Keys</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showCsvDialog} onOpenChange={setShowCsvDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import License Keys from CSV</DialogTitle>
                  <DialogDescription>
                    Paste CSV content with license keys in the first column
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="csv-content">CSV Content</Label>
                    <Textarea
                      id="csv-content"
                      value={csvContent}
                      onChange={(e) => setCsvContent(e.target.value)}
                      placeholder="Paste CSV content here..."
                      rows={8}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      CSV format: license_key,notes (or just one key per line)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="csv-notes">Notes (Optional)</Label>
                    <Textarea
                      id="csv-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional notes for imported keys"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCsvDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCsvImport}>Import Keys</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-sm text-muted-foreground">Available</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
            <div className="text-sm text-muted-foreground">Assigned</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.used}</div>
            <div className="text-sm text-muted-foreground">Used</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.revoked}</div>
            <div className="text-sm text-muted-foreground">Revoked</div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* License Keys Table */}
        {licenseKeys.length === 0 ? (
          <div className="text-center py-8">
            <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No license keys</h3>
            <p className="text-muted-foreground mb-4">
              Add license keys to make this virtual product available for purchase
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First License Key
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sort Controls */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">License Keys ({licenseKeys.length})</h3>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  <Select
                    value={sortField}
                    onValueChange={(value: SortField) => setSortField(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Date Created</SelectItem>
                      <SelectItem value="keyValue">License Key</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="assignedAt">Assignment Date</SelectItem>
                      <SelectItem value="assignedToOrder">Order Number</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="px-2"
                  >
                    {sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('keyValue')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      License Key {getSortIcon('keyValue')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('status')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Status {getSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('assignedToOrder')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Assignment {getSortIcon('assignedToOrder')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('createdAt')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Created {getSortIcon('createdAt')}
                    </Button>
                  </TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getSortedLicenseKeys().map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>
                      {editingKey?.id === key.id ? (
                        <Input
                          value={editingKey.keyValue}
                          onChange={(e) => setEditingKey({ ...editingKey, keyValue: e.target.value })}
                          className="w-full"
                        />
                      ) : (
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {key.keyValue}
                        </code>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(key.status)}</TableCell>
                    <TableCell>
                      {key.assignedToOrder ? (
                        <div className="text-sm">
                          <div>Order #{key.assignedToOrder.orderNumber}</div>
                          {key.assignedToUser && (
                            <div className="text-muted-foreground">
                              {key.assignedToUser.firstName} {key.assignedToUser.lastName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingKey?.id === key.id ? (
                        <Textarea
                          value={editingKey.notes || ""}
                          onChange={(e) => setEditingKey({ ...editingKey, notes: e.target.value })}
                          rows={2}
                          className="w-full"
                        />
                      ) : (
                        <div className="text-sm max-w-[200px] truncate">
                          {key.notes || "-"}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingKey?.id === key.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => handleEditKey(editingKey)}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingKey(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setEditingKey(key)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {key.status === "ASSIGNED" && (
                              <DropdownMenuItem onClick={() => handleKeyAction(key.id, "return_to_stock")}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Return to Stock
                              </DropdownMenuItem>
                            )}
                            {key.status !== "REVOKED" && (
                              <DropdownMenuItem onClick={() => handleKeyAction(key.id, "revoke", "Manual revocation")}>
                                <Ban className="h-4 w-4 mr-2" />
                                Revoke
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeleteKeyId(key.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete License Key</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this license key? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteKeyId && handleDeleteKey(deleteKeyId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
