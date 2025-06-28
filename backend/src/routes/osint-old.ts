import express from 'express';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import { OSINTRequest, OSINTResponse, OSINT_TOOLS } from '../types/osint';
import { logger, io } from '../server';

const router = express.Router();

// Store de scans activos (en producción usaríamos Redis o DB)
const activeScans = new Map<string, OSINTResponse>();
const scanHistory: OSINTResponse[] = [];

// Obtener todas las herramientas disponibles
router.get('/tools', (_req, res) => {
  try {
    res.json({
      success: true,
      tools: OSINT_TOOLS,
      count: OSINT_TOOLS.length
    });
  } catch (error) {
    logger.error('Error fetching tools:', error);
    res.status(500).json({
      success: false,
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
        success: false,
        error: 'Herramienta no encontrada'
      });
    }
    return res.json({
      success: true,
      tool
    });
  } catch (error) {
    logger.error('Error fetching tool:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener información de la herramienta'
    });
  }
});

// Ejecutar scan OSINT
router.post('/scan', async (req, res) => {
  try {
    const { tool, target, options = {} }: OSINTRequest = req.body;

    // Validar herramienta
    const toolConfig = OSINT_TOOLS.find(t => t.id === tool);
    if (!toolConfig) {
      return res.status(400).json({
        success: false,
        error: 'Herramienta no válida'
      });
    }

    // Validar target
    if (!target || target.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Target es requerido'
      });
    }

    const scanId = uuidv4();
    const scanResponse: OSINTResponse = {
      id: scanId,
      tool,
      target: target.trim(),
      status: 'pending',
      startTime: new Date()
    };

    activeScans.set(scanId, scanResponse);

    // Responder inmediatamente con el ID del scan
    res.json({
      success: true,
      scanId,
      message: 'Scan iniciado',
      estimatedTime: toolConfig.estimatedTime
    });

    // Ejecutar el scan de forma asíncrona
    executeOSINTScan(scanId, toolConfig, target, options);

  } catch (error) {
    logger.error('Error starting scan:', error);
    res.status(500).json({
      success: false,
      error: 'Error al iniciar el scan'
    });
  }
});

// Obtener estado de un scan
router.get('/scan/:scanId', (req, res) => {
  try {
    const scanId = req.params.scanId;
    const scan = activeScans.get(scanId) || 
                scanHistory.find(s => s.id === scanId);

    if (!scan) {
      return res.status(404).json({
        success: false,
        error: 'Scan no encontrado'
      });
    }

    res.json({
      success: true,
      scan
    });
  } catch (error) {
    logger.error('Error fetching scan:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estado del scan'
    });
  }
});

// Obtener historial de scans
router.get('/history', (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const tool = req.query.tool as string;

    let history = [...scanHistory];
    
    // Filtrar por herramienta si se especifica
    if (tool) {
      history = history.filter(scan => scan.tool === tool);
    }

    // Ordenar por fecha (más reciente primero)
    history.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    // Paginación
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedHistory = history.slice(start, end);

    res.json({
      success: true,
      scans: paginatedHistory,
      pagination: {
        page,
        limit,
        total: history.length,
        pages: Math.ceil(history.length / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener historial'
    });
  }
});

// Cancelar un scan activo
router.delete('/scan/:scanId', (req, res) => {
  try {
    const scanId = req.params.scanId;
    const scan = activeScans.get(scanId);

    if (!scan) {
      return res.status(404).json({
        success: false,
        error: 'Scan no encontrado o ya completado'
      });
    }

    // Marcar como cancelado
    scan.status = 'error';
    scan.error = 'Cancelado por el usuario';
    scan.endTime = new Date();
    scan.duration = scan.endTime.getTime() - scan.startTime.getTime();

    // Mover al historial
    scanHistory.push(scan);
    activeScans.delete(scanId);

    // Notificar via WebSocket
    io.emit('scan-cancelled', { scanId, scan });

    res.json({
      success: true,
      message: 'Scan cancelado'
    });
  } catch (error) {
    logger.error('Error cancelling scan:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cancelar el scan'
    });
  }
});

// Función para ejecutar el scan OSINT
async function executeOSINTScan(scanId: string, toolConfig: any, target: string, options: any) {
  const scan = activeScans.get(scanId);
  if (!scan) return;

  try {
    // Actualizar estado a running
    scan.status = 'running';
    io.emit('scan-update', { scanId, scan });

    logger.info(`Ejecutando ${toolConfig.name} para target: ${target}`);

    // Construir comando infoooze
    const command = 'infoooze';
    const args = [toolConfig.flag, target];

    // Ejecutar comando
    const results = await runInfooozeCommand(command, args, scanId);

    // Actualizar scan con resultados
    scan.status = 'completed';
    scan.endTime = new Date();
    scan.duration = scan.endTime.getTime() - scan.startTime.getTime();
    scan.results = results;

    // Intentar leer archivo de resultados
    try {
      const outputFile = await findResultFile(target, toolConfig.id);
      if (outputFile) {
        scan.outputFile = outputFile;
        const fileContent = await fs.readFile(outputFile, 'utf-8');
        scan.results = {
          ...scan.results,
          fileContent: fileContent
        };
      }
    } catch (fileError) {
      logger.warn(`No se pudo leer archivo de resultados: ${fileError}`);
    }

    logger.info(`Scan ${scanId} completado exitosamente`);

  } catch (error) {
    logger.error(`Error en scan ${scanId}:`, error);
    scan.status = 'error';
    scan.endTime = new Date();
    scan.duration = scan.endTime.getTime() - scan.startTime.getTime();
    scan.error = error instanceof Error ? error.message : 'Error desconocido';
  } finally {
    // Mover al historial y limpiar scan activo
    scanHistory.push(scan);
    activeScans.delete(scanId);

    // Notificar via WebSocket
    io.emit('scan-complete', { scanId, scan });

    // Limpiar historial antiguo (mantener últimos 100)
    if (scanHistory.length > 100) {
      scanHistory.splice(0, scanHistory.length - 100);
    }
  }
}

// Función para ejecutar comando infoooze
function runInfooozeCommand(command: string, args: string[], scanId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      
      // Emitir progreso en tiempo real
      io.emit('scan-progress', {
        scanId,
        type: 'stdout',
        data: chunk
      });
    });

    process.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      
      io.emit('scan-progress', {
        scanId,
        type: 'stderr',
        data: chunk
      });
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code
        });
      } else {
        reject(new Error(`Comando falló con código ${code}. Error: ${stderr}`));
      }
    });

    process.on('error', (error) => {
      reject(new Error(`Error ejecutando comando: ${error.message}`));
    });

    // Timeout de 5 minutos
    setTimeout(() => {
      if (!process.killed) {
        process.kill();
        reject(new Error('Timeout: El comando tardó más de 5 minutos'));
      }
    }, 5 * 60 * 1000);
  });
}

// Función para encontrar archivo de resultados
async function findResultFile(target: string, toolId: string): Promise<string | null> {
  const possibleDirs = [
    '/home/ubuntuser/myproject/results',
    '/home/ubuntuser/myproject/fase2/results',
    process.cwd() + '/results'
  ];

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  for (const dir of possibleDirs) {
    try {
      const files = await fs.readdir(dir);
      
      // Buscar archivos que coincidan con el patrón
      const matchingFile = files.find(file => 
        file.includes('infoooze') &&
        file.includes(dateStr) &&
        (file.includes(target.replace(/\./g, '')) || 
         file.includes(toolId))
      );

      if (matchingFile) {
        return path.join(dir, matchingFile);
      }
    } catch (error) {
      // Directorio no existe o no es accesible
      continue;
    }
  }

  return null;
}

export default router;