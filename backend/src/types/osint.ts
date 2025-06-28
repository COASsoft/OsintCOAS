export interface OSINTTool {
  id: string;
  name: string;
  description: string;
  flag: string;
  category: 'network' | 'domain' | 'social' | 'file' | 'misc';
  requiredParams: string[];
  optionalParams?: string[];
  outputFormat: 'text' | 'json' | 'table';
  estimatedTime: number; // in seconds
  riskLevel: 'low' | 'medium' | 'high';
  risk?: 'low' | 'medium' | 'high'; // Alias para compatibilidad
}

export interface OSINTRequest {
  tool: string;
  target: string;
  options?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface OSINTResponse {
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
  toolUsage: Record<string, number>;
  recentActivity: OSINTResponse[];
}

export interface ReportRequest {
  scanIds: string[];
  format: 'pdf' | 'json' | 'csv' | 'excel';
  includeCharts: boolean;
  includeRawData: boolean;
  title?: string;
  description?: string;
}

// Herramientas OSINT disponibles
export const OSINT_TOOLS: OSINTTool[] = [
  {
    id: 'whois',
    name: 'Whois Lookup',
    description: 'Obtener información de registro de dominios',
    flag: '-w',
    category: 'domain',
    requiredParams: ['domain'],
    outputFormat: 'text',
    estimatedTime: 5,
    riskLevel: 'low'
  },
  {
    id: 'ip-lookup',
    name: 'IP Lookup',
    description: 'Geolocalización y información de direcciones IP',
    flag: '-p',
    category: 'network',
    requiredParams: ['ip'],
    outputFormat: 'text',
    estimatedTime: 3,
    riskLevel: 'low'
  },
  {
    id: 'dns-lookup',
    name: 'DNS Lookup',
    description: 'Consulta de registros DNS completos',
    flag: '-n',
    category: 'network',
    requiredParams: ['domain'],
    outputFormat: 'text',
    estimatedTime: 4,
    riskLevel: 'low'
  },
  {
    id: 'domain-age',
    name: 'Domain Age',
    description: 'Verificar la antigüedad de un dominio',
    flag: '-d',
    category: 'domain',
    requiredParams: ['domain'],
    outputFormat: 'text',
    estimatedTime: 3,
    riskLevel: 'low'
  },
  {
    id: 'header-info',
    name: 'Header Information',
    description: 'Análisis de headers HTTP del sitio web',
    flag: '-e',
    category: 'network',
    requiredParams: ['url'],
    outputFormat: 'text',
    estimatedTime: 5,
    riskLevel: 'low'
  },
  {
    id: 'subdomain-scanner',
    name: 'Subdomain Scanner',
    description: 'Enumeración de subdominios',
    flag: '-s',
    category: 'domain',
    requiredParams: ['domain'],
    outputFormat: 'text',
    estimatedTime: 30,
    riskLevel: 'medium'
  },
  {
    id: 'port-scanner',
    name: 'Port Scanner',
    description: 'Escaneo de puertos abiertos',
    flag: '-t',
    category: 'network',
    requiredParams: ['target'],
    outputFormat: 'text',
    estimatedTime: 60,
    riskLevel: 'high'
  },
  {
    id: 'user-recon',
    name: 'User Reconnaissance',
    description: 'Búsqueda de usuario en múltiples plataformas',
    flag: '-r',
    category: 'social',
    requiredParams: ['username'],
    outputFormat: 'text',
    estimatedTime: 20,
    riskLevel: 'medium'
  },
  {
    id: 'mail-finder',
    name: 'Email Finder',
    description: 'Búsqueda de direcciones de correo',
    flag: '-m',
    category: 'social',
    requiredParams: ['domain'],
    outputFormat: 'text',
    estimatedTime: 15,
    riskLevel: 'medium'
  },
  {
    id: 'url-scanner',
    name: 'URL Scanner',
    description: 'Análisis de URLs sospechosas',
    flag: '-a',
    category: 'network',
    requiredParams: ['url'],
    outputFormat: 'text',
    estimatedTime: 10,
    riskLevel: 'low'
  },
  {
    id: 'exif-metadata',
    name: 'EXIF Metadata',
    description: 'Extracción de metadatos de imágenes',
    flag: '-x',
    category: 'file',
    requiredParams: ['file'],
    outputFormat: 'text',
    estimatedTime: 2,
    riskLevel: 'low'
  },
  {
    id: 'useragent-lookup',
    name: 'User Agent Lookup',
    description: 'Identificación de navegadores y dispositivos',
    flag: '-u',
    category: 'misc',
    requiredParams: ['useragent'],
    outputFormat: 'text',
    estimatedTime: 1,
    riskLevel: 'low'
  },
  {
    id: 'git-recon',
    name: 'Git Reconnaissance',
    description: 'Reconocimiento de repositorios GitHub',
    flag: '-g',
    category: 'social',
    requiredParams: ['username'],
    outputFormat: 'text',
    estimatedTime: 10,
    riskLevel: 'low'
  },
  {
    id: 'url-expander',
    name: 'URL Expander',
    description: 'Expansión de URLs acortadas',
    flag: '-l',
    category: 'network',
    requiredParams: ['shorturl'],
    outputFormat: 'text',
    estimatedTime: 3,
    riskLevel: 'low'
  },
  {
    id: 'youtube-lookup',
    name: 'YouTube Lookup',
    description: 'Metadatos de videos de YouTube',
    flag: '-y',
    category: 'social',
    requiredParams: ['video_id'],
    outputFormat: 'text',
    estimatedTime: 5,
    riskLevel: 'low'
  },
  {
    id: 'instagram-recon',
    name: 'Instagram Reconnaissance',
    description: 'Información de perfiles de Instagram',
    flag: '-i',
    category: 'social',
    requiredParams: ['username'],
    outputFormat: 'text',
    estimatedTime: 8,
    riskLevel: 'medium'
  }
];