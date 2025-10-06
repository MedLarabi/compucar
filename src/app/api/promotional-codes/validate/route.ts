import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { PromotionalCodesService } from "@/lib/services/promotional-codes";
import { z } from "zod";

const validateCodeSchema = z.object({
  code: z.string().min(1),
  cartItems: z.array(z.object({
    productId: z.string(),
    categoryId: z.string(),
    price: z.number().positive(),
    quantity: z.number().positive()
  })),
  subtotal: z.number().positive()
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const validation = validateCodeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { code, cartItems, subtotal } = validation.data;

    const result = await PromotionalCodesService.validateCode(
      code,
      session.user.id,
      cartItems,
      subtotal
    );

    if (result.isValid) {
      return NextResponse.json({
        success: true,
        data: {
          code: result.code,
          discountAmount: result.discountAmount
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error validating promotional code:', error);
    return NextResponse.json(
      { error: "Failed to validate promotional code" },
      { status: 500 }
    );
  }
}
