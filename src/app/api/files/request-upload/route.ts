import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';
import { 
  generateUploadUrl, 
  generateR2Key, 
  validateFileType, 
  validateFileSize 
} from '@/lib/storage/r2';
import { z } from 'zod';

const requestUploadSchema = z.object({
  originalFilename: z.string().min(1, 'Filename is required'),
  fileSize: z.number().positive('File size must be positive'),
  fileType: z.string().min(1, 'File type is required'),
  modificationIds: z.array(z.number()).min(1, 'At least one modification must be selected'),
  customerComment: z.string().optional(),
  dtcCodes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = requestUploadSchema.parse(body);

    const {
      originalFilename,
      fileSize,
      fileType,
      modificationIds,
      customerComment,
      dtcCodes,
    } = validatedData;

    // Validate file size
    if (!validateFileSize(fileSize)) {
      const maxSizeMB = Number(process.env.MAX_UPLOAD_MB || 200);
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Allow all file types - validation removed
    // if (!validateFileType(originalFilename, fileType)) {
    //   const allowedTypes = process.env.ALLOWED_FILE_TYPES || '.bin,.hex,.ecu,.map,.ori,.mod';
    //   return NextResponse.json(
    //     { error: `File type not allowed. Allowed types: ${allowedTypes}` },
    //     { status: 400 }
    //   );
    // }

    // Verify modifications exist (handle both database and static modifications)
    let modifications;
    try {
      modifications = await prisma.modification.findMany({
        where: {
          id: { in: modificationIds }
        }
      });

      // If database has no modifications (using static fallback), validate against static list
      if (modifications.length === 0) {
        console.log('No modifications in database, validating against static list');
        
        // Import static modifications for validation
        const staticModifications = [
          { id: 1, code: 'STAGE_1', label: 'Stage 1 Tune', description: 'Basic ECU remap for improved power and torque' },
          { id: 2, code: 'STAGE_2', label: 'Stage 2 Tune', description: 'Advanced tune with hardware modifications support' },
          { id: 3, code: 'STAGE_3', label: 'Stage 3 Tune', description: 'High-performance tune for extensively modified vehicles' },
          { id: 4, code: 'ECONOMY', label: 'Economy Tune', description: 'Optimized for fuel efficiency and reduced emissions' },
          { id: 5, code: 'DPF_DELETE', label: 'DPF Delete', description: 'Remove diesel particulate filter restrictions' },
          { id: 6, code: 'EGR_DELETE', label: 'EGR Delete', description: 'Disable exhaust gas recirculation system' },
          { id: 7, code: 'ADBLUE_DELETE', label: 'AdBlue Delete', description: 'Remove selective catalytic reduction system' },
          { id: 8, code: 'SWIRL_DELETE', label: 'Swirl Flap Delete', description: 'Disable intake manifold swirl flaps' },
          { id: 9, code: 'LAMBDA_DELETE', label: 'Lambda Delete', description: 'Remove oxygen sensor monitoring' },
          { id: 10, code: 'SPEED_LIMITER', label: 'Speed Limiter Removal', description: 'Remove factory speed limitations' },
          { id: 11, code: 'REV_LIMITER', label: 'Rev Limiter Adjustment', description: 'Modify engine rev limiter settings' },
          { id: 12, code: 'LAUNCH_CONTROL', label: 'Launch Control', description: 'Add launch control functionality' },
          { id: 13, code: 'POP_BANG', label: 'Pop & Bang', description: 'Add exhaust pops and bangs on deceleration' },
          { id: 14, code: 'COLD_START', label: 'Cold Start Delete', description: 'Remove cold start emissions restrictions' },
          { id: 15, code: 'IMMOBILIZER', label: 'Immobilizer Delete', description: 'Remove engine immobilizer system' },
          { id: 16, code: 'GEARBOX_TUNE', label: 'Gearbox Tune', description: 'Optimize automatic transmission parameters' },
          { id: 17, code: 'DSG_TUNE', label: 'DSG Tune', description: 'Enhance dual-clutch transmission performance' },
          { id: 18, code: 'TORQUE_LIMIT', label: 'Torque Limiter Removal', description: 'Remove factory torque limitations' }
        ];

        // Validate that all selected IDs exist in static list
        const validStaticIds = staticModifications.map(m => m.id);
        const invalidIds = modificationIds.filter(id => !validStaticIds.includes(id));
        
        if (invalidIds.length > 0) {
          return NextResponse.json(
            { error: `Invalid modification IDs: ${invalidIds.join(', ')}` },
            { status: 400 }
          );
        }

        // Create the selected modifications in the database so we can create relationships
        console.log('Creating selected modifications in database for relationship storage');
        const selectedStaticMods = staticModifications.filter(m => modificationIds.includes(m.id));
        
        for (const mod of selectedStaticMods) {
          await prisma.modification.upsert({
            where: { code: mod.code },
            update: {},
            create: {
              code: mod.code,
              label: mod.label,
              description: mod.description
            }
          });
        }

        // Now fetch the created modifications from database
        modifications = await prisma.modification.findMany({
          where: {
            code: { in: selectedStaticMods.map(m => m.code) }
          }
        });

      } else if (modifications.length !== modificationIds.length) {
        return NextResponse.json(
          { error: 'One or more selected modifications are invalid' },
          { status: 400 }
        );
      }
    } catch (dbError) {
      console.error('Database error during modification validation:', dbError);
      return NextResponse.json(
        { error: 'Failed to validate modifications' },
        { status: 500 }
      );
    }

    // Get user information for folder naming
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true }
    });

    const clientName = user ? `${user.firstName} ${user.lastName}` : 'unknown-client';
    const uploadDate = new Date();

    // Get modification names for folder naming
    const modificationNames = modifications.map(mod => mod.label);
    
    // Generate unique R2 key with UUID fallback for guaranteed uniqueness
    const tempFileId = crypto.randomUUID();
    const r2Key = generateR2Key(session.user.id, tempFileId, originalFilename, clientName, uploadDate, modificationNames);

    // Create file record in database with the R2 key
    const tuningFile = await prisma.tuningFile.create({
      data: {
        userId: session.user.id,
        originalFilename,
        r2Key, // Set the R2 key directly
        fileSize: BigInt(fileSize),
        fileType,
        status: 'RECEIVED',
        customerComment,
        dtcCodes, // Add DTC codes field
        fileModifications: {
          create: modifications.map(mod => ({
            modificationId: mod.id
          }))
        }
      }
    });

    // Generate presigned upload URL
    const uploadUrl = await generateUploadUrl({
      r2Key,
      contentType: fileType,
      contentLength: fileSize
    });

    return NextResponse.json({
      success: true,
      data: {
        fileId: tuningFile.id,
        uploadUrl,
        expiresIn: Number(process.env.PRESIGNED_URL_EXPIRES || 900)
      }
    });

  } catch (error) {
    console.error('Error in request-upload:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
