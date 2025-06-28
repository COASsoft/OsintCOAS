import express from 'express';

const router = express.Router();

// Obtener estadísticas generales
router.get('/overview', (_req, res) => {
  try {
    const stats = {
      totalScans: 156,
      successfulScans: 142,
      failedScans: 14,
      activeScans: 3,
      averageTime: 2.5,
      popularTools: [
        { toolId: 'ip-lookup', name: 'IP Lookup', uses: 45 },
        { toolId: 'whois', name: 'Whois Lookup', uses: 38 },
        { toolId: 'dns-lookup', name: 'DNS Lookup', uses: 32 },
        { toolId: 'subdomain-scanner', name: 'Subdomain Scanner', uses: 28 },
        { toolId: 'port-scanner', name: 'Port Scanner', uses: 22 }
      ]
    };

    return res.json(stats);
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    return res.status(500).json({
      error: 'Error al obtener estadísticas generales'
    });
  }
});

// Obtener estadísticas por herramienta
router.get('/tools', (_req, res) => {
  try {
    const toolStats = [
      {
        toolId: 'ip-lookup',
        name: 'IP Lookup',
        totalUses: 45,
        successRate: 96.8,
        averageTime: 2.1,
        lastUsed: new Date().toISOString()
      },
      {
        toolId: 'whois',
        name: 'Whois Lookup',
        totalUses: 38,
        successRate: 94.2,
        averageTime: 3.2,
        lastUsed: new Date().toISOString()
      },
      {
        toolId: 'dns-lookup',
        name: 'DNS Lookup',
        totalUses: 32,
        successRate: 98.1,
        averageTime: 1.8,
        lastUsed: new Date().toISOString()
      }
    ];

    return res.json(toolStats);
  } catch (error) {
    console.error('Error fetching tool stats:', error);
    return res.status(500).json({
      error: 'Error al obtener estadísticas de herramientas'
    });
  }
});

// Obtener estadísticas temporales
router.get('/timeline', (_req, res) => {
  try {
    const timeline = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
      timeline.push({
        timestamp: timestamp.toISOString(),
        scans: Math.floor(Math.random() * 10) + 1,
        success: Math.floor(Math.random() * 8) + 1,
        failed: Math.floor(Math.random() * 2)
      });
    }

    return res.json(timeline);
  } catch (error) {
    console.error('Error fetching timeline stats:', error);
    return res.status(500).json({
      error: 'Error al obtener estadísticas temporales'
    });
  }
});

// Obtener estadísticas en tiempo real
router.get('/realtime', (_req, res) => {
  try {
    const realtimeStats = {
      cpu: Math.floor(Math.random() * 30) + 10,
      memory: Math.floor(Math.random() * 40) + 30,
      activeScans: Math.floor(Math.random() * 5),
      queuedScans: Math.floor(Math.random() * 3),
      uptime: process.uptime(),
      responseTime: Math.floor(Math.random() * 100) + 50
    };

    return res.json(realtimeStats);
  } catch (error) {
    console.error('Error fetching realtime stats:', error);
    return res.status(500).json({
      error: 'Error al obtener estadísticas en tiempo real'
    });
  }
});

// Obtener targets más consultados
router.get('/targets', (_req, res) => {
  try {
    const targets = [
      {
        target: '8.8.8.8',
        count: 15,
        lastQueried: new Date().toISOString(),
        tools: ['ip-lookup', 'dns-lookup']
      },
      {
        target: 'google.com',
        count: 12,
        lastQueried: new Date().toISOString(),
        tools: ['whois', 'dns-lookup', 'subdomain-scanner']
      },
      {
        target: 'github.com',
        count: 8,
        lastQueried: new Date().toISOString(),
        tools: ['whois', 'subdomain-scanner']
      }
    ];

    return res.json(targets);
  } catch (error) {
    console.error('Error fetching target stats:', error);
    return res.status(500).json({
      error: 'Error al obtener estadísticas de targets'
    });
  }
});

export default router;