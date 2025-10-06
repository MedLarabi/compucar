"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Shield, 
  ShieldCheck, 
  Crown,
  User,
  AlertTriangle
} from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  emailVerified: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  image: string | null;
}

interface UserRoleUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onRoleUpdate: (userId: string, newRole: string) => Promise<void>;
  currentRole: string;
}

const userRoles = [
  { 
    value: "CUSTOMER", 
    label: "Customer", 
    icon: User, 
    color: "bg-blue-100 text-blue-800",
    description: "Standard customer with basic access",
    permissions: ["View products", "Place orders", "Manage profile"]
  },
  { 
    value: "ADMIN", 
    label: "Admin", 
    icon: Shield, 
    color: "bg-purple-100 text-purple-800",
    description: "Administrator with management access",
    permissions: ["Manage products", "Manage orders", "Manage users", "View analytics"]
  },
  { 
    value: "SUPER_ADMIN", 
    label: "Super Admin", 
    icon: Crown, 
    color: "bg-red-100 text-red-800",
    description: "Full system access and control",
    permissions: ["All admin permissions", "System settings", "User role management", "Full analytics"]
  },
];

export function UserRoleUpdateDialog({
  open,
  onOpenChange,
  user,
  onRoleUpdate,
  currentRole,
}: UserRoleUpdateDialogProps) {
  const [newRole, setNewRole] = useState(currentRole);
  const [notes, setNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (newRole === currentRole) {
      onOpenChange(false);
      return;
    }

    setIsUpdating(true);
    try {
      await onRoleUpdate(user.id, newRole);
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleInfo = (role: string) => {
    return userRoles.find(r => r.value === role) || userRoles[0];
  };

  const currentRoleInfo = getRoleInfo(currentRole);
  const newRoleInfo = getRoleInfo(newRole);
  const CurrentRoleIcon = currentRoleInfo.icon;
  const NewRoleIcon = newRoleInfo.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update User Role</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.image || ""} />
                <AvatarFallback>
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium">Current Role</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={currentRoleInfo.color}>
                  <CurrentRoleIcon className="h-3 w-3 mr-1" />
                  {currentRoleInfo.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label htmlFor="role">New Role</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select new role" />
              </SelectTrigger>
              <SelectContent>
                {userRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center gap-2">
                      {role.icon && <role.icon className="h-4 w-4" />}
                      <div>
                        <div className="font-medium">{role.label}</div>
                        <div className="text-xs text-muted-foreground">{role.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {newRole !== currentRole && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Badge className={newRoleInfo.color}>
                    <NewRoleIcon className="h-3 w-3 mr-1" />
                    {newRoleInfo.label}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium">New role will be applied</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <strong>Permissions:</strong> {newRoleInfo.permissions.join(", ")}
                </div>
              </div>
            )}
          </div>

          {/* Warning for Super Admin */}
          {newRole === "SUPER_ADMIN" && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Super Admin Access</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                This user will have full system access including the ability to manage other admins and system settings.
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this role change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating || newRole === currentRole}
            >
              {isUpdating ? "Updating..." : "Update Role"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
