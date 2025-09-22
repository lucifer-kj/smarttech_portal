'use client';

import { Card } from '@/components/ui/Card';

export default function MaintenancePlaceholder() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Maintenance (Planned)</h1>
      <Card className="p-6">
        <p className="text-gray-600">Preventive maintenance, equipment registry, and contracts will appear here.</p>
      </Card>
    </div>
  );
}


