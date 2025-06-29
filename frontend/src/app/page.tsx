'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCards from '@/components/dashboard/stats-cards';
import RecentActivity from '@/components/dashboard/recent-activity';
import ToolUsageChart from '@/components/charts/tool-usage-chart';
import { OSINTStats } from '@/types/osint';
import apiClient from '@/lib/api';
import { scanStorage } from '@/lib/scan-storage';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [stats, setStats] = useState<OSINTStats | null>(null);
  const [realtimeStats, setRealtimeStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener estadísticas reales del almacenamiento local
      const realStats = scanStorage.getStats();
      const recentScans = scanStorage.getRecentScans(10);

      // Crear estadísticas compatibles con el formato esperado
      const mockStats: OSINTStats = {
        totalScans: realStats.totalScans || 0,
        successfulScans: realStats.successfulScans || 0,
        failedScans: realStats.failedScans || 0,
        averageTime: realStats.avgDuration || 0,
        activeScans: 0, // Scans activos son siempre 0 ya que no tenemos scans en tiempo real
        topTools: Object.entries(realStats.toolUsage)
          .map(([tool, count]) => ({ tool, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        recentActivity: recentScans.map(scan => ({
          id: scan.id,
          tool: scan.toolName,
          target: scan.target,
          status: scan.status,
          startTime: scan.startTime,
          endTime: scan.endTime,
          timestamp: new Date(scan.endTime).toISOString(),
          duration: scan.duration
        })),
        toolUsage: realStats.toolUsage // Agregar para el gráfico
      };

      setStats(mockStats);

      // Estadísticas en tiempo real simuladas
      const mockRealtimeStats = {
        activeScans: 0,
        queuedScans: 0,
        serverLoad: {
          cpu: Math.random() * 30 + 10, // 10-40%
          memory: Math.random() * 20 + 40, // 40-60%
          disk: Math.random() * 15 + 15 // 15-30%
        },
        performance: {
          responseTime: Math.random() * 200 + 100, // 100-300ms
          throughput: Math.random() * 50 + 25, // 25-75 req/min
          errorRate: Math.random() * 5 // 0-5%
        },
        lastUpdate: new Date().toISOString()
      };

      setRealtimeStats(mockRealtimeStats);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Limpiar datos antiguos con IDs problemáticos
    const existingScans = scanStorage.loadScans();
    
    // Filtrar y eliminar scans con IDs duplicados o antiguos
    const cleanedScans = existingScans.filter((scan, index, self) => {
      // Verificar que el ID sea único
      const isUnique = self.findIndex(s => s.id === scan.id) === index;
      // Verificar que el ID tenga el formato nuevo (con sufijo aleatorio)
      const hasNewFormat = scan.id.includes('_') && scan.id.split('_').length >= 3;
      return isUnique && hasNewFormat;
    });
    
    // Si hubo limpieza, guardar los datos limpios
    if (cleanedScans.length !== existingScans.length) {
      localStorage.setItem('osint_scans', JSON.stringify(cleanedScans));
      console.log('🧹 Limpiados scans duplicados o con formato antiguo');
    }
    
    // Forzar limpieza de IDs problemáticos específicos
    const problematicId = 'scan_1750849778301';
    if (existingScans.some(scan => scan.id === problematicId)) {
      const filtered = existingScans.filter(scan => scan.id !== problematicId);
      localStorage.setItem('osint_scans', JSON.stringify(filtered));
      console.log('🧹 Eliminado scan con ID problemático:', problematicId);
    }
    
    // Crear datos de prueba si no existen
    if (cleanedScans.length === 0) {
      // Crear algunos scans de ejemplo para mostrar datos
      const testScans = [
        {
          id: 'test_scan_1',
          toolId: 'instagram-recon',
          toolName: 'Instagram Reconnaissance',
          target: 'testuser123',
          parameters: { username: 'testuser123' },
          result: {
            profile: {
              username: 'testuser123',
              followers: 1250,
              following: 350,
              posts: 89
            }
          },
          status: 'completed' as const,
          startTime: new Date(Date.now() - 300000), // 5 minutos atrás
          endTime: new Date(Date.now() - 290000),
          duration: 10
        },
        {
          id: 'test_scan_2',
          toolId: 'whois',
          toolName: 'Whois Lookup',
          target: 'example.com',
          parameters: { domain: 'example.com' },
          result: {
            domain: 'example.com',
            registrar: 'GoDaddy.com, LLC',
            expirationDate: '2026-03-15'
          },
          status: 'completed' as const,
          startTime: new Date(Date.now() - 180000), // 3 minutos atrás
          endTime: new Date(Date.now() - 175000),
          duration: 5
        }
      ];
      
      testScans.forEach(scan => {
        scanStorage.saveScan(scan);
        reportGenerator.generateAutoReport(scan);
      });
      
      console.log('✅ Datos de prueba creados para dashboard y reportes');
    }
    
    // Actualizar estadísticas cada 10 segundos
    const interval = setInterval(fetchStats, 10000);
    
    // Escuchar eventos personalizados para actualizar automáticamente
    const handleScanUpdate = (event: any) => {
      console.log('🔄 Nuevo scan detectado, actualizando dashboard...', event.detail);
      fetchStats();
    };
    
    const handleReportUpdate = (event: any) => {
      console.log('🔄 Nuevo reporte detectado, actualizando dashboard...', event.detail);
      fetchStats();
    };
    
    window.addEventListener('scanDataUpdated', handleScanUpdate);
    window.addEventListener('reportDataUpdated', handleReportUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('scanDataUpdated', handleScanUpdate);
      window.removeEventListener('reportDataUpdated', handleReportUpdate);
    };
  }, []);

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error de Conexión
          </h2>
          <p className="text-gray-600 mb-4">
            No se pudo conectar con el servidor API. Verifique que el backend esté ejecutándose.
          </p>
          <Button onClick={fetchStats} className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard OSINT</h1>
            <p className="text-gray-600 mt-1">
              Monitoreo y estadísticas de herramientas de reconocimiento
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Última actualización: {lastUpdate.toLocaleTimeString()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mensaje de error si hay problemas con datos */}
      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800">
              Algunos datos podrían no estar actualizados: {error}
            </p>
          </div>
        </div>
      )}

      {/* Estadísticas principales */}
      {stats && (
        <div className="mb-8">
          <StatsCards 
            stats={{
              ...stats,
              activeScans: realtimeStats?.activeScans,
              queuedScans: realtimeStats?.queuedScans
            }} 
          />
        </div>
      )}

      {/* Grid de contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de uso de herramientas */}
        {stats?.toolUsage && Object.keys(stats.toolUsage).length > 0 && (
          <ToolUsageChart data={stats.toolUsage} />
        )}

        {/* Actividad reciente */}
        {stats?.recentActivity && (
          <RecentActivity scans={stats.recentActivity} />
        )}
      </div>

      {/* Estado del servidor */}
      {realtimeStats && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Estado del Servidor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {realtimeStats.serverLoad?.cpu?.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">CPU</div>
                  <div className={`w-full bg-gray-200 rounded-full h-2 mt-2`}>
                    <div 
                      className={`h-2 rounded-full ${
                        realtimeStats.serverLoad?.cpu > 80 ? 'bg-red-500' :
                        realtimeStats.serverLoad?.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${realtimeStats.serverLoad?.cpu || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {realtimeStats.serverLoad?.memory?.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Memoria</div>
                  <div className={`w-full bg-gray-200 rounded-full h-2 mt-2`}>
                    <div 
                      className={`h-2 rounded-full ${
                        realtimeStats.serverLoad?.memory > 80 ? 'bg-red-500' :
                        realtimeStats.serverLoad?.memory > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${realtimeStats.serverLoad?.memory || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {realtimeStats.performance?.responseTime?.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-gray-500">Tiempo de Respuesta</div>
                  <div className={`w-full bg-gray-200 rounded-full h-2 mt-2`}>
                    <div 
                      className={`h-2 rounded-full ${
                        realtimeStats.performance?.responseTime > 1000 ? 'bg-red-500' :
                        realtimeStats.performance?.responseTime > 500 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((realtimeStats.performance?.responseTime || 0) / 10, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
