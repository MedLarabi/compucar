"use client";

import { ProductImageUpload, AvatarUpload } from "@/components/uploads";
import { MainLayout } from "@/components/layout/main-layout-simple";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function UploadTestPage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Upload Testing</h1>
            <p className="text-muted-foreground mt-2">
              Test image upload functionality with UploadThing
            </p>
          </div>

          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="products">Product Images</TabsTrigger>
              <TabsTrigger value="avatar">Avatar Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Product Image Upload</CardTitle>
                </CardHeader>
                <CardContent>
                  <UploadTestProductImages />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="avatar" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Avatar Upload</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <UploadTestAvatar />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}

function UploadTestProductImages() {
  const handleImagesChange = (images: string[]) => {
    console.log("Product images updated:", images);
  };

  return (
    <ProductImageUpload
      onImagesChange={handleImagesChange}
      maxImages={5}
    />
  );
}

function UploadTestAvatar() {
  const handleAvatarChange = (url: string) => {
    console.log("Avatar updated:", url);
  };

  return (
    <AvatarUpload
      onAvatarChange={handleAvatarChange}
      fallbackText="TC"
    />
  );
}
