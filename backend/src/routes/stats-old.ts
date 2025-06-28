import express from 'express';
import { OSINTStats } from '../types/osint';
import { logger } from '../server';

const router = express.Router();

// Obtener estadísticas generales
router.get('/overview', (req, res) => {
  try {
    // En un entorno real, consultaríamos la base de datos
    const stats: OSINTStats = {
      totalScans: 157,
      successfulScans: 142,
      failedScans: 15,
      averageTime: 8.5,
      toolUsage: {
        'whois': 45,
        'dns-lookup': 38,
        'ip-lookup': 32,
        'subdomain-scanner': 18,
        'port-scanner': 12,
        'user-recon': 8,
        'instagram-recon': 4
      },
      recentActivity: [
        {
          id: 'scan_latest_1',
          tool: 'whois',
          target: 'example.com',
          status: 'completed',
          startTime: new Date(Date.now() - 300000), // 5 min ago
          endTime: new Date(Date.now() - 295000),
          duration: 5000
        },
        {
          id: 'scan_latest_2',
          tool: 'dns-lookup',
          target: 'test.com',
          status: 'completed',
          startTime: new Date(Date.now() - 600000), // 10 min ago
          endTime: new Date(Date.now() - 597000),
          duration: 3000
        },
        {
          id: 'scan_latest_3',
          tool: 'ip-lookup',
          target: '8.8.8.8',
          status: 'running',
          startTime: new Date(Date.now() - 30000) // 30 sec ago
        }
      ]
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error fetching overview stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
});

// Obtener estadísticas de herramientas
router.get('/tools', (req, res) => {
  try {
    const toolStats = {
      mostUsed: [
        { tool: 'whois', count: 45, successRate: 95.6 },
        { tool: 'dns-lookup', count: 38, successRate: 97.4 },
        { tool: 'ip-lookup', count: 32, successRate: 100.0 },
        { tool: 'subdomain-scanner', count: 18, successRate: 83.3 },
        { tool: 'port-scanner', count: 12, successRate: 75.0 }
      ],
      averageTimes: {
        'whois': 4.2,
        'dns-lookup': 3.1,
        'ip-lookup': 2.8,
        'subdomain-scanner': 35.7,
        'port-scanner': 127.3,
        'user-recon': 18.9
      },
      riskLevels: {
        low: 89,
        medium: 52,
        high: 16
      }
    };

    res.json({
      success: true,
      toolStats
    });
  } catch (error) {
    logger.error('Error fetching tool stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas de herramientas'
    });
  }
});

// Obtener estadísticas de tiempo
router.get('/timeline', (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    
    // Generar datos de ejemplo para los últimos N días
    const timeline = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      timeline.push({
        date: date.toISOString().split('T')[0],
        scans: Math.floor(Math.random() * 20) + 5,
        successful: Math.floor(Math.random() * 18) + 4,
        failed: Math.floor(Math.random() * 3),
        averageTime: (Math.random() * 15) + 3
      });
    }

    res.json({
      success: true,
      timeline,
      period: `${days} days`
    });
  } catch (error) {
    logger.error('Error fetching timeline stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas temporales'
    });
  }
});

// Obtener estadísticas en tiempo real
router.get('/realtime', (req, res) => {
  try {
    const realtimeStats = {
      activeScans: 2,
      queuedScans: 0,
      serverLoad: {
        cpu: Math.random() * 60 + 20, // 20-80%
        memory: Math.random() * 40 + 30, // 30-70%
        disk: Math.random() * 20 + 10 // 10-30%
      },
      performance: {
        responseTime: Math.random() * 500 + 100, // 100-600ms
        throughput: Math.random() * 50 + 25, // 25-75 requests/min
        errorRate: Math.random() * 5 // 0-5%
      },
      lastUpdate: new Date().toISOString()
    };

    res.json({
      success: true,
      stats: realtimeStats
    });
  } catch (error) {
    logger.error('Error fetching realtime stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas en tiempo real'
    });
  }
});

// Obtener estadísticas de targets más consultados
router.get('/targets', (req, res) => {
  try {
    const topTargets = [
      { target: 'google.com', scans: 23, lastScan: new Date(Date.now() - 3600000) },
      { target: 'example.com', scans: 18, lastScan: new Date(Date.now() - 7200000) },
      { target: '8.8.8.8', scans: 15, lastScan: new Date(Date.now() - 1800000) },
      { target: 'github.com', scans: 12, lastScan: new Date(Date.now() - 5400000) },
      { target: 'stackoverflow.com', scans: 9, lastScan: new Date(Date.now() - 9000000) }
    ];

    res.json({
      success: true,
      targets: topTargets
    });
  } catch (error) {
    logger.error('Error fetching target stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas de targets'
    });
  }
});

export default router;