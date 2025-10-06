import { YalidineStatusManager } from '@/components/admin/yalidine-status-manager';
import { AdminHeaderLayout } from '@/components/admin/admin-header-layout';
import { AdminGuard } from '@/components/admin/admin-guard';

export default function YalidineStatusPage() {
  return (
    <AdminGuard>
      <AdminHeaderLayout>
        <YalidineStatusManager />
      </AdminHeaderLayout>
    </AdminGuard>
  );
}
