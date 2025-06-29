'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X,
  Download,
  Calendar,
  FileText,
  Shield,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Copy
} from 'lucide-react';
import { scanStorage } from '@/lib/scan-storage';
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
  data?: any;
}

interface ReportViewerModalProps {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (report: Report) => void;
}

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

export default function ReportViewerModal({ report, isOpen, onClose, onDownload }: ReportViewerModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'data' | 'raw'>('overview');
  const [realScans, setRealScans] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && report) {
      // Solo resetear tab activo cuando se abre el modal por primera vez
      setActiveTab('overview');
      
      // Cargar scans específicos del reporte
      const reportData = reportGenerator.getReportData(report.id);
      if (reportData && reportData.scans.length > 0) {
        setRealScans(reportData.scans);
      } else {
        // Fallback: usar últimos scans
        const scans = scanStorage.loadScans();
        const recentScans = scans.slice(-1); // Solo el último scan
        setRealScans(recentScans);
      }
    }
  }, [isOpen]); // Solo depender de isOpen para evitar reseteos

  if (!isOpen) return null;

  // Usar datos reales si están disponibles
  const actualScans = realScans.length > 0 ? realScans.map(scan => ({
    id: scan.id,
    tool: scan.toolName,
    target: scan.target,
    status: scan.status,
    timestamp: scan.endTime,
    duration: scan.duration,
    findings: scan.result,
    error: scan.error
  })) : [];

  // Calcular métricas reales basadas en los datos
  const calculateRiskFindings = (scans: any[]) => {
    let high = 0, medium = 0, low = 0;
    
    scans.forEach(scan => {
      if (scan.status === 'completed' && scan.result) {
        // Analizar result (no findings) para determinar riesgos
        const resultStr = JSON.stringify(scan.result).toLowerCase();
        
        // Alto riesgo: puertos críticos abiertos, vulnerabilidades, privacidad
        if (resultStr.includes('vulnerable') || resultStr.includes('cve-') || 
            resultStr.includes('port": 22') || resultStr.includes('port": 3306') ||
            resultStr.includes('breach') || resultStr.includes('leaked') ||
            resultStr.includes('breached": true')) {
          high++;
        }
        
        // Medio riesgo: información sensible expuesta
        if (resultStr.includes('email') || resultStr.includes('phone') || 
            resultStr.includes('address') || resultStr.includes('isprivate": false') ||
            resultStr.includes('followers') || resultStr.includes('connections')) {
          medium++;
        }
        
        // Bajo riesgo: información pública general
        if (resultStr.includes('public') || resultStr.includes('profile') || 
            resultStr.includes('domain') || resultStr.includes('nameservers') ||
            resultStr.includes('registrar')) {
          low++;
        }
      }
    });
    
    return { high, medium, low };
  };
  
  const riskFindings = calculateRiskFindings(realScans);
  
  const reportData = {
    summary: {
      totalScans: report.scansCount,
      successfulScans: realScans.filter(s => s.status === 'completed').length,
      failedScans: realScans.filter(s => s.status === 'failed').length,
      totalTargets: new Set(realScans.map(s => s.target)).size || 1,
      riskFindings
    },
    scans: actualScans.length > 0 ? actualScans : [
      {
        id: 'scan_001',
        tool: 'Whois Lookup',
        target: 'example.com',
        status: 'completed',
        timestamp: '2025-06-25T10:30:00Z',
        duration: 3.2,
        findings: {
          registrar: 'GoDaddy.com, LLC',
          registrationDate: '2010-03-15T00:00:00Z',
          expirationDate: '2026-03-15T00:00:00Z',
          nameServers: ['ns1.godaddy.com', 'ns2.godaddy.com'],
          status: 'clientTransferProhibited'
        }
      },
      {
        id: 'scan_002',
        tool: 'IP Lookup',
        target: '192.168.1.1',
        status: 'completed',
        timestamp: '2025-06-25T10:32:00Z',
        duration: 2.8,
        findings: {
          country: 'United States',
          region: 'California',
          city: 'San Francisco',
          isp: 'Cloudflare, Inc.',
          organization: 'Cloudflare',
          asn: 'AS13335',
          coordinates: { lat: 37.7749, lng: -122.4194 }
        }
      },
      {
        id: 'scan_003',
        tool: 'DNS Lookup',
        target: 'example.com',
        status: 'completed',
        timestamp: '2025-06-25T10:34:00Z',
        duration: 4.1,
        findings: {
          records: {
            A: ['192.168.1.1', '192.168.1.2'],
            AAAA: ['2001:db8::1'],
            MX: ['10 mail.example.com'],
            TXT: ['v=spf1 include:_spf.google.com ~all'],
            NS: ['ns1.example.com', 'ns2.example.com']
          }
        }
      },
      {
        id: 'scan_004',
        tool: 'Instagram Reconnaissance',
        target: 'testuser123',
        status: 'completed',
        timestamp: '2025-06-25T10:36:00Z',
        duration: 8.5,
        findings: {
          profile: {
            username: 'testuser123',
            displayName: 'Test User',
            isPrivate: false,
            followers: 1250,
            following: 350,
            posts: 89,
            verified: false,
            bio: 'Digital marketing enthusiast 📱',
            website: 'https://testuser.example.com'
          },
          recentPosts: [
            {
              id: 'post_001',
              timestamp: '2025-06-24T15:30:00Z',
              likes: 125,
              comments: 23,
              caption: 'Beautiful sunset today! #photography'
            }
          ]
        }
      },
      {
        id: 'scan_005',
        tool: 'Port Scanner',
        target: '192.168.1.1',
        status: 'failed',
        timestamp: '2025-06-25T10:38:00Z',
        duration: 0,
        error: 'Connection timeout - target may be behind firewall'
      }
    ],
    metadata: {
      generatedBy: 'COAS TEAM OSINT Platform v2.0',
      timestamp: report.createdAt,
      analyst: 'System User',
      classification: 'OSINT Analysis Report',
      tools: ['whois', 'ip-lookup', 'dns-lookup', 'instagram-recon', 'port-scanner']
    }
  };

  const renderFindingsVisual = (toolName: string, findings: any) => {
    // Instagram Reconnaissance
    if (toolName.toLowerCase().includes('instagram')) {
      return (
        <div className="space-y-6">
          {/* Profile Section */}
          {findings.profile && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4 flex items-center text-purple-800">
                <img src="https://img.icons8.com/fluent/24/000000/instagram-new.png" alt="Instagram" className="mr-2" />
                Perfil de Instagram
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Usuario</p>
                  <p className="font-bold text-xl">@{findings.profile.username}</p>
                  <p className="text-gray-700 mt-1">{findings.profile.displayName}</p>
                  {findings.profile.category && (
                    <Badge className="mt-2 bg-purple-100 text-purple-800">{findings.profile.category}</Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex justify-end space-x-2 mb-2">
                    {findings.profile.verified && <Badge className="bg-blue-500 text-white">✓ Verificado</Badge>}
                    {findings.profile.isPrivate ? <Badge variant="secondary">🔒 Privado</Badge> : <Badge className="bg-green-100 text-green-800">🌐 Público</Badge>}
                    {findings.profile.contactInfo?.businessAccount && <Badge className="bg-orange-100 text-orange-800">💼 Negocio</Badge>}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-white/60 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">{findings.profile.posts?.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Publicaciones</p>
                </div>
                <div className="text-center p-4 bg-white/60 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">{findings.profile.followers?.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Seguidores</p>
                </div>
                <div className="text-center p-4 bg-white/60 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">{findings.profile.following?.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Siguiendo</p>
                </div>
              </div>
              
              {findings.profile.bio && (
                <div className="mt-4 p-4 bg-white/40 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Biografía</p>
                  <p className="text-gray-800 whitespace-pre-line">{findings.profile.bio}</p>
                </div>
              )}
              
              {findings.profile.externalLinks && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Enlaces Externos</p>
                  <div className="flex flex-wrap gap-2">
                    {findings.profile.externalLinks.map((link: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        🔗 {link.replace('https://', '')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Recent Posts */}
          {findings.recentPosts && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4 text-blue-800">Publicaciones Recientes</h4>
              <div className="space-y-4">
                {findings.recentPosts.slice(0, 3).map((post: any, idx: number) => (
                  <div key={idx} className="bg-white/70 rounded-lg p-4 border border-blue-100">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{post.mediaType}</Badge>
                        {post.location && <span className="text-xs text-gray-500">📍 {post.location}</span>}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(post.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{post.caption}</p>
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div>
                        <p className="text-lg font-bold text-red-500">❤️ {post.likes?.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Likes</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-500">💬 {post.comments?.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Comentarios</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-500">📤 {post.shares?.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Compartir</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-purple-500">🔖 {post.saves?.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Guardados</p>
                      </div>
                    </div>
                    {post.hashtags && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {post.hashtags.map((tag: string, tagIdx: number) => (
                          <span key={tagIdx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Engagement Metrics */}
          {findings.engagement && (
            <div className="bg-green-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4 text-green-800">Análisis de Engagement</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-white/70 rounded">
                  <p className="text-xl font-bold text-green-600">{findings.engagement.avgLikes?.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Promedio Likes</p>
                </div>
                <div className="text-center p-3 bg-white/70 rounded">
                  <p className="text-xl font-bold text-green-600">{findings.engagement.avgComments?.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Promedio Comentarios</p>
                </div>
                <div className="text-center p-3 bg-white/70 rounded">
                  <p className="text-xl font-bold text-green-600">{findings.engagement.engagementRate}</p>
                  <p className="text-sm text-gray-600">Tasa Engagement</p>
                </div>
                <div className="text-center p-3 bg-white/70 rounded">
                  <p className="text-xl font-bold text-green-600">{findings.engagement.audienceGrowth}</p>
                  <p className="text-sm text-gray-600">Crecimiento</p>
                </div>
              </div>
              {findings.engagement.bestPostingTimes && (
                <div className="bg-white/50 rounded p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Mejores Horarios de Publicación</p>
                  <div className="flex gap-2">
                    {findings.engagement.bestPostingTimes.map((time: string, idx: number) => (
                      <Badge key={idx} className="bg-green-100 text-green-800">{time}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Audience Insights */}
          {findings.audienceInsights && (
            <div className="bg-orange-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4 text-orange-800">Insights de Audiencia</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium mb-2">Demografía</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>👨 Masculino</span>
                      <span className="font-medium">{findings.audienceInsights.demographics.male}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>👩 Femenino</span>
                      <span className="font-medium">{findings.audienceInsights.demographics.female}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Grupos de Edad</h5>
                  <div className="space-y-2">
                    {Object.entries(findings.audienceInsights.ageGroups).map(([age, percentage]) => (
                      <div key={age} className="flex justify-between">
                        <span>{age}</span>
                        <span className="font-medium">{percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <h5 className="font-medium mb-2">Top Ubicaciones</h5>
                <div className="flex flex-wrap gap-2">
                  {findings.audienceInsights.topLocations.map((location: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">📍 {location}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Risk Factors */}
          {findings.riskFactors && findings.riskFactors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-red-800 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Factores de Riesgo Detectados
              </h4>
              <div className="space-y-2">
                {findings.riskFactors.map((factor: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="text-red-500">⚠️</span>
                    <span className="text-red-700 text-sm">{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // GitHub Repository/User Analysis
    if (toolName.toLowerCase().includes('github') || findings.type === 'repository' || findings.type === 'user') {
      if (findings.type === 'repository') {
        return (
          <div className="space-y-6">
            {/* Repository Overview */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-6 border border-gray-200">
              <h4 className="font-semibold mb-4 flex items-center text-gray-800">
                <span className="text-2xl mr-2">📁</span>
                Análisis de Repositorio GitHub
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <img src={findings.repository.owner.avatar} alt="Avatar" className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-bold text-lg">{findings.repository.fullName}</p>
                      <p className="text-sm text-gray-600">{findings.repository.description}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-blue-100 text-blue-800">{findings.repository.info.language}</Badge>
                      <Badge variant="outline">{findings.repository.info.license}</Badge>
                      {findings.repository.info.archived && <Badge className="bg-orange-100 text-orange-800">Archivado</Badge>}
                      {findings.repository.info.isFork && <Badge className="bg-purple-100 text-purple-800">Fork</Badge>}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Creado</p>
                        <p className="font-medium">{new Date(findings.repository.info.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Último push</p>
                        <p className="font-medium">{new Date(findings.repository.info.pushedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white/70 rounded border">
                    <p className="text-2xl font-bold text-yellow-600">⭐ {findings.repository.stats.stars.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Stars</p>
                  </div>
                  <div className="text-center p-3 bg-white/70 rounded border">
                    <p className="text-2xl font-bold text-blue-600">🍴 {findings.repository.stats.forks.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Forks</p>
                  </div>
                  <div className="text-center p-3 bg-white/70 rounded border">
                    <p className="text-2xl font-bold text-green-600">👁️ {findings.repository.stats.watchers.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Watchers</p>
                  </div>
                  <div className="text-center p-3 bg-white/70 rounded border">
                    <p className="text-2xl font-bold text-red-600">🐛 {findings.repository.stats.openIssues.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Issues</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Languages */}
            {findings.languages && findings.languages.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6">
                <h4 className="font-semibold mb-4 text-purple-800">Lenguajes de Programación</h4>
                <div className="space-y-3">
                  {findings.languages.map((lang: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full bg-purple-400"></div>
                        <span className="font-medium">{lang.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{width: `${lang.percentage}%`}}></div>
                        </div>
                        <span className="text-sm font-bold">{lang.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contributors */}
            {findings.contributors && findings.contributors.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                <h4 className="font-semibold mb-4 text-green-800">Principales Colaboradores</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {findings.contributors.slice(0, 6).map((contributor: any, idx: number) => (
                    <div key={idx} className="bg-white/70 rounded-lg p-4 flex items-center space-x-3">
                      <img src={contributor.avatar} alt="Avatar" className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-semibold">{contributor.username}</p>
                        <p className="text-sm text-gray-600">{contributor.contributions} contribuciones</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Commits */}
            {findings.recentCommits && findings.recentCommits.length > 0 && (
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6">
                <h4 className="font-semibold mb-4 text-orange-800">Commits Recientes</h4>
                <div className="space-y-3">
                  {findings.recentCommits.slice(0, 5).map((commit: any, idx: number) => (
                    <div key={idx} className="bg-white/70 rounded-lg p-4 border border-orange-100">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{commit.sha}</code>
                        <span className="text-xs text-gray-500">{new Date(commit.author.date).toLocaleDateString()}</span>
                      </div>
                      <p className="font-medium text-sm mb-2">{commit.message}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <span>👤 {commit.author.name}</span>
                        <span>•</span>
                        <a href={commit.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                          Ver commit <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Forks */}
            {findings.topForks && findings.topForks.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6">
                <h4 className="font-semibold mb-4 text-blue-800">Forks Más Populares</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {findings.topForks.slice(0, 4).map((fork: any, idx: number) => (
                    <div key={idx} className="bg-white/70 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-sm">{fork.name}</p>
                        <a href={fork.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        <span>⭐ {fork.stars}</span>
                        <span>🍴 {fork.forks}</span>
                        <span>{new Date(fork.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      } else if (findings.type === 'user') {
        return (
          <div className="space-y-6">
            {/* User Profile */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-6 border border-gray-200">
              <h4 className="font-semibold mb-4 flex items-center text-gray-800">
                <span className="text-2xl mr-2">👤</span>
                Perfil de Usuario GitHub
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-4">
                  <img src={findings.profile.avatar} alt="Avatar" className="w-20 h-20 rounded-full" />
                  <div>
                    <h5 className="text-xl font-bold">{findings.profile.name || findings.profile.username}</h5>
                    <p className="text-gray-600">@{findings.profile.username}</p>
                    {findings.profile.bio && <p className="text-sm text-gray-700 mt-2">{findings.profile.bio}</p>}
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      {findings.profile.location && <span>📍 {findings.profile.location}</span>}
                      {findings.profile.company && <span>🏢 {findings.profile.company}</span>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white/70 rounded border">
                    <p className="text-2xl font-bold text-green-600">{findings.stats.publicRepos.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Repositorios</p>
                  </div>
                  <div className="text-center p-3 bg-white/70 rounded border">
                    <p className="text-2xl font-bold text-blue-600">{findings.stats.followers.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Seguidores</p>
                  </div>
                  <div className="text-center p-3 bg-white/70 rounded border">
                    <p className="text-2xl font-bold text-purple-600">{findings.stats.following.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Siguiendo</p>
                  </div>
                  <div className="text-center p-3 bg-white/70 rounded border">
                    <p className="text-2xl font-bold text-orange-600">{findings.stats.publicGists.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Gists</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Repositories */}
            {findings.topRepositories && findings.topRepositories.length > 0 && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
                <h4 className="font-semibold mb-4 text-indigo-800">Repositorios Principales</h4>
                <div className="space-y-4">
                  {findings.topRepositories.slice(0, 5).map((repo: any, idx: number) => (
                    <div key={idx} className="bg-white/70 rounded-lg p-4 border border-indigo-100">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h5 className="font-semibold">{repo.name}</h5>
                          <p className="text-sm text-gray-600">{repo.description}</p>
                        </div>
                        <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        {repo.language && <Badge className="bg-indigo-100 text-indigo-800">{repo.language}</Badge>}
                        <span className="text-gray-600">⭐ {repo.stars}</span>
                        <span className="text-gray-600">🍴 {repo.forks}</span>
                        <span className="text-gray-600">{new Date(repo.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
    }
    
    // Geographic Location Analysis
    if (toolName.toLowerCase().includes('geo') || toolName.toLowerCase().includes('tracker') || findings.location) {
      return (
        <div className="space-y-6">
          {/* Location Overview */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 border border-emerald-200">
            <h4 className="font-semibold mb-4 flex items-center text-emerald-800">
              <span className="text-2xl mr-2">🌍</span>
              Análisis de Geolocalización
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Target Analizado</p>
                    <code className="font-mono text-sm bg-white/70 p-2 rounded block">{findings.target}</code>
                  </div>
                  {findings.resolvedIP && findings.resolvedIP !== findings.target && (
                    <div>
                      <p className="text-sm text-gray-600">IP Resuelta</p>
                      <code className="font-mono text-sm bg-white/70 p-2 rounded block">{findings.resolvedIP}</code>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-emerald-100 text-emerald-800">
                      {findings.metadata?.confidence}% Confianza
                    </Badge>
                    <Badge variant="outline">{findings.metadata?.accuracy}</Badge>
                  </div>
                </div>
              </div>
              <div className="text-center">
                {findings.location?.coordinates?.latitude && findings.location?.coordinates?.longitude ? (
                  <div className="bg-white/70 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Coordenadas</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {findings.location.coordinates.latitude.toFixed(4)}, {findings.location.coordinates.longitude.toFixed(4)}
                    </p>
                    <a 
                      href={`https://www.google.com/maps?q=${findings.location.coordinates.latitude},${findings.location.coordinates.longitude}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center justify-center mt-2"
                    >
                      Ver en Google Maps <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                ) : (
                  <div className="bg-white/70 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Coordenadas no disponibles</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6">
            <h4 className="font-semibold mb-4 text-blue-800">Información de Ubicación</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white/70 rounded border">
                <p className="text-2xl font-bold text-blue-600">{findings.location?.countryName || 'Unknown'}</p>
                <p className="text-sm text-gray-600">País</p>
                {findings.location?.country && (
                  <p className="text-xs text-gray-500 mt-1">({findings.location.country})</p>
                )}
              </div>
              <div className="text-center p-3 bg-white/70 rounded border">
                <p className="text-2xl font-bold text-blue-600">{findings.location?.region || 'Unknown'}</p>
                <p className="text-sm text-gray-600">Región</p>
              </div>
              <div className="text-center p-3 bg-white/70 rounded border">
                <p className="text-2xl font-bold text-blue-600">{findings.location?.city || 'Unknown'}</p>
                <p className="text-sm text-gray-600">Ciudad</p>
              </div>
              <div className="text-center p-3 bg-white/70 rounded border">
                <p className="text-2xl font-bold text-blue-600">{findings.location?.timezone || 'Unknown'}</p>
                <p className="text-sm text-gray-600">Zona Horaria</p>
              </div>
            </div>
            {findings.location?.postal && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">Código Postal: <span className="font-medium">{findings.location.postal}</span></p>
              </div>
            )}
          </div>

          {/* Network Information */}
          {findings.network && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4 text-purple-800">Información de Red</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Proveedor de Servicios (ISP)</p>
                    <p className="font-medium">{findings.network.isp}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Organización</p>
                    <p className="font-medium">{findings.network.organization}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">ASN (Autonomous System Number)</p>
                    <p className="font-medium">{findings.network.asn}</p>
                  </div>
                  {findings.network.hostname && findings.network.hostname !== 'Unknown' && (
                    <div>
                      <p className="text-sm text-gray-600">Hostname</p>
                      <code className="font-mono text-sm bg-white/70 p-1 rounded">{findings.network.hostname}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Security Analysis */}
          {findings.security && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4 text-orange-800">Análisis de Seguridad</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`text-center p-3 rounded border ${findings.security.isProxy ? 'bg-red-100 border-red-200' : 'bg-green-100 border-green-200'}`}>
                  <p className={`text-2xl font-bold ${findings.security.isProxy ? 'text-red-600' : 'text-green-600'}`}>
                    {findings.security.isProxy ? '⚠️' : '✅'}
                  </p>
                  <p className="text-sm text-gray-600">Proxy</p>
                  <p className="text-xs">{findings.security.isProxy ? 'Detectado' : 'No detectado'}</p>
                </div>
                <div className={`text-center p-3 rounded border ${findings.security.isVPN ? 'bg-red-100 border-red-200' : 'bg-green-100 border-green-200'}`}>
                  <p className={`text-2xl font-bold ${findings.security.isVPN ? 'text-red-600' : 'text-green-600'}`}>
                    {findings.security.isVPN ? '🔒' : '✅'}
                  </p>
                  <p className="text-sm text-gray-600">VPN</p>
                  <p className="text-xs">{findings.security.isVPN ? 'Detectado' : 'No detectado'}</p>
                </div>
                <div className={`text-center p-3 rounded border ${findings.security.isTor ? 'bg-red-100 border-red-200' : 'bg-green-100 border-green-200'}`}>
                  <p className={`text-2xl font-bold ${findings.security.isTor ? 'text-red-600' : 'text-green-600'}`}>
                    {findings.security.isTor ? '🧅' : '✅'}
                  </p>
                  <p className="text-sm text-gray-600">Tor</p>
                  <p className="text-xs">{findings.security.isTor ? 'Detectado' : 'No detectado'}</p>
                </div>
                <div className={`text-center p-3 rounded border ${findings.security.isHosting ? 'bg-yellow-100 border-yellow-200' : 'bg-green-100 border-green-200'}`}>
                  <p className={`text-2xl font-bold ${findings.security.isHosting ? 'text-yellow-600' : 'text-green-600'}`}>
                    {findings.security.isHosting ? '🏢' : '👤'}
                  </p>
                  <p className="text-sm text-gray-600">Hosting</p>
                  <p className="text-xs">{findings.security.isHosting ? 'Servidor' : 'Usuario'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Data Source */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h5 className="font-medium mb-2">Información de la Fuente</h5>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Fuente de datos: <span className="font-medium">{findings.metadata?.dataSource}</span></span>
              <span className="text-gray-600">Actualizado: {findings.metadata?.lastUpdated}</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Phone Number OSINT Analysis
    if (toolName.toLowerCase().includes('phone') || findings.phone || findings.isValid !== undefined) {
      return (
        <div className="space-y-6">
          {/* Phone Overview */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
            <h4 className="font-semibold mb-4 flex items-center text-indigo-800">
              <span className="text-2xl mr-2">📱</span>
              Análisis OSINT de Teléfono
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Número Analizado</p>
                    <code className="font-mono text-lg bg-white/70 p-2 rounded block">{findings.phone}</code>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${findings.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {findings.isValid ? '✅ Válido' : '❌ Inválido'}
                    </Badge>
                    <Badge className="bg-indigo-100 text-indigo-800">
                      {findings.metadata?.confidence}% Confianza
                    </Badge>
                    <Badge variant="outline">{findings.type || 'Unknown'}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fuente de datos</p>
                    <p className="font-medium text-sm">{findings.metadata?.dataSource}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Operador / Carrier</p>
                  <p className="text-xl font-bold text-indigo-600">{findings.carrier || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Línea</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {findings.security?.isMobile ? '📱' : 
                       findings.security?.isLandline ? '☎️' : 
                       findings.security?.isVoip ? '💻' : '❓'}
                    </span>
                    <span className="font-medium">{findings.type}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formatted Numbers */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6">
            <h4 className="font-semibold mb-4 text-blue-800">Formatos del Número</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/70 rounded border">
                <p className="text-sm text-gray-600 mb-1">Nacional</p>
                <code className="text-lg font-bold text-blue-600 block">{findings.formatted?.national || 'N/A'}</code>
              </div>
              <div className="text-center p-3 bg-white/70 rounded border">
                <p className="text-sm text-gray-600 mb-1">Internacional</p>
                <code className="text-lg font-bold text-blue-600 block">{findings.formatted?.international || 'N/A'}</code>
              </div>
              <div className="text-center p-3 bg-white/70 rounded border">
                <p className="text-sm text-gray-600 mb-1">E.164</p>
                <code className="text-lg font-bold text-blue-600 block">{findings.formatted?.e164 || 'N/A'}</code>
              </div>
            </div>
          </div>

          {/* Location Information */}
          {findings.location && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4 text-green-800">Información Geográfica</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white/70 rounded border">
                  <p className="text-2xl font-bold text-green-600">{findings.location.country || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">País</p>
                  {findings.location.countryCode && (
                    <p className="text-xs text-gray-500 mt-1">({findings.location.countryCode})</p>
                  )}
                </div>
                <div className="text-center p-3 bg-white/70 rounded border">
                  <p className="text-2xl font-bold text-green-600">{findings.location.region || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">Región</p>
                </div>
                <div className="text-center p-3 bg-white/70 rounded border">
                  <p className="text-2xl font-bold text-green-600">{findings.location.timezone || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">Zona Horaria</p>
                </div>
                <div className="text-center p-3 bg-white/70 rounded border">
                  <p className="text-2xl font-bold text-green-600">
                    {findings.location.countryCode ? `+${findings.location.countryCode.replace(/[^\d]/g, '')}` : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">Código País</p>
                </div>
              </div>
            </div>
          )}

          {/* Security Analysis */}
          {findings.security && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4 text-orange-800">Análisis de Seguridad</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`text-center p-3 rounded border ${findings.security.riskLevel === 'Low' ? 'bg-green-100 border-green-200' : findings.security.riskLevel === 'Medium' ? 'bg-yellow-100 border-yellow-200' : 'bg-red-100 border-red-200'}`}>
                  <p className={`text-2xl font-bold ${findings.security.riskLevel === 'Low' ? 'text-green-600' : findings.security.riskLevel === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {findings.security.riskLevel === 'Low' ? '✅' : findings.security.riskLevel === 'Medium' ? '⚠️' : '🚨'}
                  </p>
                  <p className="text-sm text-gray-600">Nivel de Riesgo</p>
                  <p className="text-xs font-medium">{findings.security.riskLevel}</p>
                </div>
                <div className={`text-center p-3 rounded border ${findings.security.isActive ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}`}>
                  <p className={`text-2xl font-bold ${findings.security.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {findings.security.isActive ? '📶' : '📵'}
                  </p>
                  <p className="text-sm text-gray-600">Estado</p>
                  <p className="text-xs">{findings.security.isActive ? 'Activo' : 'Inactivo'}</p>
                </div>
                <div className={`text-center p-3 rounded border ${findings.security.isVoip ? 'bg-yellow-100 border-yellow-200' : 'bg-green-100 border-green-200'}`}>
                  <p className={`text-2xl font-bold ${findings.security.isVoip ? 'text-yellow-600' : 'text-green-600'}`}>
                    {findings.security.isVoip ? '💻' : '📞'}
                  </p>
                  <p className="text-sm text-gray-600">VOIP</p>
                  <p className="text-xs">{findings.security.isVoip ? 'Detectado' : 'Tradicional'}</p>
                </div>
                <div className="text-center p-3 bg-blue-100 border border-blue-200 rounded">
                  <p className="text-2xl font-bold text-blue-600">
                    {findings.security.isMobile ? '📱' : findings.security.isLandline ? '☎️' : '❓'}
                  </p>
                  <p className="text-sm text-gray-600">Tipo</p>
                  <p className="text-xs">
                    {findings.security.isMobile ? 'Móvil' : 
                     findings.security.isLandline ? 'Fijo' : 'Desconocido'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Carrier Information */}
          {findings.security?.possibleCarriers && findings.security.possibleCarriers.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4 text-purple-800">Información del Operador</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Operadores Posibles</p>
                  <div className="space-y-2">
                    {findings.security.possibleCarriers.map((carrier, idx) => (
                      <div key={idx} className="bg-white/70 rounded p-2 border">
                        <span className="font-medium">{carrier}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Características</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-white/70 rounded p-2">
                      <span className="text-sm">Tipo de línea</span>
                      <Badge>{findings.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between bg-white/70 rounded p-2">
                      <span className="text-sm">Red</span>
                      <span className="text-sm font-medium">{findings.carrier}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h5 className="font-medium mb-3">Detalles Técnicos</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Método de análisis:</span>
                <span className="font-medium ml-2">{findings.metadata?.method || findings.metadata?.dataSource}</span>
              </div>
              <div>
                <span className="text-gray-600">Última actualización:</span>
                <span className="font-medium ml-2">{findings.metadata?.lastUpdated}</span>
              </div>
              {findings.metadata?.apiProvider && (
                <div>
                  <span className="text-gray-600">Proveedor API:</span>
                  <span className="font-medium ml-2">{findings.metadata.apiProvider}</span>
                </div>
              )}
              <div>
                <span className="text-gray-600">Nivel de confianza:</span>
                <span className="font-medium ml-2">{findings.metadata?.confidence}%</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Cryptocurrency Wallet Analysis
    if (toolName.toLowerCase().includes('cryptocurrency') || 
        toolName.toLowerCase().includes('bitcoin') || 
        toolName.toLowerCase().includes('ethereum')) {
      return (
        <div className="space-y-6">
          {/* Wallet Overview */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center text-orange-800">
              <span className="text-2xl mr-2">₿</span>
              Análisis de Wallet Cryptocurrency
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Dirección de Wallet</p>
                <code className="font-mono text-sm bg-white/70 p-2 rounded block break-all">{findings.address}</code>
                <div className="mt-2 flex space-x-2">
                  {findings.metadata?.labels?.map((label: string, idx: number) => (
                    <Badge key={idx} className="bg-orange-100 text-orange-800">{label}</Badge>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-3xl font-bold text-green-600">${findings.totalValueUSD?.toLocaleString()}</p>
                <p className="text-sm text-gray-500">USD</p>
              </div>
            </div>
          </div>

          {/* Network Balances */}
          {findings.networks && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4 text-blue-800">Balances por Red</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {findings.networks.map((network: any, idx: number) => (
                  <div key={idx} className="bg-white/70 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">
                          {network.symbol === 'BTC' ? '₿' : 
                           network.symbol === 'ETH' ? 'Ξ' : 
                           network.symbol === 'BNB' ? '🔶' : '💰'}
                        </span>
                        <span className="font-semibold">{network.name}</span>
                      </div>
                      <Badge variant="outline">{network.symbol}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{network.balance} {network.symbol}</p>
                        <p className="text-sm text-gray-600">${network.balanceUSD?.toLocaleString()} USD</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500">Transacciones</p>
                          <p className="font-semibold">{network.transactions?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Última actividad</p>
                          <p className="font-semibold">{network.lastTransaction ? new Date(network.lastTransaction).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Token Holdings */}
          {findings.tokens && findings.tokens.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4 text-purple-800">Tokens y Activos</h4>
              <div className="space-y-3">
                {findings.tokens.map((token: any, idx: number) => (
                  <div key={idx} className="bg-white/70 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-bold text-sm">{token.symbol}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{token.name}</p>
                        <p className="text-sm text-gray-600">Red: {token.network}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{token.balance} {token.symbol}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          {findings.recentTransactions && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4 text-green-800">Transacciones Recientes</h4>
              <div className="space-y-3">
                {findings.recentTransactions.map((tx: any, idx: number) => (
                  <div key={idx} className="bg-white/70 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg ${tx.type === 'received' ? '⬇️' : '⬆️'}`}></span>
                        <Badge className={tx.type === 'received' ? 'bg-green-600' : 'bg-red-600'}>
                          {tx.type === 'received' ? 'Recibido' : 'Enviado'}
                        </Badge>
                        <Badge variant="outline">{tx.network}</Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Hash</p>
                        <code className="text-xs break-all">{tx.hash}</code>
                      </div>
                      <div>
                        <p className="text-gray-600">{tx.type === 'received' ? 'Desde' : 'Hacia'}</p>
                        <code className="text-xs break-all">{tx.type === 'received' ? tx.from : tx.to}</code>
                      </div>
                      <div>
                        <p className="text-gray-600">Valor</p>
                        <p className="font-bold">{tx.value} {tx.network === 'Bitcoin' ? 'BTC' : 'ETH'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Analysis */}
          {findings.riskAnalysis && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4 text-red-800">Análisis de Riesgo</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Puntuación de Riesgo</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-3xl font-bold text-red-600">{findings.riskAnalysis.riskScore}</p>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            findings.riskAnalysis.riskScore < 30 ? 'bg-green-500' :
                            findings.riskAnalysis.riskScore < 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${findings.riskAnalysis.riskScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Flags Detectados</p>
                    {findings.riskAnalysis.flags?.map((flag: string, idx: number) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <span className="text-red-500">⚠️</span>
                        <span className="text-sm">{flag}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {findings.riskAnalysis.exchanges?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Exchanges Conectados</p>
                      <div className="flex flex-wrap gap-2">
                        {findings.riskAnalysis.exchanges.map((exchange: string, idx: number) => (
                          <Badge key={idx} className="bg-blue-100 text-blue-800">🏦 {exchange}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {findings.riskAnalysis.mixers?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Mixers Detectados</p>
                      <div className="flex flex-wrap gap-2">
                        {findings.riskAnalysis.mixers.map((mixer: string, idx: number) => (
                          <Badge key={idx} className="bg-red-100 text-red-800">🌪️ {mixer}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-white/50 rounded p-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Sanciones</p>
                        <p className={`font-semibold ${findings.riskAnalysis.sanctions ? 'text-red-600' : 'text-green-600'}`}>
                          {findings.riskAnalysis.sanctions ? '❌ Sí' : '✅ No'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Tipo de Dirección</p>
                        <p className="font-semibold">{findings.metadata?.addressType || 'Estándar'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Phone Lookup Analysis
    if (toolName.toLowerCase().includes('phone')) {
      return (
        <div className="space-y-6">
          {/* Phone Overview */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center text-green-800">
              <span className="text-2xl mr-2">📱</span>
              Análisis de Número Telefónico
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Número Original</p>
                <p className="text-2xl font-bold">{findings.phone}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm"><strong>Nacional:</strong> {findings.formatted?.national}</p>
                  <p className="text-sm"><strong>Internacional:</strong> {findings.formatted?.international}</p>
                </div>
              </div>
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Operador</p>
                    <p className="font-semibold">{findings.carrier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tipo</p>
                    <Badge className="bg-green-100 text-green-800">{findings.type}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Location Info */}
          {findings.location && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4 text-blue-800">Información de Ubicación</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span>🌍</span>
                    <span><strong>País:</strong> {findings.location.country}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>📍</span>
                    <span><strong>Estado:</strong> {findings.location.state}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🏙️</span>
                    <span><strong>Ciudad:</strong> {findings.location.city}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🕐</span>
                    <span><strong>Zona Horaria:</strong> {findings.location.timezone}</span>
                  </div>
                </div>
                {findings.location.coordinates && (
                  <div className="bg-white/70 rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">Coordenadas</p>
                    <p className="text-sm font-mono">
                      {findings.location.coordinates.lat}, {findings.location.coordinates.lng}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reputation Analysis */}
          {findings.reputation && (
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4 text-purple-800">Análisis de Reputación</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/70 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">{findings.reputation.score}</p>
                  <p className="text-sm text-gray-600">Puntuación</p>
                </div>
                <div className="text-center p-4 bg-white/70 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">{findings.reputation.reports}</p>
                  <p className="text-sm text-gray-600">Reportes</p>
                </div>
                <div className="text-center p-4 bg-white/70 rounded-lg">
                  <Badge className={`${
                    findings.reputation.category === 'Clean' ? 'bg-green-600' :
                    findings.reputation.category === 'Spam Risk' ? 'bg-yellow-600' : 'bg-red-600'
                  }`}>
                    {findings.reputation.category}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Categoría</p>
                </div>
              </div>
              {findings.reputation.lastReported && (
                <div className="mt-4 bg-white/50 rounded p-3">
                  <p className="text-sm"><strong>Último reporte:</strong> {new Date(findings.reputation.lastReported).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          )}

          {/* Social Media Connections */}
          {findings.social && findings.social.length > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4 text-orange-800">Conexiones de Redes Sociales</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {findings.social.map((social: any, idx: number) => (
                  <div key={idx} className="bg-white/70 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 text-sm">📱</span>
                      </div>
                      <div>
                        <p className="font-semibold">{social.platform}</p>
                        {social.username && <p className="text-sm text-gray-600">@{social.username}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={social.verified ? 'bg-green-600' : 'bg-gray-600'}>
                        {social.verified ? '✅ Verificado' : '❓ No verificado'}
                      </Badge>
                      {social.lastSeen && (
                        <p className="text-xs text-gray-500 mt-1">Visto: {social.lastSeen}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Emails & Risk Factors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {findings.relatedEmails && findings.relatedEmails.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-blue-800">Emails Relacionados</h4>
                <div className="space-y-2">
                  {findings.relatedEmails.map((email: string, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-blue-600">📧</span>
                      <code className="text-sm bg-white px-2 py-1 rounded">{email}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {findings.riskFactors && findings.riskFactors.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-red-800">Factores de Riesgo</h4>
                <div className="space-y-2">
                  {findings.riskFactors.map((factor: string, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-red-500">⚠️</span>
                      <span className="text-sm text-red-700">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          {findings.metadata && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Metadatos</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Primera vez visto</p>
                  <p className="font-medium">{findings.metadata.firstSeen}</p>
                </div>
                <div>
                  <p className="text-gray-600">Última actividad</p>
                  <p className="font-medium">{findings.metadata.lastActivity}</p>
                </div>
                <div>
                  <p className="text-gray-600">Confianza</p>
                  <p className="font-medium">{findings.metadata.confidence}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Email Finder/Verifier Analysis
    if (toolName.toLowerCase().includes('email')) {
      return (
        <div className="space-y-6">
          {/* Email Overview */}
          <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center text-blue-800">
              <span className="text-2xl mr-2">📧</span>
              Análisis de Emails
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/70 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{findings.totalFound || findings.emails?.length}</p>
                <p className="text-sm text-gray-600">Emails Encontrados</p>
              </div>
              <div className="text-center p-4 bg-white/70 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  {findings.emails?.filter((e: any) => e.verified !== false).length || 0}
                </p>
                <p className="text-sm text-gray-600">Verificados</p>
              </div>
              <div className="text-center p-4 bg-white/70 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{findings.employees?.length || 0}</p>
                <p className="text-sm text-gray-600">Empleados</p>
              </div>
            </div>
          </div>

          {/* Email List */}
          {findings.emails && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4 text-green-800">Emails Detectados</h4>
              <div className="space-y-3">
                {findings.emails.map((emailData: any, idx: number) => {
                  const email = typeof emailData === 'string' ? emailData : emailData.email;
                  const verified = typeof emailData === 'object' ? emailData.verified : true;
                  const confidence = typeof emailData === 'object' ? emailData.confidence : 85;
                  const source = typeof emailData === 'object' ? emailData.source : 'Web scan';
                  const type = typeof emailData === 'object' ? emailData.type : 'Generic';
                  
                  return (
                    <div key={idx} className="bg-white/70 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-green-600">📧</span>
                          <code className="font-mono">{email}</code>
                        </div>
                        <div className="flex space-x-2">
                          <Badge className={verified ? 'bg-green-600' : 'bg-gray-600'}>
                            {verified ? '✅ Verificado' : '❓ No verificado'}
                          </Badge>
                          <Badge variant="outline">{type}</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Fuente</p>
                          <p className="font-medium">{source}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Confianza</p>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{confidence}%</p>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  confidence >= 80 ? 'bg-green-500' :
                                  confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${confidence}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Email Patterns */}
          {findings.patterns && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4 text-purple-800">Patrones de Email Detectados</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {findings.patterns.map((pattern: string, idx: number) => (
                  <div key={idx} className="bg-white/70 rounded p-3 flex items-center space-x-2">
                    <span className="text-purple-600">📋</span>
                    <code className="text-sm">{pattern}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employee Directory */}
          {findings.employees && findings.employees.length > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6">
              <h4 className="font-semibold mb-4 text-orange-800">Directorio de Empleados</h4>
              <div className="space-y-3">
                {findings.employees.map((employee: any, idx: number) => (
                  <div key={idx} className="bg-white/70 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 font-bold">
                            {employee.name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">{employee.name}</p>
                          <p className="text-sm text-gray-600">{employee.position}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <code className="text-sm bg-white px-2 py-1 rounded">{employee.email}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Whois Lookup
    if (toolName.toLowerCase().includes('whois')) {
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3 text-blue-800">Información del Dominio</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Dominio</p>
                <p className="font-bold">{findings.domain}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Registrador</p>
                <p className="font-medium">{findings.registrar}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha de Registro</p>
                <p className="font-medium">{new Date(findings.registrationDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha de Expiración</p>
                <p className="font-medium">{new Date(findings.expirationDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          {findings.nameServers && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Servidores DNS</h4>
              <div className="space-y-1">
                {findings.nameServers.map((ns: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <code className="text-sm">{ns}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Port Scanner
    if (toolName.toLowerCase().includes('port')) {
      return (
        <div className="space-y-4">
          <div className="bg-red-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3 text-red-800">Resultados del Escaneo de Puertos</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Objetivo</p>
                <p className="font-mono">{findings.target}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rango de Puertos</p>
                <p className="font-mono">{findings.portRange}</p>
              </div>
            </div>
            
            {findings.openPorts && findings.openPorts.length > 0 && (
              <div>
                <h5 className="font-medium mb-2 text-green-700">Puertos Abiertos ({findings.openPorts.length})</h5>
                <div className="space-y-2">
                  {findings.openPorts.map((port: any, idx: number) => (
                    <div key={idx} className="bg-white rounded p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-mono font-bold">{port.port}</span>
                        <Badge variant="outline">{port.service}</Badge>
                      </div>
                      <span className="text-sm text-gray-600">{port.version}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // User Reconnaissance & Social Scan
    if (toolName.toLowerCase().includes('user') || toolName.toLowerCase().includes('social')) {
      return (
        <div className="space-y-4">
          {findings.socialProfiles && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-purple-800">Perfiles Sociales Encontrados</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {findings.socialProfiles.map((profile: any, idx: number) => (
                  <div key={idx} className={`p-3 rounded border ${profile.found ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{profile.platform}</span>
                      {profile.found ? (
                        <Badge className="bg-green-600 text-white">Encontrado</Badge>
                      ) : (
                        <Badge variant="secondary">No encontrado</Badge>
                      )}
                    </div>
                    {profile.found && (
                      <div className="text-sm space-y-1">
                        <p>👤 @{profile.username}</p>
                        {profile.followers && <p>👥 {profile.followers.toLocaleString()} seguidores</p>}
                        {profile.verified && <p>✅ Perfil verificado</p>}
                        {profile.isPrivate && <p>🔒 Perfil privado</p>}
                        {profile.company && <p>🏢 {profile.company}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {findings.emails && findings.emails.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-blue-800">Emails Asociados</h4>
              <div className="space-y-2">
                {findings.emails.map((email: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="text-blue-600">📧</span>
                    <code className="text-sm bg-white px-2 py-1 rounded">{email}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {findings.summary && (
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-orange-800">Resumen del Análisis</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Plataformas Analizadas</p>
                  <p className="text-xl font-bold">{findings.summary.totalPlatforms}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Perfiles Encontrados</p>
                  <p className="text-xl font-bold text-green-600">{findings.summary.foundProfiles}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Puntuación de Riesgo</p>
                  <p className="text-xl font-bold text-orange-600">{findings.summary.riskScore}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nivel de Privacidad</p>
                  <Badge className={findings.summary.privacyLevel === 'High' ? 'bg-green-600' : findings.summary.privacyLevel === 'Medium' ? 'bg-yellow-600' : 'bg-red-600'}>
                    {findings.summary.privacyLevel}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Email Finder/Verifier
    if (toolName.toLowerCase().includes('email')) {
      return (
        <div className="space-y-4">
          {findings.emails && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-blue-800">Emails Encontrados ({findings.totalFound})</h4>
              <div className="space-y-3">
                {findings.emails.map((emailData: any, idx: number) => (
                  <div key={idx} className="bg-white rounded p-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <code className="font-medium">{emailData.email}</code>
                      <div className="flex space-x-2">
                        {emailData.verified && <Badge className="bg-green-600 text-white">Verificado</Badge>}
                        <Badge variant="outline">{emailData.confidence}% confianza</Badge>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>📍 Fuente: {emailData.source}</p>
                      <p>🏷️ Tipo: {emailData.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {findings.employees && (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 text-green-800">Empleados Identificados</h4>
              <div className="space-y-2">
                {findings.employees.map((emp: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-white rounded p-2">
                    <div>
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-sm text-gray-600">{emp.position}</p>
                    </div>
                    <code className="text-sm">{emp.email}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Phone Lookup
    if (toolName.toLowerCase().includes('phone')) {
      return (
        <div className="space-y-4">
          <div className="bg-indigo-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3 text-indigo-800">Información del Número</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Operador</p>
                <p className="font-medium">{findings.carrier}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipo</p>
                <p className="font-medium">{findings.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ubicación</p>
                <p className="font-medium">{findings.location.city}, {findings.location.state}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reputación</p>
                <Badge className={findings.reputation.category === 'Clean' ? 'bg-green-600' : 'bg-red-600'}>
                  {findings.reputation.category}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Default rendering for other tools
    return (
      <div className="space-y-3">
        {Object.entries(findings).map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return (
              <div key={key} className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold capitalize mb-2">{key.replace(/_/g, ' ')}</h5>
                <div className="pl-4">
                  {Array.isArray(value) ? (
                    <ul className="space-y-1">
                      {value.map((item, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span className="text-sm">{typeof item === 'object' ? JSON.stringify(item, null, 2) : item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <pre className="text-sm bg-white p-2 rounded overflow-auto">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            );
          }
          
          return (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-600 capitalize font-medium">{key.replace(/_/g, ' ')}:</span>
              <span className="font-medium text-gray-900">{String(value)}</span>
            </div>
          );
        })}
      </div>
    );
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  const downloadReportPDF = async () => {
    // Verificar que estamos en la pestaña correcta
    if (activeTab !== 'data') {
      alert('Por favor, ve a la pestaña "Resultados" para descargar el PDF visual');
      return;
    }

    // Crear un contenedor temporal para el contenido del PDF
    const printContent = document.getElementById('report-results-content');
    if (!printContent) {
      alert('No se encontró el contenido del reporte. Asegúrate de estar en la pestaña "Resultados"');
      return;
    }

    try {
      // Crear el HTML limpio para el PDF (sin clases de Tailwind CSS)
      const cleanContent = printContent.cloneNode(true) as HTMLElement;
      
      // Limpiar clases de Tailwind y convertir a estilos inline
      const processElement = (element: HTMLElement) => {
        // Remover clases de Tailwind
        element.className = '';
        
        // Procesar hijos
        Array.from(element.children).forEach(child => {
          if (child instanceof HTMLElement) {
            processElement(child);
          }
        });
      };

      processElement(cleanContent);

      // Crear el HTML completo para el PDF
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>COAS TEAM - Reporte OSINT - ${report.title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px; }
    .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #007bff; margin: 0; }
    .section { margin-bottom: 25px; page-break-inside: avoid; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
    .crypto-card { background: linear-gradient(135deg, #fff3cd, #ffeaa7); }
    .network-card { background: linear-gradient(135deg, #d1ecf1, #bee5eb); display: inline-block; width: 30%; margin-right: 3%; }
    .email-card { background: linear-gradient(135deg, #d4edda, #c3e6cb); }
    .phone-card { background: linear-gradient(135deg, #d1ecf1, #bee5eb); }
    .badge { padding: 3px 8px; border-radius: 3px; font-size: 11px; margin-right: 5px; }
    .badge-green { background: #28a745; color: white; }
    .badge-red { background: #dc3545; color: white; }
    .badge-blue { background: #007bff; color: white; }
    .text-center { text-align: center; }
    .font-bold { font-weight: bold; }
    .text-2xl { font-size: 24px; }
    .text-lg { font-size: 18px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 COAS TEAM - Reporte OSINT</h1>
    <p><strong>${report.title}</strong></p>
    <p>${report.description}</p>
    <p>Generado el ${new Date().toLocaleString('es-ES')}</p>
  </div>
  ${cleanContent.innerHTML}
</body>
</html>`;

      // Crear un blob y descargarlo directamente
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-osint-${report.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Mostrar instrucciones
      setTimeout(() => {
        alert('📄 Archivo HTML descargado. Para convertir a PDF:\n\n1. Abre el archivo descargado en tu navegador\n2. Usa Ctrl+P (o Cmd+P)\n3. Selecciona "Guardar como PDF" como destino\n4. Ajusta los márgenes y configuración si es necesario');
      }, 500);

    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${formatColors[report.format]}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{report.title}</h2>
              <p className="text-gray-600 text-sm">{report.description}</p>
            </div>
            <Badge className={statusColors[report.status]}>
              {report.status === 'completed' ? 'Completado' :
               report.status === 'generating' ? 'Generando' : 'Fallido'}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative group">
              <Button className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Descargar</span>
              </Button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => onDownload(report)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Descargar JSON</span>
                  </button>
                  <button
                    onClick={downloadReportPDF}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar PDF (Visual)</span>
                  </button>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Resumen', icon: Target },
              { id: 'data', label: 'Resultados', icon: CheckCircle2 },
              { id: 'raw', label: 'Datos Raw', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle>Información del Reporte</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Fecha</p>
                      <p className="font-medium">{new Date(report.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Formato</p>
                      <Badge variant="outline">{report.format.toUpperCase()}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tamaño</p>
                      <p className="font-medium">{report.size}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Scans</p>
                      <p className="font-medium">{report.scansCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Scans Exitosos</p>
                        <p className="text-2xl font-bold text-green-600">{reportData.summary.successfulScans}</p>
                      </div>
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Scans Fallidos</p>
                        <p className="text-2xl font-bold text-red-600">{reportData.summary.failedScans}</p>
                      </div>
                      <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Objetivos</p>
                        <p className="text-2xl font-bold text-blue-600">{reportData.summary.totalTargets}</p>
                      </div>
                      <Target className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Risk Findings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Análisis de Riesgos Detectados</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Alto Riesgo */}
                    {reportData.summary.riskFindings.high > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <span className="font-semibold text-red-800">Alto Riesgo</span>
                          </div>
                          <Badge className="bg-red-600 text-white">{reportData.summary.riskFindings.high}</Badge>
                        </div>
                        <p className="text-sm text-red-700">
                          Vulnerabilidades críticas, puertos sensibles abiertos (SSH, MySQL), 
                          o datos comprometidos en brechas de seguridad.
                        </p>
                      </div>
                    )}
                    
                    {/* Medio Riesgo */}
                    {reportData.summary.riskFindings.medium > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            <span className="font-semibold text-yellow-800">Riesgo Medio</span>
                          </div>
                          <Badge className="bg-yellow-600 text-white">{reportData.summary.riskFindings.medium}</Badge>
                        </div>
                        <p className="text-sm text-yellow-700">
                          Información personal expuesta (emails, teléfonos), 
                          perfiles públicos con datos sensibles.
                        </p>
                      </div>
                    )}
                    
                    {/* Bajo Riesgo */}
                    {reportData.summary.riskFindings.low > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-green-800">Bajo Riesgo</span>
                          </div>
                          <Badge className="bg-green-600 text-white">{reportData.summary.riskFindings.low}</Badge>
                        </div>
                        <p className="text-sm text-green-700">
                          Información pública general, registros DNS estándar, 
                          datos de dominio públicos.
                        </p>
                      </div>
                    )}
                    
                    {/* Sin riesgos detectados */}
                    {reportData.summary.riskFindings.high === 0 && 
                     reportData.summary.riskFindings.medium === 0 && 
                     reportData.summary.riskFindings.low === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <Shield className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No se detectaron riesgos en este análisis</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div id="report-results-content" className="space-y-4">
              <h3 className="text-lg font-semibold">Resultados de Análisis OSINT</h3>
              {reportData.scans.map((scan, index) => (
                <Card key={`${scan.id}-${index}-${report.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{scan.tool}</Badge>
                        <span className="font-medium">{scan.target}</span>
                        {scan.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {scan.duration}s
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {scan.status === 'completed' && scan.findings ? (
                      <div className="space-y-4">
                        {renderFindingsVisual(scan.tool, scan.findings)}
                      </div>
                    ) : (
                      <div className="text-red-600 text-sm">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        {scan.error || 'Scan failed'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Raw Data Tab */}
          {activeTab === 'raw' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Datos Raw (JSON)</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(formatJSON(reportData))}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
              </div>
              <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-auto max-h-96">
                <pre>{formatJSON(reportData)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Generado por COAS TEAM OSINT Platform v2.0</span>
            <span>Última actualización: {new Date(report.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}