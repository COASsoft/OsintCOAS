'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface ToolUsageChartProps {
  data: Record<string, number>;
}

export default function ToolUsageChart({ data }: ToolUsageChartProps) {
  // Convertir datos para el gráfico
  const chartData = Object.entries(data)
    .map(([tool, count]) => ({
      tool: tool.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      percentage: data ? ((count / Object.values(data).reduce((a, b) => a + b, 0)) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Top 8 herramientas

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-blue-600">
            <span className="font-medium">{payload[0].value}</span> usos
          </p>
          <p className="text-gray-500 text-sm">
            {payload[0].payload.percentage}% del total
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data || Object.keys(data).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Uso de Herramientas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay datos disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Uso de Herramientas</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="tool" 
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                className="hover:opacity-80 transition-opacity"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Estadísticas adicionales */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Object.values(data).reduce((a, b) => a + b, 0)}
            </div>
            <div className="text-sm text-gray-500">Total de usos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Object.keys(data).length}
            </div>
            <div className="text-sm text-gray-500">Herramientas utilizadas</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}