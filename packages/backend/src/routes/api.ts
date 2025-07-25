import { Router } from 'express';
import { ipAnalysisRoutes } from './ipAnalysis';

const router = Router();

// API version and info
router.get('/', (_req, res) => {
  res.json({
    name: 'IP Probe API',
    version: '1.0.0',
    description: 'Privacy-focused network and IP analysis API',
    endpoints: {
      health: '/health',
      ipAnalysis: '/api/ip',
      networkAnalysis: '/api/network'
    },
    features: [
      'Multi-source IP detection',
      'Privacy-first geolocation',
      'Network security assessment',
      'Real-time analysis',
      'No external dependencies'
    ],
    timestamp: new Date().toISOString()
  });
});

// Mount route modules
router.use('/ip', ipAnalysisRoutes);

export { router as apiRoutes };
