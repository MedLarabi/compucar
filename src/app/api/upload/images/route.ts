import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { uploadProductMediaToR2 } from '@/lib/storage/r2-products';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 4MB' }, { status: 400 });
    }

    console.log("Uploading image to R2...");

    // Upload to R2
    const uploadResult = await uploadProductMediaToR2({
      file,
      type: 'image',
      userId: session.user.id,
    });

    console.log("R2 image upload successful:", uploadResult);

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      filename: uploadResult.name,
      r2Key: uploadResult.r2Key,
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}