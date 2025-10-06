import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="container mx-auto space-y-8 p-8">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">CompuCar E-commerce</h1>
        <p className="text-muted-foreground">Next.js 15 + Shadcn/ui + Tailwind CSS v4</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="secondary">Shadcn/ui ✅</Badge>
          <Badge variant="outline">Tailwind CSS v4 ✅</Badge>
          <Badge>Ready for Testing ✅</Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Server Status</CardTitle>
            <CardDescription>Development server is working</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">✅ Next.js 15 running</p>
            <p className="text-sm">✅ Shadcn/ui components loaded</p>
            <p className="text-sm">✅ Tailwind CSS working</p>
            <Button className="w-full">Test Button</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database</CardTitle>
            <CardDescription>PostgreSQL + Prisma status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">🔄 Prisma client regenerated</p>
            <p className="text-sm">🔄 Schema up to date</p>
            <p className="text-sm">📊 Sample data seeded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>Ready for Phase 5</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">🛒 Shopping Cart</p>
            <p className="text-sm">❤️ Wishlist</p>
            <p className="text-sm">💳 Checkout</p>
            <Button variant="outline" className="w-full">Continue Development</Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-muted-foreground text-sm">
          🎉 Server is running! Phase 4 Complete - Product Management System Ready!
        </p>
      </div>
    </div>
  );
}























































