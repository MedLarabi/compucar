"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin } from "lucide-react";

export interface YalidineParcelPreview {
  deliveryType: "home" | "stopdesk";
  wilaya?: string;
  commune?: string;
  freeShipping?: boolean;
  stopdeskId?: number;
  priceDzd?: number; // total in DA
  productList?: string;
  customer?: { firstname?: string; familyname?: string; phone?: string };
}

interface Props {
  preview: YalidineParcelPreview;
}

export function YalidineParcelLive({ preview }: Props) {
  const addressLine = preview.deliveryType === "home"
    ? `${preview.commune || ""}${preview.commune && preview.wilaya ? ", " : ""}${preview.wilaya || ""}`
    : preview.wilaya || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Yalidine Parcel (Live Preview)
        </CardTitle>
        <CardDescription>Updates in real-time as you edit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <Badge variant={preview.deliveryType === "stopdesk" ? "default" : "secondary"}>
            {preview.deliveryType === "stopdesk" ? "Stop-Desk" : "Home Delivery"}
          </Badge>
          {typeof preview.stopdeskId === "number" && preview.deliveryType === "stopdesk" && (
            <span className="text-muted-foreground">ID: {preview.stopdeskId}</span>
          )}
          {preview.freeShipping && (
            <Badge variant="outline" className="ml-auto">Free Shipping</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{addressLine || "—"}</span>
        </div>

        {preview.customer && (preview.customer.firstname || preview.customer.familyname || preview.customer.phone) && (
          <div>
            <div><strong>Customer:</strong> {`${preview.customer.firstname || ""} ${preview.customer.familyname || ""}`.trim()}</div>
            {preview.customer.phone && (
              <div className="text-muted-foreground">{preview.customer.phone}</div>
            )}
          </div>
        )}

        <div>
          <div className="font-medium">Amount to collect</div>
          <div className="text-lg font-semibold">{typeof preview.priceDzd === "number" ? `${Math.round(preview.priceDzd)} DA` : "—"}</div>
        </div>

        {preview.productList && (
          <div>
            <div className="font-medium mb-1">Products</div>
            <div className="text-muted-foreground break-words whitespace-pre-wrap">{preview.productList}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


