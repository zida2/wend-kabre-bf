'use client';

import { useState, useEffect } from 'react';
import { DataBenchmark, BenchmarkSample, MANUAL_CLASSIFICATIONS } from '@/lib/dataBenchmark';
import { classifyMarket } from '@/lib/marketClassifier';

export default function DataQualityPage() {
  const [stats, setStats] = useState(null);
  const [reviewItems, setReviewItems] = useState([]);
  const [benchmark, setBenchmark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadDataQualityStats();
  }, []);

  async function loadDataQualityStats() {
    try {
      setLoading(true);
      
      // Simulation des statistiques - à remplacer par de vraies données Firebase
      const mockStats = {
        totalContent: 1284,
        validMarkets: 846,
        rejectedContent: 392,
        reviewNeeded: 46,
        duplicatesDetected: 27,
        classificationErrors: 8,
        validationRate: 65.9,
        lastUpdate: new Date().toISOString()
      };
      
      // Simulation d'éléments à réviser
      const mockReviewItems = [
        {
          id: 'item-1',
          title: 'Prestation de formation en gestion de projet pour les cadres du ministère',
          description: 'Formation de 30 jours sur les méthodes de gestion...',
          source: 'ministere-finances.bf',
          score: 63,
          reason: 'Contient à la fois "formation" (négatif) et "prestation" (positif)',
          classification: 'REVIEW'
        },
        {
          id: 'item-2',
          title: 'Acquisition de fournitures de bureau - Université de Ouagadougou',
          description: 'Achat de matériel de bureau pour les services administratifs...',
          source: 'univ-ouaga.bf',
          score: 58,
          reason: 'Marché universitaire - zone grise',
          classification: 'REVIEW'
        },
        {
          id: 'item-3',
          title: 'Étude de faisabilité pour la construction d\'un pont',
          description: 'Étude préalable à la construction du pont de Kongoussi...',
          source: 'infrastructure.gouv.bf',
          score: 67,
          reason: 'Étude vs travaux - clarification nécessaire',
          classification: 'REVIEW'
        }
      ];

      setStats(mockStats);
      setReviewItems(mockReviewItems);
      
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleManualClassification(itemId, decision) {
    try {
      setReviewItems(prev => prev.filter(item => item.id !== itemId));
      
      // Ici on sauvegarderait la décision manuelle en base
      console.log(`Classification manuelle: ${itemId} → ${decision}`);
      
      // Mise à jour des stats
      setStats(prev => ({
        ...prev,
        reviewNeeded: prev.reviewNeeded - 1,
        [decision === 'VALID' ? 'validMarkets' : 'rejectedContent']: prev[decision === 'VALID' ? 'validMarkets' : 'rejectedContent'] + 1
      }));
      
    } catch (error) {
      console.error('Erreur lors de la classification:', error);
    }
  }

  async function runBenchmarkTest() {
    try {
      setLoading(true);
      
      const benchmark = new DataBenchmark();
      
      // Échantillons de test - à remplacer par de vraies données
      const testSamples = [
        new BenchmarkSample('test-1', {
          title: 'Appel d\'offres pour fourniture de matériel informatique',
          description: 'Acquisition d\'ordinateurs et équipements réseau',
          source: 'dgcmef.gov.bf'
        }, MANUAL_CLASSIFICATIONS.VALID),
        
        new BenchmarkSample('test-2', {
          title: 'Soutenance de thèse en informatique',
          description: 'Présentation des travaux de recherche en intelligence artificielle',
          source: 'univ-ouaga.bf'
        }, MANUAL_CLASSIFICATIONS.REJECTED),
        
        new BenchmarkSample('test-3', {
          title: 'Prestation de formation en comptabilité',
          description: 'Formation de 5 jours pour les agents comptables',
          source: 'ministere-finances.bf'
        }, MANUAL_CLASSIFICATIONS.REVIEW),
      ];
      
      testSamples.forEach(sample => benchmark.addSample(sample));
      
      const results = await benchmark.runBenchmark();
      setBenchmark(benchmark);
      
      console.log('Résultats du benchmark:', results);
      
    } catch (error) {
      console.error('Erreur lors du benchmark:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4 w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Qualité des données</h1>
          <button
            onClick={runBenchmarkTest}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Lancer un test benchmark
          </button>
        </div>

        {/* Navigation par onglets */}
        <div className="flex space-x-1 mb-8 border-b">
          {[
            { id: 'overview', label: 'Vue d\'ensemble' },
            { id: 'review', label: `À réviser (${reviewItems.length})` },
            { id: 'benchmark', label: 'Benchmark' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                selectedTab === tab.id
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Onglet Vue d'ensemble */}
        {selectedTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Statistiques principales */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Statistiques globales</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalContent.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Contenus analysés</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.validMarkets}</div>
                  <div className="text-sm text-gray-500">Vrais marchés</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.rejectedContent}</div>
                  <div className="text-sm text-gray-500">Contenus rejetés</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.reviewNeeded}</div>
                  <div className="text-sm text-gray-500">À vérifier</div>
                </div>
              </div>
            </div>

            {/* Métriques de qualité */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Métriques de qualité</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span>Taux de validation</span>
                  <span className="font-bold text-lg">{stats.validationRate}%</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span>Doublons détectés</span>
                  <span className="font-bold text-lg text-orange-600">{stats.duplicatesDetected}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span>Erreurs de classification</span>
                  <span className="font-bold text-lg text-red-600">{stats.classificationErrors}</span>
                </div>
              </div>
            </div>

            {/* Graphique de distribution (placeholder) */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Distribution des scores</h2>
              <div className="flex items-end space-x-2 h-32">
                <div className="bg-green-500 w-12 h-24 rounded-t flex items-end justify-center text-white text-xs pb-1">
                  80-100
                </div>
                <div className="bg-blue-500 w-12 h-16 rounded-t flex items-end justify-center text-white text-xs pb-1">
                  60-79
                </div>
                <div className="bg-yellow-500 w-12 h-12 rounded-t flex items-end justify-center text-white text-xs pb-1">
                  40-59
                </div>
                <div className="bg-orange-500 w-12 h-8 rounded-t flex items-end justify-center text-white text-xs pb-1">
                  20-39
                </div>
                <div className="bg-red-500 w-12 h-4 rounded-t flex items-end justify-center text-white text-xs pb-1">
                  0-19
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Répartition des contenus par score de classification
              </div>
            </div>
          </div>
        )}

        {/* Onglet À réviser */}
        {selectedTab === 'review' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Contenus nécessitant une révision manuelle</h2>
            {reviewItems.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-gray-500">✅ Aucun contenu en attente de révision</div>
              </div>
            ) : (
              reviewItems.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                      <p className="text-gray-600 mb-2">{item.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Source: {item.source}</span>
                        <span>Score: {item.score}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        item.score >= 70 ? 'bg-green-100 text-green-800' :
                        item.score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.score}/100
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded mb-4">
                    <div className="text-sm text-gray-600">
                      <strong>Raison de la révision :</strong> {item.reason}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleManualClassification(item.id, 'VALID')}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex items-center"
                    >
                      ✓ Marché valide
                    </button>
                    <button
                      onClick={() => handleManualClassification(item.id, 'REJECTED')}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors flex items-center"
                    >
                      ✕ Rejeter
                    </button>
                    <button
                      onClick={() => handleManualClassification(item.id, 'IGNORED')}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors flex items-center"
                    >
                      ⚠ Ignorer temporairement
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Onglet Benchmark */}
        {selectedTab === 'benchmark' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Test de performance du classificateur</h2>
              {benchmark ? (
                <div className="space-y-4">
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                    {benchmark.generateReport()}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Aucun benchmark exécuté</p>
                  <button
                    onClick={runBenchmarkTest}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Lancer un test
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}