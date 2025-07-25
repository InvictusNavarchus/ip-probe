import { IPAnalysisController } from '@/controllers/ipAnalysisController';
import { Router } from 'express';

const router = Router();

// Get current IP analysis
router.get('/', IPAnalysisController.getCurrentIP);

// Get detailed network analysis
router.get('/detailed', IPAnalysisController.getDetailedAnalysis);

// Analyze a specific IP address
router.get('/analyze', IPAnalysisController.analyzeSpecificIP);

// Calculate subnet information
router.get('/subnet', IPAnalysisController.calculateSubnet);

// Get IP classification
router.get('/classify', IPAnalysisController.getIPClassification);

export { router as ipAnalysisRoutes };
