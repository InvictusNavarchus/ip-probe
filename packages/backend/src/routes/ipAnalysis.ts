import { IPAnalysisController } from '@/controllers/ipAnalysisController';
import { Router } from 'express';

const router: Router = Router();

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

// Get comprehensive network analysis
router.get('/network', IPAnalysisController.getNetworkAnalysis);

// Compare two IP addresses
router.get('/compare', IPAnalysisController.compareIPs);

// Get network fingerprinting analysis
router.get('/fingerprint', IPAnalysisController.getNetworkFingerprint);

// Get DNS analysis
router.get('/dns', IPAnalysisController.getDNSAnalysis);

// Get comprehensive security assessment
router.get('/security', IPAnalysisController.getSecurityAssessment);

export { router as ipAnalysisRoutes };
