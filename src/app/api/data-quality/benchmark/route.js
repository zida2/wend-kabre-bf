import { NextResponse } from 'next/server';
import { DataBenchmark, BenchmarkSample, MANUAL_CLASSIFICATIONS } from '@/lib/dataBenchmark';

/**
 * POST /api/data-quality/benchmark
 * Exécute un benchmark de classification sur des données de test
 */
export async function POST(request) {
  try {
    const { samples } = await request.json();
    
    const benchmark = new DataBenchmark();
    
    // Si aucun échantillon fourni, utiliser les échantillons par défaut
    const testSamples = samples || getDefaultTestSamples();
    
    // Validation des échantillons
    if (!Array.isArray(testSamples) || testSamples.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Échantillons de test requis'
      }, { status: 400 });
    }
    
    // Ajout des échantillons au benchmark
    testSamples.forEach(sample => {
      const benchmarkSample = new BenchmarkSample(
        sample.id,
        sample.content,
        sample.manualClassification,
        sample.notes || ''
      );
      benchmark.addSample(benchmarkSample);
    });
    
    // Exécution du benchmark
    const results = await benchmark.runBenchmark();
    const report = benchmark.generateReport();
    
    return NextResponse.json({
      success: true,
      data: {
        results,
        report,
        executedAt: new Date().toISOString(),
        sampleCount: testSamples.length
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'exécution du benchmark:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de l\'exécution du benchmark',
      message: error.message
    }, { status: 500 });
  }
}

/**
 * Échantillons de test par défaut
 */
function getDefaultTestSamples() {
  return [
    {
      id: 'test-valid-1',
      content: {
        title: 'Appel d\'offres pour fourniture de matériel informatique',
        description: 'Acquisition d\'ordinateurs et équipements réseau pour le Ministère de la Santé',
        source: 'dgcmef.gov.bf',
        category: 'fourniture'
      },
      manualClassification: MANUAL_CLASSIFICATIONS.VALID,
      notes: 'Marché public standard'
    },
    {
      id: 'test-valid-2',
      content: {
        title: 'Travaux de construction d\'un centre de santé à Koudougou',
        description: 'Construction d\'un CSPS avec équipements médicaux de base',
        source: 'sante.gov.bf',
        category: 'travaux'
      },
      manualClassification: MANUAL_CLASSIFICATIONS.VALID,
      notes: 'Marché BTP santé'
    },
    {
      id: 'test-rejected-1',
      content: {
        title: 'Soutenance de thèse en médecine - Université Joseph Ki-Zerbo',
        description: 'Présentation des travaux sur les maladies tropicales',
        source: 'ujkz.bf',
        category: 'academique'
      },
      manualClassification: MANUAL_CLASSIFICATIONS.REJECTED,
      notes: 'Événement académique'
    },
    {
      id: 'test-rejected-2',
      content: {
        title: 'Communiqué du Conseil des Ministres',
        description: 'Décisions prises lors de la session extraordinaire',
        source: 'gouvernement.gov.bf',
        category: 'communication'
      },
      manualClassification: MANUAL_CLASSIFICATIONS.REJECTED,
      notes: 'Communication officielle'
    },
    {
      id: 'test-review-1',
      content: {
        title: 'Formation en gestion de projet pour les cadres',
        description: 'Session de formation de 5 jours sur les méthodes agiles',
        source: 'fonction-publique.gov.bf',
        category: 'formation'
      },
      manualClassification: MANUAL_CLASSIFICATIONS.REVIEW,
      notes: 'Formation = prestation mais mot-clé négatif'
    },
    {
      id: 'test-review-2',
      content: {
        title: 'Étude de faisabilité pour un pont',
        description: 'Mission d\'étude préalable à la construction',
        source: 'infrastructures.gov.bf',
        category: 'etude'
      },
      manualClassification: MANUAL_CLASSIFICATIONS.REVIEW,
      notes: 'Étude vs travaux - zone grise'
    }
  ];
}