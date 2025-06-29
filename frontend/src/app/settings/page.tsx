'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon,
  Shield,
  Globe,
  Clock,
  Bell,
  Download,
  Upload,
  RefreshCw,
  Save,
  AlertCircle,
  CheckCircle2,
  Info,
  Database,
  Server,
  Key,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

interface SettingsData {
  general: {
    apiUrl: string;
    timeout: number;
    maxConcurrent: number;
    retryAttempts: number;
  };
  security: {
    enableRateLimit: boolean;
    maxRequestsPerMinute: number;
    enableLogging: boolean;
    logLevel: string;
  };
  notifications: {
    emailNotifications: boolean;
    scanComplete: boolean;
    scanFailed: boolean;
    weeklyReport: boolean;
  };
  export: {
    defaultFormat: string;
    includeMetadata: boolean;
    compressReports: boolean;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulamos configuraciones
      const mockSettings: SettingsData = {
        general: {
          apiUrl: 'http://localhost:3001/api',
          timeout: 30,
          maxConcurrent: 5,
          retryAttempts: 3
        },
        security: {
          enableRateLimit: true,
          maxRequestsPerMinute: 60,
          enableLogging: true,
          logLevel: 'info'
        },
        notifications: {
          emailNotifications: false,
          scanComplete: true,
          scanFailed: true,
          weeklyReport: false
        },
        export: {
          defaultFormat: 'json',
          includeMetadata: true,
          compressReports: false
        }
      };

      await new Promise(resolve => setTimeout(resolve, 500));
      setSettings(mockSettings);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (err) {
      setError('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchSettings();
  };

  const handleExportConfig = () => {
    const config = JSON.stringify(settings, null, 2);
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'infoooze-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const config = JSON.parse(e.target?.result as string);
            setSettings(config);
          } catch (err) {
            setError('Error al importar configuración: formato inválido');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando configuración...</p>
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
            Error al Cargar Configuración
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchSettings}>Reintentar</Button>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600 mt-1">
            Administre las configuraciones de la plataforma OSINT
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {savedMessage && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Configuración guardada</span>
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Guardando...' : 'Guardar'}</span>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Configuración General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5" />
              <span>Configuración General</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de la API
                </label>
                <Input
                  value={settings.general.apiUrl}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, apiUrl: e.target.value }
                  })}
                  placeholder="http://localhost:3001/api"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeout (segundos)
                </label>
                <Input
                  type="number"
                  value={settings.general.timeout}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, timeout: parseInt(e.target.value) }
                  })}
                  min="1"
                  max="300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Scans Concurrentes
                </label>
                <Input
                  type="number"
                  value={settings.general.maxConcurrent}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, maxConcurrent: parseInt(e.target.value) }
                  })}
                  min="1"
                  max="20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Intentos de Reintento
                </label>
                <Input
                  type="number"
                  value={settings.general.retryAttempts}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, retryAttempts: parseInt(e.target.value) }
                  })}
                  min="0"
                  max="10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Seguridad</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Rate Limiting</h4>
                <p className="text-sm text-gray-600">Limitar el número de requests por minuto</p>
              </div>
              <input
                type="checkbox"
                checked={settings.security.enableRateLimit}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, enableRateLimit: e.target.checked }
                })}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>

            {settings.security.enableRateLimit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requests por Minuto
                </label>
                <Input
                  type="number"
                  value={settings.security.maxRequestsPerMinute}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: { ...settings.security, maxRequestsPerMinute: parseInt(e.target.value) }
                  })}
                  min="1"
                  max="1000"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Logging</h4>
                <p className="text-sm text-gray-600">Habilitar registro de actividad</p>
              </div>
              <input
                type="checkbox"
                checked={settings.security.enableLogging}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, enableLogging: e.target.checked }
                })}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>

            {settings.security.enableLogging && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel de Log
                </label>
                <select
                  value={settings.security.logLevel}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: { ...settings.security, logLevel: e.target.value }
                  })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">API Key</h4>
              <div className="flex items-center space-x-2">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value="sk-infoooze-1234567890abcdef"
                  readOnly
                  className="bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notificaciones</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Notificaciones por Email</h4>
                <p className="text-sm text-gray-600">Recibir notificaciones por correo electrónico</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.emailNotifications}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, emailNotifications: e.target.checked }
                })}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Scan Completado</h4>
                <p className="text-sm text-gray-600">Notificar cuando un scan termine exitosamente</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.scanComplete}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, scanComplete: e.target.checked }
                })}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Scan Fallido</h4>
                <p className="text-sm text-gray-600">Notificar cuando un scan falle</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.scanFailed}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, scanFailed: e.target.checked }
                })}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Reporte Semanal</h4>
                <p className="text-sm text-gray-600">Recibir resumen semanal de actividad</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.weeklyReport}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, weeklyReport: e.target.checked }
                })}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>
          </CardContent>
        </Card>

        {/* Exportación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Exportación</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Formato por Defecto
              </label>
              <select
                value={settings.export.defaultFormat}
                onChange={(e) => setSettings({
                  ...settings,
                  export: { ...settings.export, defaultFormat: e.target.value }
                })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
                <option value="html">HTML</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Incluir Metadatos</h4>
                <p className="text-sm text-gray-600">Incluir información adicional en reportes</p>
              </div>
              <input
                type="checkbox"
                checked={settings.export.includeMetadata}
                onChange={(e) => setSettings({
                  ...settings,
                  export: { ...settings.export, includeMetadata: e.target.checked }
                })}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Comprimir Reportes</h4>
                <p className="text-sm text-gray-600">Comprimir archivos de exportación</p>
              </div>
              <input
                type="checkbox"
                checked={settings.export.compressReports}
                onChange={(e) => setSettings({
                  ...settings,
                  export: { ...settings.export, compressReports: e.target.checked }
                })}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>
          </CardContent>
        </Card>

        {/* Gestión de Configuración */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Gestión de Configuración</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleExportConfig}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Config</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={handleImportConfig}
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Importar Config</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Restaurar</span>
              </Button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Información</p>
                  <p>Los cambios se aplicarán después de guardar. Algunas configuraciones requieren reiniciar el servicio.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-6">
          <Button variant="outline" onClick={handleReset}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}