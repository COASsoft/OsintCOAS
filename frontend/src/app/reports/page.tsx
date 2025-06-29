'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Calendar, 
  Search, 
  Filter,
  Eye,
  Trash2,
  FileImage,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw
} from 'lucide-react';
import ReportViewerModal from '@/components/report-viewer-modal';
import { reportGenerator } from '@/lib/report-generator';

interface Report {
  id: string;
  title: string;
  description: string;
  format: 'pdf' | 'json' | 'csv' | 'html';
  createdAt: string;
  scansCount: number;
  size: string;
  status: 'completed' | 'generating' | 'failed';
  downloadUrl?: string;
}

const formatIcons = {
  pdf: FileText,
  json: FileText,
  csv: FileSpreadsheet,
  html: FileImage
};

const formatColors = {
  pdf: 'bg-red-100 text-red-800',
  json: 'bg-blue-100 text-blue-800', 
  csv: 'bg-green-100 text-green-800',
  html: 'bg-purple-100 text-purple-800'
};

const statusColors = {
  completed: 'bg-green-100 text-green-800',
  generating: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800'
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    fetchReports();
    
    // Solo escuchar eventos personalizados para actualizar cuando hay cambios reales
    const handleScanUpdate = (event: any) => {
      console.log('🔄 Nuevo scan detectado, actualizando reportes...', event.detail);
      fetchReports();
    };
    
    const handleReportUpdate = (event: any) => {
      console.log('🔄 Nuevo reporte detectado, actualizando lista...', event.detail);
      fetchReports();
    };
    
    window.addEventListener('scanDataUpdated', handleScanUpdate);
    window.addEventListener('reportDataUpdated', handleReportUpdate);
    
    return () => {
      window.removeEventListener('scanDataUpdated', handleScanUpdate);
      window.removeEventListener('reportDataUpdated', handleReportUpdate);
    };
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchQuery, selectedFormat, selectedStatus]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener reportes reales generados automáticamente
      const realReports = reportGenerator.getReports();
      
      // Convertir al formato esperado por la interfaz
      const convertedReports: Report[] = realReports.map(report => ({
        id: report.id,
        title: report.title,
        description: report.description,
        format: report.format,
        createdAt: report.createdAt,
        scansCount: report.scansCount,
        size: report.size,
        status: report.status,
        downloadUrl: report.downloadUrl
      }));

      // Si no hay reportes reales, agregar algunos ejemplos
      const mockReports: Report[] = convertedReports.length > 0 ? [] : [
        {
          id: '1',
          title: 'Informe de Reconocimiento - Target Corp',
          description: 'Análisis completo de infraestructura y dominios',
          format: 'pdf',
          createdAt: '2025-06-25T10:30:00Z',
          scansCount: 15,
          size: '2.4 MB',
          status: 'completed',
          downloadUrl: '#'
        },
        {
          id: '2', 
          title: 'Reporte de Vulnerabilidades - Sistema X',
          description: 'Escaneo de puertos y servicios expuestos',
          format: 'json',
          createdAt: '2025-06-24T15:45:00Z',
          scansCount: 8,
          size: '1.2 MB',
          status: 'completed',
          downloadUrl: '#'
        },
        {
          id: '3',
          title: 'Análisis de Subdominios - ejemplo.com',
          description: 'Enumeración exhaustiva de subdominios',
          format: 'csv',
          createdAt: '2025-06-24T09:15:00Z',
          scansCount: 12,
          size: '845 KB',
          status: 'completed',
          downloadUrl: '#'
        },
        {
          id: '4',
          title: 'OSINT Social Media Report',
          description: 'Reconocimiento en redes sociales',
          format: 'html',
          createdAt: '2025-06-23T14:20:00Z',
          scansCount: 6,
          size: '3.1 MB',
          status: 'completed',
          downloadUrl: '#'
        },
        {
          id: '5',
          title: 'Informe Mensual - Junio 2025',
          description: 'Resumen de actividad del mes',
          format: 'pdf',
          createdAt: '2025-06-25T16:00:00Z',
          scansCount: 42,
          size: '0 KB',
          status: 'generating'
        },
        {
          id: '6',
          title: 'Análisis de IP Range',
          description: 'Escaneo fallido por timeout',
          format: 'json',
          createdAt: '2025-06-22T11:30:00Z',
          scansCount: 0,
          size: '0 KB',
          status: 'failed'
        }
      ];

      // Combinar reportes reales con ejemplos si es necesario
      const allReports = [...convertedReports, ...mockReports];

      await new Promise(resolve => setTimeout(resolve, 300)); // Breve latencia
      setReports(allReports);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por formato
    if (selectedFormat !== 'all') {
      filtered = filtered.filter(report => report.format === selectedFormat);
    }

    // Filtrar por estado
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(report => report.status === selectedStatus);
    }

    setFilteredReports(filtered);
  };

  const handleDownload = (report: Report) => {
    if (report.status === 'completed') {
      console.log('Descargando reporte:', report.title);
      
      // Generar contenido del reporte según el formato
      let content: string;
      let mimeType: string;
      let filename: string;

      const reportData = {
        title: report.title,
        description: report.description,
        createdAt: report.createdAt,
        scansCount: report.scansCount,
        summary: {
          totalScans: report.scansCount,
          successfulScans: report.scansCount - 1,
          failedScans: 1,
          riskFindings: { high: 2, medium: 8, low: 15 }
        },
        scans: [
          {
            tool: 'Whois Lookup',
            target: 'example.com',
            status: 'completed',
            findings: { registrar: 'GoDaddy.com, LLC', expirationDate: '2026-03-15' }
          },
          {
            tool: 'Instagram Recon',
            target: 'testuser123',
            status: 'completed',
            findings: { followers: 1250, following: 350, posts: 89 }
          }
        ]
      };

      switch (report.format) {
        case 'json':
          content = JSON.stringify(reportData, null, 2);
          mimeType = 'application/json';
          filename = `${report.title.replace(/\s+/g, '_')}.json`;
          break;
        case 'csv':
          content = 'Tool,Target,Status,Findings\n' + 
            reportData.scans.map(scan => 
              `"${scan.tool}","${scan.target}","${scan.status}","${JSON.stringify(scan.findings)}"`
            ).join('\n');
          mimeType = 'text/csv';
          filename = `${report.title.replace(/\s+/g, '_')}.csv`;
          break;
        case 'html':
          content = `
            <html>
              <head><title>${report.title}</title></head>
              <body>
                <h1>${report.title}</h1>
                <p>${report.description}</p>
                <h2>Resumen</h2>
                <ul>
                  <li>Total Scans: ${reportData.summary.totalScans}</li>
                  <li>Exitosos: ${reportData.summary.successfulScans}</li>
                  <li>Fallidos: ${reportData.summary.failedScans}</li>
                </ul>
                <h2>Resultados</h2>
                ${reportData.scans.map(scan => `
                  <div>
                    <h3>${scan.tool} - ${scan.target}</h3>
                    <pre>${JSON.stringify(scan.findings, null, 2)}</pre>
                  </div>
                `).join('')}
              </body>
            </html>
          `;
          mimeType = 'text/html';
          filename = `${report.title.replace(/\s+/g, '_')}.html`;
          break;
        case 'pdf':
          // Para PDF, generamos un texto que simula el contenido
          content = `REPORTE OSINT: ${report.title}\n\n${report.description}\n\nFecha: ${new Date(report.createdAt).toLocaleString()}\n\nRESUMEN:\n- Total Scans: ${reportData.summary.totalScans}\n- Exitosos: ${reportData.summary.successfulScans}\n- Fallidos: ${reportData.summary.failedScans}\n\nRESULTADOS:\n${reportData.scans.map(scan => `\n${scan.tool} - ${scan.target}:\n${JSON.stringify(scan.findings, null, 2)}`).join('\n')}`;
          mimeType = 'text/plain';
          filename = `${report.title.replace(/\s+/g, '_')}.txt`;
          break;
        default:
          content = JSON.stringify(reportData, null, 2);
          mimeType = 'application/json';
          filename = `${report.title.replace(/\s+/g, '_')}.json`;
      }

      // Crear y descargar el archivo
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedReport(null);
  };

  const handleDelete = (reportId: string) => {
    // Eliminar del generador si es un reporte real
    reportGenerator.deleteReport(reportId);
    
    // Actualizar la lista local
    setReports(reports.filter(r => r.id !== reportId));
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando reportes...</p>
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
            Error al Cargar Reportes
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchReports}>Reintentar</Button>
        </div>
      </div>
    );
  }

  const formats = ['all', ...new Set(reports.map(r => r.format))];
  const statuses = ['all', ...new Set(reports.map(r => r.status))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 mt-1">
            Los reportes se generan automáticamente después de ejecutar herramientas OSINT
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-8 space-y-4">
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar reportes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>

        {/* Filtros de formato y estado */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filtrar por:</span>
          </div>

          {/* Formatos */}
          <div className="flex flex-wrap gap-2">
            {formats.map((format) => (
              <Button
                key={format}
                variant={selectedFormat === format ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFormat(format)}
                className="flex items-center space-x-1"
              >
                {format !== 'all' && (
                  <div className={`w-2 h-2 rounded-full ${
                    format === 'pdf' ? 'bg-red-500' :
                    format === 'json' ? 'bg-blue-500' :
                    format === 'csv' ? 'bg-green-500' : 'bg-purple-500'
                  }`} />
                )}
                <span className="capitalize">{format === 'all' ? 'Todos' : format.toUpperCase()}</span>
              </Button>
            ))}
          </div>

          {/* Estados */}
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus(status)}
                className="flex items-center space-x-1"
              >
                {status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                {status === 'generating' && <Clock className="w-3 h-3" />}
                {status === 'failed' && <AlertCircle className="w-3 h-3" />}
                <span className="capitalize">
                  {status === 'all' ? 'Todos' :
                   status === 'completed' ? 'Completados' :
                   status === 'generating' ? 'Generando' : 'Fallidos'}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {filteredReports.length} reportes encontrados
        </p>
      </div>

      {/* Lista de reportes */}
      <div className="space-y-4">
        {filteredReports.map((report) => {
          const FormatIcon = formatIcons[report.format];
          
          return (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Icono del formato */}
                    <div className={`p-3 rounded-lg ${formatColors[report.format]}`}>
                      <FormatIcon className="w-6 h-6" />
                    </div>

                    {/* Información del reporte */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {report.title}
                        </h3>
                        <Badge className={statusColors[report.status]}>
                          {report.status === 'completed' ? 'Completado' :
                           report.status === 'generating' ? 'Generando' : 'Fallido'}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{report.description}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                        </span>
                        <span>{report.scansCount} scans</span>
                        <span>{report.size}</span>
                        <Badge variant="outline" className="text-xs">
                          {report.format.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center space-x-2">
                    {report.status === 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(report)}
                          className="flex items-center space-x-1"
                        >
                          <Download className="w-4 h-4" />
                          <span>Descargar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReport(report)}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Ver</span>
                        </Button>
                      </>
                    )}
                    
                    {report.status === 'generating' && (
                      <div className="flex items-center space-x-2 text-yellow-600">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Generando...</span>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(report.id)}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mensaje cuando no hay resultados */}
      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron reportes
          </h3>
          <p className="text-gray-600 mb-4">
            Intenta ajustar tus filtros o ejecuta herramientas OSINT para generar reportes automáticamente
          </p>
        </div>
      )}

      {/* Modal de visualización */}
      {selectedReport && (
        <ReportViewerModal
          report={selectedReport}
          isOpen={isViewerOpen}
          onClose={handleCloseViewer}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}