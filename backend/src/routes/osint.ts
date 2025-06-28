import express from 'express';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { OSINTRequest, OSINTResponse, OSINT_TOOLS } from '../types/osint';

const router = express.Router();

// Store de scans activos (en producción usaríamos Redis o DB)
const activeScans = new Map<string, OSINTResponse>();
const scanHistory: OSINTResponse[] = [];

// Obtener todas las herramientas disponibles
router.get('/tools', (req, res) => {
  try {
    let filteredTools = OSINT_TOOLS;

    // Aplicar filtros
    const search = req.query.search as string;
    const category = req.query.category as string;
    const risk = req.query.risk as string;

    if (search) {
      filteredTools = filteredTools.filter(tool => 
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category) {
      filteredTools = filteredTools.filter(tool => tool.category === category);
    }

    if (risk) {
      filteredTools = filteredTools.filter(tool => tool.riskLevel === risk);
    }

    return res.json(filteredTools);
  } catch (error) {
    console.error('Error fetching tools:', error);
    return res.status(500).json({
      error: 'Error al obtener herramientas'
    });
  }
});

// Obtener información de una herramienta específica
router.get('/tools/:toolId', (req, res) => {
  try {
    const tool = OSINT_TOOLS.find(t => t.id === req.params.toolId);
    if (!tool) {
      return res.status(404).json({
        error: 'Tool not found'
      });
    }
    return res.json(tool);
  } catch (error) {
    console.error('Error fetching tool:', error);
    return res.status(500).json({
      error: 'Error al obtener información de la herramienta'
    });
  }
});

// Iniciar un nuevo scan OSINT
router.post('/scan', async (req, res) => {
  try {
    const { tool, target, options = {} } = req.body as OSINTRequest;

    if (!tool || !target) {
      return res.status(400).json({
        error: 'Tool and target are required'
      });
    }

    // Verificar que la herramienta existe
    const osintTool = OSINT_TOOLS.find(t => t.id === tool);
    if (!osintTool) {
      return res.status(400).json({
        error: 'Invalid tool'
      });
    }

    const scanId = uuidv4();
    const scanResponse: OSINTResponse = {
      id: scanId,
      tool,
      target,
      status: 'running',
      startTime: new Date(),
      results: null,
      error: undefined
    };

    activeScans.set(scanId, scanResponse);

    // Simular ejecución de herramienta OSINT
    setTimeout(() => {
      const scan = activeScans.get(scanId);
      if (scan) {
        scan.status = 'completed';
        scan.endTime = new Date();
        scan.duration = scan.endTime.getTime() - scan.startTime.getTime();
        scan.results = {
          tool: tool,
          target: target,
          data: `Mock results for ${tool} on ${target}`,
          timestamp: new Date().toISOString()
        };
        scanHistory.push(scan);
        activeScans.delete(scanId);
      }
    }, 2000);

    return res.json({
      scanId,
      status: 'running',
      message: 'Scan started successfully'
    });
  } catch (error) {
    console.error('Error starting scan:', error);
    return res.status(500).json({
      error: 'Error al iniciar scan'
    });
  }
});

// Obtener estado de un scan específico
router.get('/scan/:scanId', (req, res) => {
  try {
    const scanId = req.params.scanId;
    
    // Buscar en scans activos
    const activeScan = activeScans.get(scanId);
    if (activeScan) {
      return res.json(activeScan);
    }

    // Buscar en historial
    const historicalScan = scanHistory.find(s => s.id === scanId);
    if (historicalScan) {
      return res.json(historicalScan);
    }

    return res.status(404).json({
      error: 'Scan not found'
    });
  } catch (error) {
    console.error('Error fetching scan:', error);
    return res.status(500).json({
      error: 'Error al obtener estado del scan'
    });
  }
});

// Cancelar un scan
router.delete('/scan/:scanId', (req, res) => {
  try {
    const scanId = req.params.scanId;
    
    const scan = activeScans.get(scanId);
    if (!scan) {
      return res.status(404).json({
        error: 'Scan not found'
      });
    }

    scan.status = 'error';
    scan.error = 'Cancelled by user';
    scan.endTime = new Date();
    scanHistory.push(scan);
    activeScans.delete(scanId);

    return res.json({
      message: 'Scan cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling scan:', error);
    return res.status(500).json({
      error: 'Error al cancelar scan'
    });
  }
});

// Obtener historial de scans
router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const tool = req.query.tool as string;

    let filteredHistory = [...scanHistory];

    if (tool) {
      filteredHistory = filteredHistory.filter(scan => scan.tool === tool);
    }

    filteredHistory.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    return res.json(filteredHistory.slice(0, limit));
  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({
      error: 'Error al obtener historial'
    });
  }
});

export default router;