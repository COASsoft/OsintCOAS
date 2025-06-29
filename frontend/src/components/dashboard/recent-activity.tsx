'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, getStatusColor, formatDuration } from '@/lib/utils';
import { OSINTScan } from '@/types/osint';
import { Activity, ExternalLink } from 'lucide-react';

interface RecentActivityProps {
  scans: OSINTScan[];
}

export default function RecentActivity({ scans }: RecentActivityProps) {
  if (!scans || scans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Actividad Reciente</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay actividad reciente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Actividad Reciente</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scans.slice(0, 5).map((scan) => (
            <div
              key={scan.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900 capitalize">
                    {scan.tool.replace('-', ' ')}
                  </span>
                  <Badge 
                    className={`${getStatusColor(scan.status)} px-2 py-1 text-xs`}
                  >
                    {scan.status === 'completed' ? 'Completado' :
                     scan.status === 'running' ? 'Ejecutando' :
                     scan.status === 'error' ? 'Error' : 'Pendiente'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center space-x-1">
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate max-w-32">{scan.target}</span>
                  </span>
                  <span>{formatDate(scan.startTime)}</span>
                  {scan.duration && (
                    <span>{formatDuration(scan.duration)}</span>
                  )}
                </div>
              </div>
              
              {scan.status === 'running' && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-600">En progreso</span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {scans.length > 5 && (
          <div className="mt-4 text-center">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Ver todas las actividades →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}