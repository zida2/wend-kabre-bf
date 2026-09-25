import { NextResponse } from 'next/server';
import { DataQualityMonitor } from '@/lib/dataQualityMonitor';

// Instance globale du moniteur (en production, utiliser Redis ou base de données)
let qualityMonitor = null;

function getMonitor() {
  if (!qualityMonitor) {
    qualityMonitor = new DataQualityMonitor();
  }
  return qualityMonitor;
}

/**
 * GET /api/data-quality/metrics
 * Retourne les métriques actuelles de qualité des données
 */
export async function GET(request) {
  try {
    const monitor = getMonitor();
    const { searchParams } = new URL(request.url);
    
    const includeReport = searchParams.get('includeReport') === 'true';
    const reportDays = parseInt(searchParams.get('reportDays') || '7');

    const metrics = monitor.getCurrentMetrics();
    const alerts = monitor.getActiveAlerts();
    
    const response = {
      success: true,
      data: {
        metrics,
        alerts,
        timestamp: new Date().toISOString()
      }
    };
    
    if (includeReport) {
      response.data.report = monitor.generateQualityReport(reportDays);
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      message: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/data-quality/metrics/process
 * Traite un nouveau contenu et retourne les métriques mises à jour
 */
export async function POST(request) {
  try {
    const monitor = getMonitor();
    const content = await request.json();
    
    // Validation des données requises
    if (!content.title && !content.description) {
      return NextResponse.json({
        success: false,
        error: 'Données manquantes',
        message: 'Le titre ou la description est requis'
      }, { status: 400 });
    }
    
    const result = monitor.processContent(content);
    
    return NextResponse.json({
      success: true,
      data: {
        classification: result.classification,
        metrics: result.metrics,
        alerts: result.alerts,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Erreur lors du traitement du contenu:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erreur de traitement',
      message: error.message
    }, { status: 500 });
  }
}