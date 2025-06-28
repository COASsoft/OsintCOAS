const http = require('http');
const https = require('https');
const url = require('url');

// Moralis API configuration
const MORALIS_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImYwYTI4NzUzLTdiZWYtNDcxMS05YzI5LTQ4NjBlNmIwNTMxYiIsIm9yZ0lkIjoiNDU1ODcyIiwidXNlcklkIjoiNDY5MDM0IiwidHlwZUlkIjoiMmFlNjgyZGYtOTYyMS00OWRiLTlhYTctZDg4MWE1Yzc5Y2MyIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTA5Mjk0ODIsImV4cCI6NDkwNjY4OTQ4Mn0.iYVJQD2laeam7rS4yd3tS10Q0hDz7bEF_2_4kMdhD80';
const MORALIS_BASE_URL = 'deep-index.moralis.io';

// Function to make Moralis API calls
const makeMoralisRequest = (endpoint, params = {}) => {
  return new Promise((resolve, reject) => {
    const queryString = new URLSearchParams(params).toString();
    const fullPath = `/api/v2.2${endpoint}${queryString ? '?' + queryString : ''}`;
    
    const options = {
      hostname: MORALIS_BASE_URL,
      port: 443,
      path: fullPath,
      method: 'GET',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
};

// Function to get ETH balance
const getEthBalance = async (address) => {
  try {
    const response = await makeMoralisRequest(`/${address}/balance`, { chain: 'eth' });
    return response.balance || '0';
  } catch (error) {
    console.error('Error getting ETH balance:', error);
    return '0';
  }
};

// Function to get ERC-20 tokens
const getTokenBalances = async (address) => {
  try {
    const response = await makeMoralisRequest(`/${address}/erc20`, { 
      chain: 'eth',
      token_addresses: []
    });
    return response || [];
  } catch (error) {
    console.error('Error getting token balances:', error);
    return [];
  }
};

// Function to get recent transactions
const getRecentTransactions = async (address) => {
  try {
    const response = await makeMoralisRequest(`/${address}`, { 
      chain: 'eth',
      limit: 10
    });
    return response.result || [];
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
};

// Function to convert Wei to ETH
const weiToEth = (wei) => {
  return (parseInt(wei) / 1e18).toFixed(6);
};

// Function to get real crypto data using Moralis
const getRealCryptoData = async (address) => {
  try {
    console.log(`🔍 Getting real crypto data for address: ${address}`);
    
    // Get ETH balance
    const ethBalanceWei = await getEthBalance(address);
    const ethBalance = weiToEth(ethBalanceWei);
    
    // Get ERC-20 tokens
    const tokens = await getTokenBalances(address);
    
    // Get recent transactions
    const transactions = await getRecentTransactions(address);
    
    // Calculate USD values (using approximate prices)
    const ethPriceUSD = 3800; // Approximate ETH price
    const ethBalanceUSD = (parseFloat(ethBalance) * ethPriceUSD).toFixed(2);
    
    // Process tokens with USD values
    const processedTokens = Array.isArray(tokens) ? tokens.slice(0, 10).map(token => {
      const balance = token.balance ? (parseInt(token.balance) / Math.pow(10, token.decimals || 18)) : 0;
      return {
        name: token.name || 'Unknown Token',
        symbol: token.symbol || 'UNK',
        balance: balance.toFixed(6),
        network: 'Ethereum',
        contractAddress: token.token_address,
        decimals: token.decimals || 18
      };
    }) : [];
    
    // Process recent transactions
    const recentTx = Array.isArray(transactions) ? transactions.slice(0, 5).map(tx => ({
      hash: tx.hash,
      from: tx.from_address,
      to: tx.to_address,
      value: weiToEth(tx.value),
      timestamp: tx.block_timestamp,
      network: 'Ethereum',
      type: tx.to_address?.toLowerCase() === address.toLowerCase() ? 'received' : 'sent'
    })) : [];
    
    console.log(`✅ Real crypto data retrieved: ${ethBalance} ETH (${ethBalanceUSD} USD), ${processedTokens.length} tokens`);
    
    return {
      address: address,
      networks: [
        {
          name: 'Ethereum',
          symbol: 'ETH',
          balance: ethBalance,
          balanceUSD: ethBalanceUSD,
          transactions: transactions.length,
          firstTransaction: transactions.length > 0 ? transactions[transactions.length - 1]?.block_timestamp : null,
          lastTransaction: transactions.length > 0 ? transactions[0]?.block_timestamp : null
        },
        // Mock Bitcoin data (since we don't have Bitcoin API)
        {
          name: 'Bitcoin',
          symbol: 'BTC',
          balance: (Math.random() * 5 + 0.1).toFixed(8),
          balanceUSD: (Math.random() * 300000 + 5000).toFixed(2),
          transactions: Math.floor(Math.random() * 500) + 25,
          firstTransaction: '2021-03-15',
          lastTransaction: '2025-06-22'
        }
      ],
      totalValueUSD: (parseFloat(ethBalanceUSD) + Math.random() * 100000 + 10000).toFixed(2),
      tokens: processedTokens,
      recentTransactions: recentTx,
      riskAnalysis: {
        riskScore: Math.floor(Math.random() * 50) + 10, // Lower risk for real data
        flags: transactions.length > 100 ? ['High Transaction Volume'] : ['Normal Activity'],
        sanctions: false,
        exchanges: ['Coinbase', 'Binance'].filter(() => Math.random() > 0.7),
        mixers: []
      },
      metadata: {
        addressType: 'Standard',
        creation: transactions.length > 0 ? transactions[transactions.length - 1]?.block_timestamp : null,
        lastActivity: transactions.length > 0 ? transactions[0]?.block_timestamp : null,
        labels: ['Real Wallet'],
        dataSource: 'Moralis API'
      }
    };
  } catch (error) {
    console.error('❌ Error getting real crypto data:', error);
    // Fallback to mock data if API fails
    return null;
  }
};

// Mock data para las 18 herramientas OSINT
const OSINT_TOOLS = [
  {
    id: 'whois',
    name: 'Whois Lookup',
    description: 'Obtener información de registro de dominios',
    category: 'domain',
    riskLevel: 'low',
    estimatedTime: 5,
    requiredParams: ['domain']
  },
  {
    id: 'ip-lookup',
    name: 'IP Lookup',
    description: 'Geolocalización y información de direcciones IP',
    category: 'network',
    riskLevel: 'low',
    estimatedTime: 3,
    requiredParams: ['ip']
  },
  {
    id: 'dns-lookup',
    name: 'DNS Lookup',
    description: 'Consulta de registros DNS completos',
    category: 'network',
    riskLevel: 'low',
    estimatedTime: 4,
    requiredParams: ['domain']
  },
  {
    id: 'domain-age',
    name: 'Domain Age',
    description: 'Verificar la antigüedad de un dominio',
    category: 'domain',
    riskLevel: 'low',
    estimatedTime: 3,
    requiredParams: ['domain']
  },
  {
    id: 'header-info',
    name: 'Header Information',
    description: 'Análisis de headers HTTP del sitio web',
    category: 'network',
    riskLevel: 'low',
    estimatedTime: 5,
    requiredParams: ['url']
  },
  {
    id: 'subdomain-scanner',
    name: 'Subdomain Scanner',
    description: 'Enumeración de subdominios',
    category: 'domain',
    riskLevel: 'medium',
    estimatedTime: 30,
    requiredParams: ['domain']
  },
  {
    id: 'port-scanner',
    name: 'Port Scanner',
    description: 'Escaneo de puertos abiertos',
    category: 'network',
    riskLevel: 'high',
    estimatedTime: 60,
    requiredParams: ['ip', 'ports']
  },
  {
    id: 'user-recon',
    name: 'User Reconnaissance',
    description: 'Búsqueda de usuario en múltiples plataformas',
    category: 'social',
    riskLevel: 'medium',
    estimatedTime: 20,
    requiredParams: ['username']
  },
  {
    id: 'mail-finder',
    name: 'Email Finder',
    description: 'Búsqueda de direcciones de correo',
    category: 'social',
    riskLevel: 'medium',
    estimatedTime: 15,
    requiredParams: ['domain']
  },
  {
    id: 'url-scanner',
    name: 'URL Scanner',
    description: 'Análisis de URLs sospechosas',
    category: 'network',
    riskLevel: 'low',
    estimatedTime: 10,
    requiredParams: ['url']
  },
  {
    id: 'exif-metadata',
    name: 'EXIF Metadata',
    description: 'Extracción de metadatos de imágenes',
    category: 'file',
    riskLevel: 'low',
    estimatedTime: 2,
    requiredParams: ['image_url']
  },
  {
    id: 'useragent-lookup',
    name: 'User Agent Lookup',
    description: 'Identificación de navegadores y dispositivos',
    category: 'misc',
    riskLevel: 'low',
    estimatedTime: 1,
    requiredParams: ['user_agent']
  },
  {
    id: 'git-recon',
    name: 'Git Reconnaissance',
    description: 'Reconocimiento de repositorios GitHub',
    category: 'social',
    riskLevel: 'low',
    estimatedTime: 10,
    requiredParams: ['username']
  },
  {
    id: 'url-expander',
    name: 'URL Expander',
    description: 'Expansión de URLs acortadas',
    category: 'network',
    riskLevel: 'low',
    estimatedTime: 3,
    requiredParams: ['short_url']
  },
  {
    id: 'youtube-lookup',
    name: 'YouTube Lookup',
    description: 'Metadatos de videos de YouTube',
    category: 'social',
    riskLevel: 'low',
    estimatedTime: 5,
    requiredParams: ['video_url']
  },
  {
    id: 'instagram-recon',
    name: 'Instagram Reconnaissance',
    description: 'Análisis completo de perfiles, posts y engagement',
    category: 'social',
    riskLevel: 'medium',
    estimatedTime: 8,
    requiredParams: ['username']
  },
  {
    id: 'twitter-recon',
    name: 'Twitter/X Reconnaissance',
    description: 'Análisis de tweets, followers y actividad',
    category: 'social',
    riskLevel: 'low',
    estimatedTime: 6,
    requiredParams: ['username']
  },
  {
    id: 'linkedin-osint',
    name: 'LinkedIn OSINT',
    description: 'Información profesional, conexiones y empresa',
    category: 'social',
    riskLevel: 'medium',
    estimatedTime: 12,
    requiredParams: ['profile']
  },
  {
    id: 'facebook-search',
    name: 'Facebook Search',
    description: 'Búsqueda de perfiles y páginas públicas',
    category: 'social',
    riskLevel: 'medium',
    estimatedTime: 10,
    requiredParams: ['name']
  },
  {
    id: 'tiktok-analyzer',
    name: 'TikTok Analyzer',
    description: 'Análisis de perfiles y videos virales',
    category: 'social',
    riskLevel: 'low',
    estimatedTime: 7,
    requiredParams: ['username']
  },
  {
    id: 'youtube-channel',
    name: 'YouTube Channel Analyzer',
    description: 'Estadísticas de canal y análisis de videos',
    category: 'social',
    riskLevel: 'low',
    estimatedTime: 9,
    requiredParams: ['channel']
  },
  {
    id: 'reddit-investigator',
    name: 'Reddit Investigator',
    description: 'Historial de posts y comentarios',
    category: 'social',
    riskLevel: 'low',
    estimatedTime: 8,
    requiredParams: ['username']
  },
  {
    id: 'github-recon',
    name: 'GitHub Reconnaissance',
    description: 'Repositorios, commits y actividad de desarrollo',
    category: 'social',
    riskLevel: 'low',
    estimatedTime: 8,
    requiredParams: ['username']
  },
  {
    id: 'shodan-search',
    name: 'Shodan Search Engine',
    description: 'Buscar dispositivos IoT expuestos',
    category: 'network',
    riskLevel: 'medium',
    estimatedTime: 7,
    requiredParams: ['query']
  },
  {
    id: 'google-dorks',
    name: 'Google Dorks Scanner',
    description: 'Búsquedas avanzadas para encontrar información',
    category: 'misc',
    riskLevel: 'low',
    estimatedTime: 10,
    requiredParams: ['target']
  },
  {
    id: 'wayback-machine',
    name: 'Wayback Machine',
    description: 'Historial de versiones de sitios web',
    category: 'misc',
    riskLevel: 'low',
    estimatedTime: 6,
    requiredParams: ['url']
  },
  {
    id: 'breach-check',
    name: 'Data Breach Checker',
    description: 'Verificar si credenciales fueron filtradas',
    category: 'misc',
    riskLevel: 'low',
    estimatedTime: 4,
    requiredParams: ['email']
  },
  {
    id: 'darkweb-monitor',
    name: 'Dark Web Monitor',
    description: 'Buscar menciones en la dark web',
    category: 'misc',
    riskLevel: 'high',
    estimatedTime: 25,
    requiredParams: ['keyword']
  },
  {
    id: 'reverse-image',
    name: 'Reverse Image Search',
    description: 'Buscar origen y copias de imágenes',
    category: 'file',
    riskLevel: 'low',
    estimatedTime: 10,
    requiredParams: ['image']
  },
  {
    id: 'phone-lookup',
    name: 'Phone Number OSINT',
    description: 'Información de operador y ubicación',
    category: 'misc',
    riskLevel: 'medium',
    estimatedTime: 5,
    requiredParams: ['phone']
  },
  {
    id: 'username-checker',
    name: 'Username Availability',
    description: 'Verificar disponibilidad en 500+ sitios',
    category: 'social',
    riskLevel: 'low',
    estimatedTime: 15,
    requiredParams: ['username']
  },
  {
    id: 'cryptocurrency-trace',
    name: 'Cryptocurrency Tracer',
    description: 'Rastrear transacciones blockchain',
    category: 'misc',
    riskLevel: 'low',
    estimatedTime: 12,
    requiredParams: ['address']
  },
  {
    id: 'company-profile',
    name: 'Company Intelligence',
    description: 'Información corporativa y empleados',
    category: 'misc',
    riskLevel: 'low',
    estimatedTime: 12,
    requiredParams: ['company']
  },
  {
    id: 'linkedin-recon',
    name: 'LinkedIn Reconnaissance',
    description: 'Información profesional de LinkedIn',
    category: 'social',
    riskLevel: 'medium',
    estimatedTime: 12,
    requiredParams: ['username']
  }
];

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const query = parsedUrl.query;

  res.setHeader('Content-Type', 'application/json');

  // Health check
  if (path === '/api/health') {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.0.0',
      service: 'infoooze-backend',
      toolsCount: OSINT_TOOLS.length
    };
    res.writeHead(200);
    res.end(JSON.stringify(healthData, null, 2));
    return;
  }

  // Root endpoint
  if (path === '/') {
    const rootData = {
      message: 'Infoooze Web Platform API v2.0',
      status: 'running',
      endpoints: {
        health: '/api/health',
        osint: '/api/osint/tools',
        stats: '/api/stats/overview'
      },
      toolsAvailable: OSINT_TOOLS.length
    };
    res.writeHead(200);
    res.end(JSON.stringify(rootData, null, 2));
    return;
  }

  // OSINT Tools
  if (path === '/api/osint/tools') {
    let filteredTools = OSINT_TOOLS;

    // Aplicar filtros
    if (query.search) {
      const search = query.search.toLowerCase();
      filteredTools = filteredTools.filter(tool => 
        tool.name.toLowerCase().includes(search) || 
        tool.description.toLowerCase().includes(search)
      );
    }

    if (query.category) {
      filteredTools = filteredTools.filter(tool => tool.category === query.category);
    }

    if (query.risk) {
      filteredTools = filteredTools.filter(tool => tool.riskLevel === query.risk);
    }

    res.writeHead(200);
    res.end(JSON.stringify(filteredTools, null, 2));
    return;
  }

  // Tool específica
  if (path.startsWith('/api/osint/tools/')) {
    const toolId = path.split('/').pop();
    const tool = OSINT_TOOLS.find(t => t.id === toolId);
    
    if (!tool) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Tool not found' }));
      return;
    }
    
    res.writeHead(200);
    res.end(JSON.stringify(tool, null, 2));
    return;
  }

  // Stats overview
  if (path === '/api/stats/overview') {
    const statsData = {
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
    res.writeHead(200);
    res.end(JSON.stringify(statsData, null, 2));
    return;
  }

  // Activity
  if (path === '/api/stats/activity') {
    const activityData = [
      {
        id: '1',
        tool: 'ip-lookup',
        target: '8.8.8.8',
        status: 'completed',
        timestamp: new Date().toISOString(),
        duration: 2.1
      },
      {
        id: '2',
        tool: 'whois',
        target: 'google.com',
        status: 'running',
        timestamp: new Date().toISOString(),
        duration: null
      },
      {
        id: '3',
        tool: 'dns-lookup',
        target: 'github.com',
        status: 'completed',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        duration: 1.8
      }
    ];
    res.writeHead(200);
    res.end(JSON.stringify(activityData, null, 2));
    return;
  }

  // Crypto data endpoint (enhanced mock with realistic values)
  if (path === '/api/crypto/analyze' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { address } = JSON.parse(body);
        
        if (!address) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Address is required' }));
          return;
        }
        
        console.log(`🔍 Enhanced crypto analysis requested for: ${address}`);
        
        // Generate realistic data based on the actual address for demo
        const isRichWallet = address.toLowerCase() === '0x9696f59e4d72e237be84ffd425dcad154bf96976';
        
        const enhancedData = {
          address: address,
          networks: [
            {
              name: 'Ethereum',
              symbol: 'ETH',
              balance: isRichWallet ? '23.817055781740059' : (Math.random() * 50 + 0.5).toFixed(6),
              balanceUSD: isRichWallet ? '90,503,912.47' : (Math.random() * 200000 + 500).toFixed(2),
              transactions: isRichWallet ? 1247 : Math.floor(Math.random() * 500) + 25,
              firstTransaction: '2021-05-20',
              lastTransaction: '2025-06-22'
            },
            {
              name: 'Bitcoin',
              symbol: 'BTC',
              balance: isRichWallet ? '156.89234567' : (Math.random() * 5 + 0.1).toFixed(8),
              balanceUSD: isRichWallet ? '15,234,876.32' : (Math.random() * 300000 + 5000).toFixed(2),
              transactions: isRichWallet ? 892 : Math.floor(Math.random() * 300) + 15,
              firstTransaction: '2020-11-15',
              lastTransaction: '2025-06-20'
            },
            {
              name: 'Binance Smart Chain',
              symbol: 'BNB',
              balance: isRichWallet ? '2341.5634' : (Math.random() * 100 + 1).toFixed(4),
              balanceUSD: isRichWallet ? '1,423,891.22' : (Math.random() * 50000 + 100).toFixed(2),
              transactions: isRichWallet ? 567 : Math.floor(Math.random() * 200) + 10,
              firstTransaction: '2021-08-10',
              lastTransaction: '2025-06-21'
            }
          ],
          totalValueUSD: isRichWallet ? '107,162,680.01' : (Math.random() * 750000 + 10000).toFixed(2),
          tokens: isRichWallet ? [
            {
              name: 'Tether USD',
              symbol: 'USDT',
              balance: '8,934,567.234567',
              network: 'Ethereum',
              contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
              decimals: 6
            },
            {
              name: 'USD Coin',
              symbol: 'USDC',
              balance: '4,123,890.567890',
              network: 'Ethereum',
              contractAddress: '0xA0b86a33E6c3E7c8D12A5E8A91d24f3A6dE64dF8',
              decimals: 6
            },
            {
              name: 'Chainlink',
              symbol: 'LINK',
              balance: '234,567.123456',
              network: 'Ethereum',
              contractAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
              decimals: 18
            },
            {
              name: 'Uniswap',
              symbol: 'UNI',
              balance: '89,234.567890',
              network: 'Ethereum',
              contractAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
              decimals: 18
            }
          ] : [
            {
              name: 'Tether USD',
              symbol: 'USDT',
              balance: (Math.random() * 10000 + 100).toFixed(2),
              network: 'Ethereum',
              contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
              decimals: 6
            }
          ],
          recentTransactions: isRichWallet ? [
            {
              hash: '0xa1b2c3d4e5f6789...abc123def456',
              from: '0x123...abc',
              to: address,
              value: '12.567890123456',
              timestamp: '2025-06-24T10:30:00Z',
              network: 'Ethereum',
              type: 'received'
            },
            {
              hash: '0xb2c3d4e5f6789a...bcd234efa567',
              from: address,
              to: '0x456...def',
              value: '5.123456789012',
              timestamp: '2025-06-23T15:45:00Z',
              network: 'Ethereum',
              type: 'sent'
            },
            {
              hash: '0xc3d4e5f6789ab...cde345feb678',
              from: '0x789...ghi',
              to: address,
              value: '0.892345678901',
              timestamp: '2025-06-22T09:15:00Z',
              network: 'Bitcoin',
              type: 'received'
            }
          ] : [
            {
              hash: '0xdef789...abc123',
              from: '0x123...abc',
              to: address,
              value: (Math.random() * 5 + 0.1).toFixed(6),
              timestamp: '2025-06-24T10:30:00Z',
              network: 'Ethereum',
              type: 'received'
            }
          ],
          riskAnalysis: {
            riskScore: isRichWallet ? 25 : Math.floor(Math.random() * 60) + 10,
            flags: isRichWallet ? ['High Net Worth', 'Multiple Networks', 'Large Token Holdings'] : ['Normal Activity'],
            sanctions: false,
            exchanges: isRichWallet ? ['Binance', 'Coinbase', 'Kraken'] : ['Coinbase'].filter(() => Math.random() > 0.6),
            mixers: []
          },
          metadata: {
            addressType: isRichWallet ? 'Multi-signature Wallet' : 'Standard',
            creation: '2021-03-15',
            lastActivity: '2025-06-24',
            labels: isRichWallet ? ['Whale Wallet', 'DeFi Active', 'Multi-chain'] : ['Standard Wallet'],
            dataSource: 'Enhanced Mock Data (Etherscan-style values)'
          }
        };
        
        console.log(`✅ Enhanced crypto data generated for ${address}: ${enhancedData.totalValueUSD} USD total`);
        
        res.writeHead(200);
        res.end(JSON.stringify(enhancedData, null, 2));
      } catch (error) {
        console.error('❌ Error processing crypto request:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    
    return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({
    error: 'Not Found',
    message: `Cannot ${req.method} ${path}`
  }));
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Infoooze Backend API v2.0 running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 OSINT Tools (${OSINT_TOOLS.length}): http://localhost:${PORT}/api/osint/tools`);
  console.log(`📈 Stats: http://localhost:${PORT}/api/stats/overview`);
  console.log(`✅ Backend ready for frontend connection`);
});