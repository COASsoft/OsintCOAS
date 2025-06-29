// Sistema de almacenamiento de scans para reportes
interface StoredScan {
  id: string;
  toolId: string;
  toolName: string;
  target: string;
  parameters: Record<string, string>;
  result: any;
  status: 'completed' | 'failed';
  startTime: Date;
  endTime: Date;
  duration: number;
  error?: string;
}

class ScanStorage {
  private scans: StoredScan[] = [];
  
  constructor() {
    // Cargar scans existentes al inicializar
    this.loadScans();
  }

  // Guardar un scan completado
  saveScan(scan: StoredScan) {
    this.scans.push(scan);
    
    // Mantener solo los últimos 100 scans
    if (this.scans.length > 100) {
      this.scans = this.scans.slice(-100);
    }
    
    // Guardar en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('osint_scans', JSON.stringify(this.scans));
      
      // Disparar evento personalizado para notificar cambios
      const event = new CustomEvent('scanDataUpdated', { 
        detail: { scan, totalScans: this.scans.length } 
      });
      window.dispatchEvent(event);
      console.log('🔔 Evento scanDataUpdated disparado para scan:', scan.id);
    }
  }

  // Cargar scans del localStorage
  loadScans(): StoredScan[] {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('osint_scans');
      if (stored) {
        const parsedScans = JSON.parse(stored);
        // Convertir strings de fecha de vuelta a objetos Date
        this.scans = parsedScans.map((scan: any) => ({
          ...scan,
          startTime: new Date(scan.startTime),
          endTime: new Date(scan.endTime)
        }));
      }
    }
    return this.scans;
  }

  // Obtener scans recientes
  getRecentScans(limit: number = 10): StoredScan[] {
    return this.scans
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
      .slice(0, limit);
  }

  // Obtener scans por herramienta
  getScansByTool(toolId: string): StoredScan[] {
    return this.scans.filter(scan => scan.toolId === toolId);
  }

  // Obtener scans por rango de fechas
  getScansByDateRange(startDate: Date, endDate: Date): StoredScan[] {
    return this.scans.filter(scan => {
      const scanDate = new Date(scan.endTime);
      return scanDate >= startDate && scanDate <= endDate;
    });
  }

  // Generar estadísticas
  getStats() {
    const totalScans = this.scans.length;
    const successfulScans = this.scans.filter(s => s.status === 'completed').length;
    const failedScans = this.scans.filter(s => s.status === 'failed').length;
    
    const toolUsage = this.scans.reduce((acc, scan) => {
      acc[scan.toolName] = (acc[scan.toolName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgDuration = this.scans.length > 0 
      ? this.scans.reduce((sum, scan) => sum + scan.duration, 0) / this.scans.length
      : 0;

    return {
      totalScans,
      successfulScans,
      failedScans,
      successRate: totalScans > 0 ? (successfulScans / totalScans) * 100 : 0,
      toolUsage,
      avgDuration
    };
  }

  // Limpiar scans antiguos
  clearOldScans(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    this.scans = this.scans.filter(scan => new Date(scan.endTime) > cutoffDate);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('osint_scans', JSON.stringify(this.scans));
    }
  }
}

export const scanStorage = new ScanStorage();
export type { StoredScan };