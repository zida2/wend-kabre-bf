#!/usr/bin/env python3
"""
Classification détaillée des erreurs V2F par risque métier Wend-Kabré
Focus sur l'impact réel business et priorisation des corrections V2G
"""

import json
from collections import defaultdict

def load_error_data():
    """Charge les données d'erreurs détaillées"""
    print("📁 Chargement des données d'erreurs...")
    
    with open('v2f_detailed_errors_analysis.json', 'r', encoding='utf-8') as f:
        error_data = json.load(f)
    
    print(f"   • Total erreurs: {error_data['total_errors']}")
    print(f"   • Erreurs critiques: {len(error_data['errors_by_risk']['critical'])}")
    print(f"   • Erreurs majeures: {len(error_data['errors_by_risk']['major'])}")
    print(f"   • Erreurs modérées: {len(error_data['errors_by_risk']['moderate'])}")
    
    return error_data

def analyze_business_impact_detailed(error_data):
    """Analyse détaillée de l'impact métier par catégorie d'erreur"""
    print("\n🏢 ANALYSE IMPACT MÉTIER WEND-KABRÉ DÉTAILLÉE")
    print("=" * 50)
    
    all_errors = error_data['all_errors']
    
    # Classification métier détaillée
    business_classification = {
        'dashboard_pollution': {
            'description': 'Non-marchés affichés comme opportunités dans dashboard',
            'impact_level': 'CRITIQUE',
            'business_consequences': [
                'Perte de confiance utilisateurs',
                'Temps perdu sur fausses opportunités',
                'Réputation plateforme dégradée'
            ],
            'errors': []
        },
        'opportunity_loss': {
            'description': 'Vrais marchés rejetés - opportunités manquées',
            'impact_level': 'MAJEURE',
            'business_consequences': [
                'Chiffre d\'affaires perdu',
                'Clients ratent des marchés',
                'Concurrence avantagée'
            ],
            'errors': []
        },
        'ambiguous_promotion': {
            'description': 'Cas ambigus promus comme sûrs',
            'impact_level': 'MAJEURE',
            'business_consequences': [
                'Pollution modérée dashboard',
                'Surcharge équipes validation',
                'Fausses espoirs clients'
            ],
            'errors': []
        },
        'opportunity_delay': {
            'description': 'Opportunités envoyées en file d\'attente REVIEW',
            'impact_level': 'MODÉRÉE',
            'business_consequences': [
                'Retard traitement',
                'Charge travail humaine',
                'Risque timing manqué'
            ],
            'errors': []
        },
        'misclassification_recoverable': {
            'description': 'Classifications sous-optimales mais récupérables',
            'impact_level': 'MODÉRÉE',
            'business_consequences': [
                'Inefficacité workflow',
                'Coût validation humaine',
                'Expérience utilisateur dégradée'
            ],
            'errors': []
        },
        'false_rejection_review': {
            'description': 'Contenus rejetés envoyés en REVIEW par erreur',
            'impact_level': 'FAIBLE',
            'business_consequences': [
                'Coût validation minime',
                'Impact utilisateur limité'
            ],
            'errors': []
        }
    }
    
    # Classer chaque erreur dans la bonne catégorie métier
    for error in all_errors:
        error_type = error['error_type']
        
        if error_type == 'REJECTED → VALID':
            business_classification['dashboard_pollution']['errors'].append(error)
        elif error_type == 'VALID → REJECTED':
            business_classification['opportunity_loss']['errors'].append(error)
        elif error_type == 'REVIEW → VALID':
            business_classification['ambiguous_promotion']['errors'].append(error)
        elif error_type == 'VALID → REVIEW':
            business_classification['opportunity_delay']['errors'].append(error)
        elif error_type in ['REVIEW → REJECTED', 'REJECTED → REVIEW']:
            if error_type == 'REJECTED → REVIEW':
                business_classification['false_rejection_review']['errors'].append(error)
            else:
                business_classification['misclassification_recoverable']['errors'].append(error)
    
    return business_classification

def calculate_business_metrics(business_classification):
    """Calcule les métriques business par catégorie d'impact"""
    print("\n📊 MÉTRIQUES BUSINESS PAR CATÉGORIE")
    print("=" * 35)
    
    total_errors = sum(len(cat['errors']) for cat in business_classification.values())
    
    for category_name, category_data in business_classification.items():
        error_count = len(category_data['errors'])
        if error_count == 0:
            continue
            
        percentage = (error_count / total_errors) * 100
        impact_level = category_data['impact_level']
        
        print(f"\n🎯 {category_name.upper().replace('_', ' ')} ({impact_level}):")
        print(f"   • Nombre d'erreurs: {error_count}")
        print(f"   • Pourcentage total: {percentage:.1f}%")
        print(f"   • Description: {category_data['description']}")
        
        print("   • Conséquences business:")
        for consequence in category_data['business_consequences']:
            print(f"     - {consequence}")
        
        # Analyser les patterns dans cette catégorie
        if error_count > 0:
            # Score moyen V2F pour cette catégorie
            scores = [e['v2f_score'] for e in category_data['errors']]
            avg_score = sum(scores) / len(scores)
            
            # Intent patterns
            intents = defaultdict(int)
            for e in category_data['errors']:
                intents[e['v2f_intent']] += 1
            
            print(f"   • Score V2F moyen: {avg_score:.1f}")
            print(f"   • Intent patterns: {dict(intents)}")
    
    return total_errors

def prioritize_for_v2g(business_classification):
    """Priorise les corrections pour V2G selon l'impact business"""
    print("\n🎯 PRIORISATION CORRECTIONS POUR V2G")
    print("=" * 35)
    
    priorities = []
    
    # Priorité 1: CRITIQUE - Dashboard pollution (REJECTED → VALID)
    critical_errors = business_classification['dashboard_pollution']['errors']
    if critical_errors:
        priorities.append({
            'priority': 1,
            'category': 'Dashboard Pollution',
            'error_count': len(critical_errors),
            'impact': 'CRITIQUE',
            'fix_approach': 'Améliorer détection contexte communication vs marché',
            'technical_focus': 'Analyse contextuelle, pas seulement mots-clés',
            'examples': [e['id'] for e in critical_errors[:3]]
        })
    
    # Priorité 2: MAJEURE - Opportunités perdues (VALID → REJECTED)
    opportunity_lost = business_classification['opportunity_loss']['errors']
    if opportunity_lost:
        priorities.append({
            'priority': 2,
            'category': 'Opportunités Perdues',
            'error_count': len(opportunity_lost),
            'impact': 'MAJEURE',
            'fix_approach': 'Réduire seuil Score=0 trop restrictif',
            'technical_focus': 'Calibrage seuils, réduction faux négatifs',
            'examples': [e['id'] for e in opportunity_lost[:3]]
        })
    
    # Priorité 3: MAJEURE - Cas ambigus promus (REVIEW → VALID)
    ambiguous_promoted = business_classification['ambiguous_promotion']['errors']
    if ambiguous_promoted:
        priorities.append({
            'priority': 3,
            'category': 'Pollution Modérée',
            'error_count': len(ambiguous_promoted),
            'impact': 'MAJEURE',
            'fix_approach': 'Améliorer frontière REVIEW/VALID',
            'technical_focus': 'Définition plus stricte classe VALID',
            'examples': [e['id'] for e in ambiguous_promoted[:3]]
        })
    
    # Affichage priorisation
    for priority_item in priorities:
        print(f"\n🥇 PRIORITÉ {priority_item['priority']} - {priority_item['category']} ({priority_item['impact']})")
        print(f"   • Erreurs: {priority_item['error_count']}")
        print(f"   • Approche correction: {priority_item['fix_approach']}")
        print(f"   • Focus technique: {priority_item['technical_focus']}")
        print(f"   • Exemples IDs: {priority_item['examples']}")
    
    return priorities

def analyze_critical_errors_deep(business_classification):
    """Analyse approfondie des erreurs critiques pour action immédiate"""
    print("\n🔴 ANALYSE APPROFONDIE ERREURS CRITIQUES")
    print("=" * 40)
    
    critical_errors = business_classification['dashboard_pollution']['errors']
    
    if not critical_errors:
        print("   ✅ Aucune erreur critique détectée")
        return
    
    print(f"   ⚠️  {len(critical_errors)} erreurs critiques nécessitent action IMMÉDIATE")
    
    # Patterns communs dans erreurs critiques
    critical_patterns = {
        'titles_patterns': defaultdict(int),
        'sources_patterns': defaultdict(int),
        'v2f_reasons_patterns': defaultdict(int),
        'score_ranges': defaultdict(int)
    }
    
    for error in critical_errors:
        # Analyser patterns titres
        title = error['title'].lower()
        if 'fourniture' in title:
            critical_patterns['titles_patterns']['fourniture'] += 1
        if 'travaux' in title:
            critical_patterns['titles_patterns']['travaux'] += 1
        if 'prestation' in title:
            critical_patterns['titles_patterns']['prestation'] += 1
        if 'services' in title:
            critical_patterns['titles_patterns']['services'] += 1
        
        # Source patterns
        critical_patterns['sources_patterns'][error['source']] += 1
        
        # Raisons V2F
        reasons = error['v2f_reasons']
        if 'fourniture détectée' in reasons.lower():
            critical_patterns['v2f_reasons_patterns']['fourniture_trigger'] += 1
        if 'travaux détectés' in reasons.lower():
            critical_patterns['v2f_reasons_patterns']['travaux_trigger'] += 1
        if 'prestation' in reasons.lower():
            critical_patterns['v2f_reasons_patterns']['prestation_trigger'] += 1
        
        # Scores
        score = error['v2f_score']
        if score >= 3:
            critical_patterns['score_ranges']['high'] += 1
        elif score >= 2:
            critical_patterns['score_ranges']['medium'] += 1
        else:
            critical_patterns['score_ranges']['low'] += 1
    
    print(f"\n📋 PATTERNS DANS ERREURS CRITIQUES:")
    print(f"   • Mots-clés titres: {dict(critical_patterns['titles_patterns'])}")
    print(f"   • Sources: {dict(critical_patterns['sources_patterns'])}")
    print(f"   • Triggers V2F: {dict(critical_patterns['v2f_reasons_patterns'])}")
    print(f"   • Scores: {dict(critical_patterns['score_ranges'])}")
    
    # Recommandations spécifiques
    print(f"\n💡 RECOMMANDATIONS SPÉCIFIQUES:")
    print("   1. RÈGLE CONTEXTUELLE: Mots 'fourniture/travaux/prestation' + source gov + pattern communication → REVIEW")
    print("   2. VALIDATION CROISÉE: Score market élevé MAIS intent NEUTRAL → doute")
    print("   3. BLACKLIST TEMPORAIRE: Sources problématiques en validation humaine")
    print("   4. SEUIL AJUSTEMENT: Réduire bonus mots-clés marchés si contexte ambigu")
    
    return critical_patterns

def calculate_revenue_impact(business_classification):
    """Estime l'impact financier approximatif des erreurs"""
    print("\n💰 ESTIMATION IMPACT FINANCIER")
    print("=" * 30)
    
    # Hypothèses business Wend-Kabré (à ajuster selon réalité)
    assumptions = {
        'average_market_value_eur': 50000,  # Valeur moyenne marché
        'wend_kabre_commission_rate': 0.02,  # 2% commission
        'dashboard_pollution_cost_per_error': 100,  # Coût traitement fausse opportunité
        'opportunity_loss_probability': 0.1,  # 10% des opportunités ratées auraient été gagnées
        'review_processing_cost': 20  # Coût traitement humain REVIEW
    }
    
    # Impact pollution dashboard
    pollution_errors = len(business_classification['dashboard_pollution']['errors'])
    pollution_cost = pollution_errors * assumptions['dashboard_pollution_cost_per_error']
    
    # Impact opportunités perdues
    lost_opportunities = len(business_classification['opportunity_loss']['errors'])
    lost_revenue = (lost_opportunities * 
                   assumptions['average_market_value_eur'] * 
                   assumptions['wend_kabre_commission_rate'] * 
                   assumptions['opportunity_loss_probability'])
    
    # Coût traitement REVIEW supplémentaire
    review_overhead = len(business_classification['opportunity_delay']['errors']) * assumptions['review_processing_cost']
    
    total_estimated_impact = pollution_cost + lost_revenue + review_overhead
    
    print(f"📊 ESTIMATION MENSUELLE (approximative):")
    print(f"   • Pollution dashboard: {pollution_cost}€ ({pollution_errors} erreurs)")
    print(f"   • Opportunités perdues: {lost_revenue:.0f}€ ({lost_opportunities} opportunités)")
    print(f"   • Surcharge REVIEW: {review_overhead}€ ({len(business_classification['opportunity_delay']['errors'])} cas)")
    print(f"   • TOTAL estimé: {total_estimated_impact:.0f}€")
    
    print(f"\n⚠️  ATTENTION: Estimations basées sur hypothèses - ajuster selon données réelles")
    
    return {
        'pollution_cost': pollution_cost,
        'lost_revenue': lost_revenue,
        'review_overhead': review_overhead,
        'total_impact': total_estimated_impact,
        'assumptions': assumptions
    }

def main():
    print("🚀 CLASSIFICATION RISQUE MÉTIER V2F ERREURS")
    print("=" * 45)
    
    # Charger données erreurs
    error_data = load_error_data()
    
    # Analyser impact business détaillé
    business_classification = analyze_business_impact_detailed(error_data)
    
    # Calculer métriques business
    total_errors = calculate_business_metrics(business_classification)
    
    # Prioriser pour V2G
    priorities = prioritize_for_v2g(business_classification)
    
    # Analyser erreurs critiques en profondeur
    critical_patterns = analyze_critical_errors_deep(business_classification)
    
    # Calculer impact financier approximatif
    financial_impact = calculate_revenue_impact(business_classification)
    
    # Résumé final pour décision
    print(f"\n🎯 RÉSUMÉ DÉCISIONNEL:")
    print("=" * 25)
    print(f"   • Total erreurs classées: {total_errors}")
    print(f"   • Priorités V2G identifiées: {len(priorities)}")
    print(f"   • Impact financier estimé: {financial_impact['total_impact']:.0f}€/mois")
    print(f"   • Action immédiate requise: {len(business_classification['dashboard_pollution']['errors'])} erreurs critiques")
    
    # Sauvegarde classification business
    results = {
        'analysis_date': '2026-09-24',
        'business_classification': business_classification,
        'priorities_v2g': priorities,
        'critical_patterns': critical_patterns,
        'financial_impact': financial_impact,
        'total_errors_classified': total_errors,
        'recommendations': {
            'immediate_action': 'Fix 4 critical dashboard pollution errors',
            'v2g_priority_1': 'Improve context detection for market vs communication',
            'v2g_priority_2': 'Calibrate Score=0 threshold to reduce false negatives',
            'v2g_priority_3': 'Strengthen REVIEW/VALID boundary definition'
        }
    }
    
    with open('v2f_business_risk_classification.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Classification sauvegardée: v2f_business_risk_classification.json")
    
    return results

if __name__ == '__main__':
    main()