"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  XCircle, 
  X, 
  Tag,
  AlertCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PromotionalCodeInputProps {
  onCodeApplied: (code: string, discountAmount: number) => void;
  onCodeRemoved: () => void;
  appliedCode?: {
    code: string;
    discountAmount: number;
    name: string;
  };
  cartItems: Array<{
    productId: string;
    categoryId: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  disabled?: boolean;
}

export function PromotionalCodeInput({
  onCodeApplied,
  onCodeRemoved,
  appliedCode,
  cartItems,
  subtotal,
  disabled = false
}: PromotionalCodeInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApplyCode = async () => {
    if (!code.trim()) {
      setError("Please enter a promotional code");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/promotional-codes/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code.trim(),
          cartItems,
          subtotal
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Promotional code applied successfully!");
        onCodeApplied(code.trim(), data.data.discountAmount);
        setCode("");
      } else {
        setError(data.error || "Failed to apply promotional code");
      }
    } catch (err) {
      setError("Failed to validate promotional code");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCode = () => {
    onCodeRemoved();
    setError(null);
    setSuccess(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApplyCode();
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Applied Code Display */}
          {appliedCode && (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    {appliedCode.name}
                  </p>
                  <p className="text-sm text-green-600">
                    Code: {appliedCode.code}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  -{formatCurrency(appliedCode.discountAmount)}
                </Badge>
                <Button
                  onClick={handleRemoveCode}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Code Input */}
          {!appliedCode && (
            <div className="space-y-3">
              <Label htmlFor="promotional-code" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Promotional Code
              </Label>
              <div className="flex gap-2">
                <Input
                  id="promotional-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter code"
                  disabled={disabled || loading}
                  className="flex-1"
                />
                <Button
                  onClick={handleApplyCode}
                  disabled={disabled || loading || !code.trim()}
                  className="px-6"
                >
                  {loading ? "Applying..." : "Apply"}
                </Button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Help Text */}
          {!appliedCode && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Have a promotional code?</p>
                <p>Enter your code above to receive a discount on your order.</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
