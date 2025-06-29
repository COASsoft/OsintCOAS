'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Users,
  Server,
  Zap
} from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalScans: number;
    successfulScans: number;
    failedScans: number;
    averageTime: number;
    activeScans?: number;
    queuedScans?: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const successRate = stats.totalScans > 0 
    ? ((stats.successfulScans / stats.totalScans) * 100).toFixed(1)
    : '0';

  const cards = [
    {
      title: 'Total de Scans',
      value: stats.totalScans.toLocaleString(),
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Scans realizados'
    },
    {
      title: 'Scans Exitosos',
      value: stats.successfulScans.toLocaleString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: `${successRate}% tasa de éxito`
    },
    {
      title: 'Scans Fallidos',
      value: stats.failedScans.toLocaleString(),
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: 'Requieren atención'
    },
    {
      title: 'Tiempo Promedio',
      value: `${stats.averageTime.toFixed(1)}s`,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Por scan'
    }
  ];

  // Agregar cards adicionales si hay datos de tiempo real
  if (stats.activeScans !== undefined) {
    cards.push({
      title: 'Scans Activos',
      value: stats.activeScans.toString(),
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'En ejecución'
    });
  }

  if (stats.queuedScans !== undefined) {
    cards.push({
      title: 'En Cola',
      value: stats.queuedScans.toString(),
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      description: 'Esperando'
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {card.value}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}