import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";

// DELETE - Delete user account
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Delete user and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete user's course enrollments
      await tx.courseEnrollment.deleteMany({
        where: { userId: userId },
      });

      // Delete user's course progress
      await tx.courseProgress.deleteMany({
        where: { userId: userId },
      });

      // Delete user's video progress
      await tx.videoProgress.deleteMany({
        where: { userId: userId },
      });

      // Delete user's orders
      const orders = await tx.order.findMany({
        where: { userId: userId },
        select: { id: true },
      });

      for (const order of orders) {
        // Delete order items
        await tx.orderItem.deleteMany({
          where: { orderId: order.id },
        });
      }

      // Delete orders
      await tx.order.deleteMany({
        where: { userId: userId },
      });

      // Delete user's addresses
      await tx.address.deleteMany({
        where: { userId: userId },
      });

      // Delete user's sessions
      await tx.session.deleteMany({
        where: { userId: userId },
      });

      // Delete user's accounts (OAuth connections)
      await tx.account.deleteMany({
        where: { userId: userId },
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return NextResponse.json({ 
      success: true,
      message: "Account deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
