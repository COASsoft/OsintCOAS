import { APIResponse, OSINTTool, OSINTScan, OSINTStats, ScanRequest } from '@/types/osint';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class APIClient {
  private async fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<APIResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data: data.success ? data : data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión',
      };
    }
  }

  // OSINT Tools
  async getTools(): Promise<APIResponse<{ tools: OSINTTool[]; count: number }>> {
    return this.fetchAPI('/osint/tools');
  }

  async getTool(toolId: string): Promise<APIResponse<{ tool: OSINTTool }>> {
    return this.fetchAPI(`/osint/tools/${toolId}`);
  }

  async startScan(request: ScanRequest): Promise<APIResponse<{ scanId: string; estimatedTime: number }>> {
    return this.fetchAPI('/osint/scan', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getScan(scanId: string): Promise<APIResponse<{ scan: OSINTScan }>> {
    return this.fetchAPI(`/osint/scan/${scanId}`);
  }

  async cancelScan(scanId: string): Promise<APIResponse<{ message: string }>> {
    return this.fetchAPI(`/osint/scan/${scanId}`, {
      method: 'DELETE',
    });
  }

  async getScanHistory(page = 1, limit = 10, tool?: string): Promise<APIResponse<{
    scans: OSINTScan[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (tool) {
      params.append('tool', tool);
    }

    return this.fetchAPI(`/osint/history?${params}`);
  }

  // Statistics
  async getOverviewStats(): Promise<APIResponse<{ stats: OSINTStats }>> {
    return this.fetchAPI('/stats/overview');
  }

  async getToolStats(): Promise<APIResponse<{
    toolStats: {
      mostUsed: Array<{ tool: string; count: number; successRate: number }>;
      averageTimes: Record<string, number>;
      riskLevels: Record<string, number>;
    };
  }>> {
    return this.fetchAPI('/stats/tools');
  }

  async getTimelineStats(days = 7): Promise<APIResponse<{
    timeline: Array<{
      date: string;
      scans: number;
      successful: number;
      failed: number;
      averageTime: number;
    }>;
    period: string;
  }>> {
    return this.fetchAPI(`/stats/timeline?days=${days}`);
  }

  async getRealtimeStats(): Promise<APIResponse<{
    stats: {
      activeScans: number;
      queuedScans: number;
      serverLoad: {
        cpu: number;
        memory: number;
        disk: number;
      };
      performance: {
        responseTime: number;
        throughput: number;
        errorRate: number;
      };
      lastUpdate: string;
    };
  }>> {
    return this.fetchAPI('/stats/realtime');
  }

  async getTopTargets(): Promise<APIResponse<{
    targets: Array<{
      target: string;
      scans: number;
      lastScan: Date;
    }>;
  }>> {
    return this.fetchAPI('/stats/targets');
  }

  // Reports
  async generateReport(config: {
    scanIds: string[];
    format: string;
    includeCharts?: boolean;
    includeRawData?: boolean;
    title?: string;
    description?: string;
  }): Promise<APIResponse<{
    reportId: string;
    format: string;
    downloadUrl: string;
    report?: any;
  }>> {
    return this.fetchAPI('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getReports(): Promise<APIResponse<{
    reports: Array<{
      id: string;
      title: string;
      createdAt: string;
      format: string;
      scansCount: number;
    }>;
  }>> {
    return this.fetchAPI('/reports/list');
  }

  // Health Check
  async healthCheck(): Promise<APIResponse<{
    status: string;
    timestamp: string;
    uptime: number;
    memory: any;
    version: string;
  }>> {
    return this.fetchAPI('/health');
  }
}

export const apiClient = new APIClient();
export default apiClient;