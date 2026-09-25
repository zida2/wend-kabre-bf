import { NextResponse } from 'next/server';
import { DataQualityMonitor } from '@/lib/dataQualityMonitor';

// Instance partagée du moniteur
let qualityMonitor = null;

function getMonitor() {
  if (!qualityMonitor) {
    qualityMonitor = new DataQualityMonitor();
  }
  return qualityMonitor;
}

/**
 * GET /api/data-quality/alerts
 * Retourne toutes les alertes actives
 */
export async function GET() {
  try {
    const monitor = getMonitor();
    const alerts = monitor.getActiveAlerts();
    
    return NextResponse.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      message: error.message
    }, { status: 500 });
  }
}

/**
 * PATCH /api/data-quality/alerts/:id
 * Résout une alerte spécifique
 */
export async function PATCH(request) {
  try {
    const monitor = getMonitor();
    const { alertId } = await request.json();
    
    if (!alertId) {
      return NextResponse.json({
        success: false,
        error: 'ID d\'alerte requis'
      }, { status: 400 });
    }
    
    monitor.resolveAlert(alertId);
    
    return NextResponse.json({
      success: true,
      message: 'Alerte résolue avec succès',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erreur lors de la résolution de l\'alerte:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      message: error.message
    }, { status: 500 });
  }
}