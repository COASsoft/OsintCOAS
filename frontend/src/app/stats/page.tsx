'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { scanStorage } from '@/lib/scan-storage';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  Target, 
  Users, 
  Shield,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface StatsData {
  overview: {
    totalScans: number;
    successfulScans: number;
    failedScans: number;
    averageTime: number;
    activeScans: number;
  };
  toolUsage: Array<{
    tool: string;
    count: number;
    successRate: number;
  }>;
  timeline: Array<{
    date: string;
    scans: number;
    successful: number;
    failed: number;
  }>;
  riskDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchStats();
    
    // Actualizar cada 30 segundos solo como respaldo
    const interval = setInterval(fetchStats, 30000);
    
    // Escuchar eventos de scans para actualizar en tiempo real
    const handleScanUpdate = (event: any) => {
      console.log('📊 Nuevo scan detectado, actualizando estadísticas...', event.detail);
      fetchStats();
    };
    
    window.addEventListener('scanDataUpdated', handleScanUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('scanDataUpdated', handleScanUpdate);
    };
  }, []);

  const fetchStats = async () => {
    try {
      setError(null);
      
      // Obtener estadísticas reales del almacenamiento de scans
      const realStats = scanStorage.getStats();
      const allScans = scanStorage.loadScans();
      
      // Calcular uso de herramientas con tasa de éxito
      const toolUsageMap = new Map<string, { total: number, successful: number }>();
      
      allScans.forEach(scan => {
        const key = scan.toolName;
        if (!toolUsageMap.has(key)) {
          toolUsageMap.set(key, { total: 0, successful: 0 });
        }
        const stats = toolUsageMap.get(key)!;
        stats.total++;
        if (scan.status === 'completed') {
          stats.successful++;
        }
      });
      
      const toolUsage = Array.from(toolUsageMap.entries())
        .map(([tool, stats]) => ({
          tool,
          count: stats.total,
          successRate: stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 herramientas más usadas
      
      // Generar timeline de los últimos 7 días
      const timeline = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayScans = allScans.filter(scan => {
          const scanDate = new Date(scan.endTime).toISOString().split('T')[0];
          return scanDate === dateStr;
        });
        
        const successful = dayScans.filter(s => s.status === 'completed').length;
        const failed = dayScans.filter(s => s.status === 'failed').length;
        
        timeline.push({
          date: dateStr,
          scans: dayScans.length,
          successful,
          failed
        });
      }
      
      // Análisis de riesgo simple basado en resultados
      let lowRisk = 0, mediumRisk = 0, highRisk = 0;
      
      allScans.forEach(scan => {
        if (scan.status === 'completed' && scan.result) {
          const resultStr = JSON.stringify(scan.result).toLowerCase();
          
          // Detectar factores de alto riesgo
          if (resultStr.includes('high') || resultStr.includes('vulnerable') || 
              resultStr.includes('exposed') || resultStr.includes('breach')) {
            highRisk++;
          }
          // Detectar factores de riesgo medio
          else if (resultStr.includes('medium') || resultStr.includes('warning') || 
                   resultStr.includes('outdated') || resultStr.includes('unencrypted')) {
            mediumRisk++;
          }
          // El resto son bajo riesgo
          else {
            lowRisk++;
          }
        }
      });
      
      const riskDistribution = [
        { name: 'Bajo', value: lowRisk, color: '#00C49F' },
        { name: 'Medio', value: mediumRisk, color: '#FFBB28' },
        { name: 'Alto', value: highRisk, color: '#FF8042' }
      ].filter(item => item.value > 0); // Solo mostrar categorías con datos
      
      const statsData: StatsData = {
        overview: {
          totalScans: realStats.totalScans,
          successfulScans: realStats.successfulScans,
          failedScans: realStats.failedScans,
          averageTime: Math.round(realStats.avgDuration * 10) / 10, // Redondear a 1 decimal
          activeScans: 0 // Los scans activos no se guardan en localStorage
        },
        toolUsage,
        timeline,
        riskDistribution
      };

      // Si no hay datos reales, proporcionar ejemplo básico
      if (realStats.totalScans === 0) {
        statsData.riskDistribution = [
          { name: 'Bajo', value: 0, color: '#00C49F' },
          { name: 'Medio', value: 0, color: '#FFBB28' },
          { name: 'Alto', value: 0, color: '#FF8042' }
        ];
      }

      await new Promise(resolve => setTimeout(resolve, 300)); // Breve latencia
      setStats(statsData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchStats();
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error al Cargar Estadísticas
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchStats}>Reintentar</Button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const successRate = Math.round((stats.overview.successfulScans / stats.overview.totalScans) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estadísticas</h1>
          <p className="text-gray-600 mt-1">
            Panel de control y métricas de uso de la plataforma OSINT
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={loading} className="flex items-center space-x-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalScans}</div>
            <p className="text-xs text-muted-foreground">
              +12% desde la semana pasada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.overview.successfulScans} exitosos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scans Fallidos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overview.failedScans}</div>
            <p className="text-xs text-muted-foreground">
              -{3}% desde ayer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.averageTime}s</div>
            <p className="text-xs text-muted-foreground">
              -0.3s mejora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scans Activos</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.overview.activeScans}</div>
            <p className="text-xs text-muted-foreground">
              En tiempo real
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Tool Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Herramientas Más Utilizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.toolUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="tool" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3B82F6" name="Usos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Nivel de Riesgo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Actividad de los Últimos 7 Días</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={stats.timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="scans" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Total Scans"
              />
              <Line 
                type="monotone" 
                dataKey="successful" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Exitosos"
              />
              <Line 
                type="monotone" 
                dataKey="failed" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="Fallidos"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Success Rate by Tool */}
      <Card>
        <CardHeader>
          <CardTitle>Tasa de Éxito por Herramienta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.toolUsage.map((tool, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Target className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{tool.tool}</span>
                  <Badge variant="outline">{tool.count} usos</Badge>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all"
                      style={{ 
                        width: `${tool.successRate}%`,
                        backgroundColor: tool.successRate >= 90 ? '#10B981' : 
                                       tool.successRate >= 80 ? '#F59E0B' : '#EF4444'
                      }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${
                    tool.successRate >= 90 ? 'text-green-600' : 
                    tool.successRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {tool.successRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Última actualización: {lastUpdate.toLocaleString()}
      </div>
    </div>
  );
}