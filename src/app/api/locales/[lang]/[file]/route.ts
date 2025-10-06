import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lang: string; file: string }> }
) {
  try {
    const { lang, file } = await params;
    
    // Validate language and file
    const allowedLangs = ['en', 'fr', 'ar'];
    const allowedFiles = ['common.json'];
    
    if (!allowedLangs.includes(lang) || !allowedFiles.includes(file)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }
    
    // Read the translation file
    const filePath = path.join(process.cwd(), 'locales', lang, file);
    const fileContent = await readFile(filePath, 'utf-8');
    const translations = JSON.parse(fileContent);
    
    return NextResponse.json(translations, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error loading translation file:', error);
    return NextResponse.json({ error: 'Translation file not found' }, { status: 404 });
  }
}
