# File Tuning System

A complete car file tuning management system built with Next.js, PostgreSQL, and Cloudflare R2.

## Features

### Customer Features
- **File Upload**: Secure file upload with drag-and-drop interface
- **Modification Selection**: Choose from 18+ available tuning modifications
- **Comments**: Add custom comments for specific requirements
- **File Management**: View all uploaded files and their status
- **Download Ready Files**: Secure download links for processed files
- **Notifications**: Real-time in-site and email notifications
- **Payment Tracking**: View pricing and payment status

### Admin Features
- **File Queue Management**: View and manage all uploaded files
- **Status Updates**: Change file status (Received → Pending → Ready)
- **Pricing**: Set custom pricing for each file
- **Payment Management**: Track and update payment status
- **Download Files**: Secure download of customer files
- **Admin Notes**: Internal notes for each file
- **Audit Logging**: Complete history of all changes
- **Email Notifications**: Automatic notifications to customers

### Technical Features
- **Cloudflare R2 Storage**: Secure, scalable file storage
- **Presigned URLs**: Direct client uploads and secure downloads
- **Email System**: Comprehensive email templates and notifications
- **Real-time Notifications**: In-site notification system
- **Audit Trail**: Complete audit logging for all actions
- **Security**: File type validation, size limits, access control

## Database Schema

### Core Tables
- `modifications` - Available tuning modifications
- `tuning_files` - Customer uploaded files
- `file_modifications` - Junction table for file-modification relationships
- `tuning_notifications` - In-site notifications
- `audit_logs` - Complete audit trail

### Enums
- `TuningFileStatus`: RECEIVED, PENDING, READY
- `TuningPaymentStatus`: NOT_PAID, PAID

## API Endpoints

### Customer Endpoints
- `POST /api/files/request-upload` - Request file upload URL
- `POST /api/files/confirm-upload` - Confirm successful upload
- `GET /api/files` - List user's files
- `GET /api/files/[id]` - Get file details with download URL
- `GET /api/modifications` - List available modifications
- `GET /api/notifications` - Get user notifications

### Admin Endpoints
- `GET /api/admin/files` - List all files with filtering
- `GET /api/admin/files/[id]` - Get file details for admin
- `POST /api/admin/files/[id]/update-status` - Update file status
- `POST /api/admin/files/[id]/set-price` - Set file price
- `POST /api/admin/files/[id]/set-payment` - Update payment status
- `POST /api/admin/files/[id]/add-note` - Add admin notes

## File Upload Flow

1. **Request Upload**: Customer selects file, modifications, and comments
2. **Generate Presigned URL**: Server creates secure upload URL
3. **Direct Upload**: Client uploads directly to Cloudflare R2
4. **Confirm Upload**: Client confirms successful upload
5. **Admin Notification**: Admin receives email and in-site notification
6. **Processing**: Admin downloads file and processes it
7. **Status Updates**: Admin updates status and sets price
8. **Customer Notification**: Customer receives notifications at each step
9. **Download**: Customer downloads processed file

## Environment Variables

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-account-id
R2_BUCKET=your-bucket-name
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_REGION=auto

# File Upload Settings
PRESIGNED_URL_EXPIRES=900
MAX_UPLOAD_MB=200
ALLOWED_FILE_TYPES=.bin,.hex,.ecu,.map,.ori,.mod,.kess,.ktag,.pcm,.edc,.damos,.a2l

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_NAME=CompuCar File Tuning
FROM_EMAIL=noreply@compucar.com

# Admin Email for Notifications
ADMIN_EMAIL=admin@compucar.com
```

## Setup Instructions

### 1. Database Setup
```bash
# Push schema to database
npx prisma db push

# Seed modifications
npx tsx prisma/seed-tuning.ts
```

### 2. Cloudflare R2 Setup
1. Create a Cloudflare R2 bucket
2. Generate API tokens with R2 permissions
3. Configure CORS settings for direct uploads
4. Set environment variables

### 3. Email Configuration
1. Configure SMTP settings (Gmail, SendGrid, etc.)
2. Set admin email addresses
3. Test email delivery

### 4. Admin User Setup
Update a user to have admin privileges:
```sql
UPDATE "User" SET "isAdmin" = true WHERE email = 'admin@compucar.com';
```

## File Types Supported

- `.bin` - Binary ECU files
- `.hex` - Hexadecimal files
- `.ecu` - ECU dump files
- `.map` - Map files
- `.ori` - Original files
- `.mod` - Modified files
- `.kess` - Kess files
- `.ktag` - K-TAG files
- `.pcm` - PCM files
- `.edc` - EDC files
- `.damos` - DAMOS files
- `.a2l` - A2L files

## Available Modifications

1. **Stage 1 Tune** - Basic ECU remap
2. **Stage 2 Tune** - Advanced tune with hardware support
3. **Stage 3 Tune** - High-performance tune
4. **Economy Tune** - Fuel efficiency optimization
5. **DPF Delete** - Remove diesel particulate filter
6. **EGR Delete** - Disable exhaust gas recirculation
7. **AdBlue Delete** - Remove SCR system
8. **Swirl Flap Delete** - Disable intake swirl flaps
9. **Lambda Delete** - Remove oxygen sensor monitoring
10. **Speed Limiter Removal** - Remove speed limits
11. **Rev Limiter Adjustment** - Modify rev limits
12. **Launch Control** - Add launch control
13. **Pop & Bang** - Add exhaust effects
14. **Cold Start Delete** - Remove cold start restrictions
15. **Immobilizer Delete** - Remove immobilizer
16. **Gearbox Tune** - Optimize transmission
17. **DSG Tune** - Enhance dual-clutch transmission
18. **Torque Limiter Removal** - Remove torque limits

## Security Features

- **File Type Validation**: Only allowed file types accepted
- **Size Limits**: Configurable maximum file size
- **Presigned URLs**: Short-lived, secure upload/download URLs
- **Access Control**: Admin-only access to management features
- **Audit Logging**: Complete history of all actions
- **Input Sanitization**: All user inputs sanitized

## Monitoring & Logging

- **Audit Logs**: All file status changes, price updates, payments
- **Email Logs**: Success/failure of email deliveries
- **Error Handling**: Comprehensive error logging
- **Performance Monitoring**: File upload/download metrics

## Troubleshooting

### File Upload Issues
1. Check R2 credentials and permissions
2. Verify CORS settings on R2 bucket
3. Check file size and type restrictions
4. Verify presigned URL expiration

### Email Issues
1. Check SMTP credentials
2. Verify admin email configuration
3. Check spam folders
4. Test with Ethereal Email for development

### Database Issues
1. Verify schema is up to date
2. Check enum conflicts
3. Ensure admin users are properly flagged
4. Verify foreign key relationships

## Development

### Running Locally
```bash
npm run dev
```

### Database Commands
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# View database
npx prisma studio
```

### Testing
```bash
# Run tests
npm test

# Test email functionality
npm run test:email
```

## Production Deployment

1. Set all environment variables
2. Configure R2 bucket and CORS
3. Set up SMTP service
4. Deploy to Vercel/Railway
5. Run database migrations
6. Seed initial data
7. Test file upload/download flow
8. Verify email notifications

## Support

For technical support or questions about the file tuning system, please contact the development team or refer to the API documentation.
