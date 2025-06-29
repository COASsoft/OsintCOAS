'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OSINTTool } from '@/types/osint';
import { getRiskColor } from '@/lib/utils';
import ToolExecutionModal from '@/components/tool-execution-modal';
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
  AlertCircle,
  RefreshCw
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
  const [selectedTool, setSelectedTool] = useState<OSINTTool | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchTools();
  }, []);

  useEffect(() => {
    filterTools();
  }, [tools, searchQuery, selectedCategory, selectedRisk]);

  const fetchTools = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Llamada directa a la API sin usar el client wrapper
      const response = await fetch('http://localhost:3001/api/osint/tools', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Timeout de 10 segundos
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setTools(data);
        console.log(`✅ Cargadas ${data.length} herramientas OSINT`);
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (err) {
      console.error('Error fetching tools:', err);
      
      // Reintentar hasta 3 veces con delay creciente
      if (retryCount < 3) {
        console.log(`🔄 Reintentando... (${retryCount + 1}/3)`);
        setTimeout(() => {
          fetchTools(retryCount + 1);
        }, 1000 * (retryCount + 1)); // 1s, 2s, 3s
        return;
      }
      
      setError(err instanceof Error ? err.message : 'Error de conexión con el backend');
    } finally {
      if (retryCount === 0 || retryCount >= 3) {
        setLoading(false);
      }
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
    const tool = tools.find(t => t.id === toolId);
    if (tool) {
      setSelectedTool(tool);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTool(null);
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
          <Button onClick={() => fetchTools(0)} className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar Conexión</span>
          </Button>
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
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar herramientas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>

        {/* Filtros de categoría y riesgo */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filtrar por:</span>
          </div>

          {/* Categorías */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              Todas
            </Button>
            {categories.map((category) => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons] || Settings;
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="flex items-center space-x-1"
                >
                  <Icon className="w-3 h-3" />
                  <span className="capitalize">{category}</span>
                </Button>
              );
            })}
          </div>

          {/* Niveles de riesgo */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedRisk === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRisk('all')}
            >
              Todo Riesgo
            </Button>
            {riskLevels.map((risk) => (
              <Button
                key={risk}
                variant={selectedRisk === risk ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRisk(risk)}
                className="flex items-center space-x-1"
              >
                <Shield className={`w-3 h-3 ${getRiskColor(risk).split(' ')[0]}`} />
                <span className="capitalize">{risk}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {filteredTools.length} herramientas disponibles
        </p>
      </div>

      {/* Grid de herramientas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map((tool) => {
          const Icon = categoryIcons[tool.category as keyof typeof categoryIcons] || Settings;
          
          return (
            <Card key={tool.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${categoryColors[tool.category as keyof typeof categoryColors] || categoryColors.misc}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Información de la herramienta */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {tool.category}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getRiskColor(tool.riskLevel)}`}
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {tool.riskLevel} risk
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      ~{tool.estimatedTime}s
                    </Badge>
                  </div>

                  {/* Parámetros requeridos */}
                  {tool.requiredParams && tool.requiredParams.length > 0 && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Parámetros:</span>{' '}
                      {tool.requiredParams.join(', ')}
                    </div>
                  )}

                  {/* Botón de ejecución */}
                  <Button
                    className="w-full"
                    onClick={() => handleRunTool(tool.id)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Ejecutar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mensaje cuando no hay resultados */}
      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron herramientas
          </h3>
          <p className="text-gray-600">
            Intenta ajustar tus filtros o términos de búsqueda
          </p>
        </div>
      )}

      {/* Modal de ejecución */}
      {selectedTool && (
        <ToolExecutionModal
          tool={selectedTool}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}