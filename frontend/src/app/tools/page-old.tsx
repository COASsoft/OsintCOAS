'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OSINTTool } from '@/types/osint';
import apiClient from '@/lib/api';
import { getRiskColor } from '@/lib/utils';
import { 
  Search, 
  Filter, 
  Play, 
  Clock, 
  Shield, 
  Network, 
  Globe, 
  Users, 
  File, 
  Settings,
  Loader2,
  AlertCircle
} from 'lucide-react';

const categoryIcons = {
  network: Network,
  domain: Globe,
  social: Users,
  file: File,
  misc: Settings
};

const categoryColors = {
  network: 'bg-blue-100 text-blue-800',
  domain: 'bg-green-100 text-green-800',
  social: 'bg-purple-100 text-purple-800',
  file: 'bg-orange-100 text-orange-800',
  misc: 'bg-gray-100 text-gray-800'
};

export default function ToolsPage() {
  const [tools, setTools] = useState<OSINTTool[]>([]);
  const [filteredTools, setFilteredTools] = useState<OSINTTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');

  useEffect(() => {
    fetchTools();
  }, []);

  useEffect(() => {
    filterTools();
  }, [tools, searchQuery, selectedCategory, selectedRisk]);

  const fetchTools = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getTools();
      
      if (response.success && response.data) {
        setTools(response.data.tools);
      } else {
        throw new Error(response.error || 'Error al cargar herramientas');
      }
    } catch (err) {
      console.error('Error fetching tools:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const filterTools = () => {
    let filtered = [...tools];

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(tool =>
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tool => tool.category === selectedCategory);
    }

    // Filtrar por nivel de riesgo
    if (selectedRisk !== 'all') {
      filtered = filtered.filter(tool => tool.riskLevel === selectedRisk);
    }

    setFilteredTools(filtered);
  };

  const handleRunTool = (toolId: string) => {
    // Por ahora, simplemente log - después implementaremos el modal de ejecución
    console.log('Running tool:', toolId);
    // TODO: Abrir modal de configuración y ejecución
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando herramientas OSINT...</p>
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
            Error al Cargar
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchTools}>Reintentar</Button>
        </div>
      </div>
    );
  }

  const categories = [...new Set(tools.map(tool => tool.category))];
  const riskLevels = ['low', 'medium', 'high'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Herramientas OSINT</h1>
        <p className="text-gray-600 mt-1">
          Ejecute herramientas de reconocimiento e inteligencia de código abierto
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar herramientas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtro por categoría */}
          <div className="lg:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por riesgo */}
          <div className="lg:w-48">
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos los riesgos</option>
              {riskLevels.map(risk => (
                <option key={risk} value={risk}>
                  {risk === 'low' ? 'Bajo' : risk === 'medium' ? 'Medio' : 'Alto'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Estadísticas de filtros */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Mostrando {filteredTools.length} de {tools.length} herramientas
          </span>
          {(searchQuery || selectedCategory !== 'all' || selectedRisk !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedRisk('all');
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Grid de herramientas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map((tool) => {
          const CategoryIcon = categoryIcons[tool.category];
          return (
            <Card key={tool.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${categoryColors[tool.category]}`}>
                      <CategoryIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                      <p className="text-sm text-gray-500 font-mono">{tool.flag}</p>
                    </div>
                  </div>
                  <Badge className={getRiskColor(tool.riskLevel)}>
                    {tool.riskLevel === 'low' ? 'Bajo' : 
                     tool.riskLevel === 'medium' ? 'Medio' : 'Alto'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {tool.description}
                </p>
                
                <div className="space-y-3">
                  {/* Información técnica */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center space-x-1 text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>~{tool.estimatedTime}s</span>
                    </span>
                    <span className="flex items-center space-x-1 text-gray-500">
                      <Shield className="w-3 h-3" />
                      <span className="capitalize">{tool.category}</span>
                    </span>
                  </div>

                  {/* Parámetros requeridos */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Parámetros requeridos:</p>
                    <div className="flex flex-wrap gap-1">
                      {tool.requiredParams.map(param => (
                        <Badge key={param} variant="outline" className="text-xs">
                          {param}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Botón de ejecución */}
                  <Button 
                    onClick={() => handleRunTool(tool.id)}
                    className="w-full flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Ejecutar</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mensaje cuando no hay resultados */}
      {filteredTools.length === 0 && !loading && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron herramientas
          </h3>
          <p className="text-gray-600">
            Intenta ajustar los filtros o términos de búsqueda
          </p>
        </div>
      )}
    </div>
  );
}