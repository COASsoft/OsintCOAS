export interface OSINTTool {
  id: string;
  name: string;
  description: string;
  flag: string;
  category: 'network' | 'domain' | 'social' | 'file' | 'misc';
  requiredParams: string[];
  optionalParams?: string[];
  outputFormat: 'text' | 'json' | 'table';
  estimatedTime: number;
  riskLevel: 'low' | 'medium' | 'high';
  placeholder?: string;
  helpText?: string;
}

export interface OSINTScan {
  id: string;
  tool: string;
  target: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  results?: any;
  error?: string;
  outputFile?: string;
}

export interface OSINTStats {
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  averageTime: number;
  activeScans?: number;
  toolUsage: Record<string, number>;
  topTools: Array<{ tool: string; count: number }>;
  recentActivity: Array<{
    id: string;
    tool: string;
    target: string;
    status: string;
    timestamp: string;
    duration: number;
  }>;
}

export interface ScanRequest {
  tool: string;
  target: string;
  options?: Record<string, any>;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ReportConfig {
  scanIds: string[];
  format: 'pdf' | 'json' | 'csv' | 'excel';
  includeCharts: boolean;
  includeRawData: boolean;
  title?: string;
  description?: string;
}