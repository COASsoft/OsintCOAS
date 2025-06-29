// Sistema de generación automática de reportes
import { scanStorage, StoredScan } from './scan-storage';

interface AutoReport {
  id: string;
  title: string;
  description: string;
  format: 'pdf' | 'json' | 'csv' | 'html';
  createdAt: string;
  scansCount: number;
  size: string;
  status: 'completed' | 'generating' | 'failed';
  downloadUrl?: string;
  scanIds: string[];
  toolNames: string[];
}

class ReportGenerator {
  private reports: AutoReport[] = [];

  constructor() {
    this.loadReports();
  }

  // Generar reporte automáticamente después de ejecutar una herramienta
  generateAutoReport(scan: StoredScan): AutoReport {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const report: AutoReport = {
      id: reportId,
      title: `${scan.toolName} - ${scan.target}`,
      description: `Análisis automático usando ${scan.toolName} en objetivo: ${scan.target}`,
      format: 'json',
      createdAt: new Date().toISOString(),
      scansCount: 1,
      size: this.calculateSize(scan),
      status: scan.status === 'completed' ? 'completed' : 'failed',
      scanIds: [scan.id],
      toolNames: [scan.toolName]
    };

    this.reports.push(report);
    this.saveReports();
    
    return report;
  }

  // Generar reporte consolidado de múltiples scans
  generateConsolidatedReport(scans: StoredScan[], title?: string): AutoReport {
    const reportId = `consolidated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const uniqueTools = [...new Set(scans.map(s => s.toolName))];
    const uniqueTargets = [...new Set(scans.map(s => s.target))];
    
    const report: AutoReport = {
      id: reportId,
      title: title || `Análisis Consolidado - ${uniqueTargets.length} objetivos`,
      description: `Reporte consolidado con ${scans.length} scans usando ${uniqueTools.length} herramientas diferentes`,
      format: 'json',
      createdAt: new Date().toISOString(),
      scansCount: scans.length,
      size: this.calculateConsolidatedSize(scans),
      status: 'completed',
      scanIds: scans.map(s => s.id),
      toolNames: uniqueTools
    };

    this.reports.push(report);
    this.saveReports();
    
    return report;
  }

  // Obtener todos los reportes
  getReports(): AutoReport[] {
    return this.reports.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Obtener reporte por ID
  getReportById(id: string): AutoReport | undefined {
    return this.reports.find(r => r.id === id);
  }

  // Eliminar reporte
  deleteReport(id: string): boolean {
    const index = this.reports.findIndex(r => r.id === id);
    if (index !== -1) {
      this.reports.splice(index, 1);
      this.saveReports();
      return true;
    }
    return false;
  }

  // Obtener datos completos del reporte (scans asociados)
  getReportData(reportId: string) {
    const report = this.getReportById(reportId);
    if (!report) return null;

    const allScans = scanStorage.loadScans();
    const reportScans = allScans.filter(scan => 
      report.scanIds.includes(scan.id)
    );

    return {
      report,
      scans: reportScans,
      summary: {
        totalScans: reportScans.length,
        successfulScans: reportScans.filter(s => s.status === 'completed').length,
        failedScans: reportScans.filter(s => s.status === 'failed').length,
        totalTargets: new Set(reportScans.map(s => s.target)).size,
        toolsUsed: report.toolNames,
        avgDuration: reportScans.length > 0 
          ? reportScans.reduce((sum, s) => sum + s.duration, 0) / reportScans.length 
          : 0
      }
    };
  }

  // Generar reportes diarios automáticamente
  generateDailyReport(): AutoReport | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allScans = scanStorage.loadScans();
    const todayScans = allScans.filter(scan => {
      const scanDate = new Date(scan.endTime);
      scanDate.setHours(0, 0, 0, 0);
      return scanDate.getTime() === today.getTime();
    });

    if (todayScans.length === 0) return null;

    return this.generateConsolidatedReport(
      todayScans, 
      `Reporte Diario - ${today.toLocaleDateString()}`
    );
  }

  // Generar reportes semanales automáticamente
  generateWeeklyReport(): AutoReport | null {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    const allScans = scanStorage.loadScans();
    const weekScans = allScans.filter(scan => {
      const scanDate = new Date(scan.endTime);
      return scanDate >= startDate && scanDate <= endDate;
    });

    if (weekScans.length === 0) return null;

    return this.generateConsolidatedReport(
      weekScans, 
      `Reporte Semanal - ${startDate.toLocaleDateString()} a ${endDate.toLocaleDateString()}`
    );
  }

  // Calcular tamaño estimado del reporte
  private calculateSize(scan: StoredScan): string {
    const baseSize = 2048; // 2KB base
    const resultSize = scan.result ? JSON.stringify(scan.result).length : 0;
    const totalBytes = baseSize + resultSize;
    
    if (totalBytes < 1024) return `${totalBytes} B`;
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private calculateConsolidatedSize(scans: StoredScan[]): string {
    const totalSize = scans.reduce((sum, scan) => {
      const scanSize = 2048 + (scan.result ? JSON.stringify(scan.result).length : 0);
      return sum + scanSize;
    }, 0);
    
    if (totalSize < 1024) return `${totalSize} B`;
    if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(1)} KB`;
    return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Persistencia en localStorage
  private saveReports() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('osint_reports', JSON.stringify(this.reports));
      
      // Disparar evento personalizado para notificar cambios en reportes
      const event = new CustomEvent('reportDataUpdated', { 
        detail: { totalReports: this.reports.length } 
      });
      window.dispatchEvent(event);
      console.log('🔔 Evento reportDataUpdated disparado, total reportes:', this.reports.length);
    }
  }

  private loadReports() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('osint_reports');
      if (stored) {
        this.reports = JSON.parse(stored);
      }
    }
  }

  // Limpiar reportes antiguos
  cleanOldReports(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    this.reports = this.reports.filter(report => 
      new Date(report.createdAt) > cutoffDate
    );
    
    this.saveReports();
  }
}

export const reportGenerator = new ReportGenerator();
export type { AutoReport };