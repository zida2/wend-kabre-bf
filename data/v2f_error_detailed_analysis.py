#!/usr/bin/env python3
"""
Analyse détaillée de toutes les erreurs V2F avec texte complet et contexte
Focus sur les causes racines et l'impact métier
"""

import json
import csv
from collections import defaultdict

def load_all_data():
    """Charge toutes les données nécessaires"""
    print("📁 Chargement complet des données...")
    
    # Prédictions V2F avec détails
    with open('holdout_predictions.json', 'r', encoding='utf-8') as f:
        v2f_predictions = {pred['id']: pred for pred in json.load(f)}
    
    # Labels humains avec catégories détaillées
    human_labels = {}
    with open('holdout_human_reference.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            human_labels[row['id']] = {
                'classification': row['classification_humaine'],
                'category': row['category_detailed'],
                'notes': row['notes']
            }
    
    # Textes complets du dataset holdout
    with open('holdout-validation-dataset.json', 'r', encoding='utf-8') as f:
        holdout_dataset = {item['id']: item for item in json.load(f)}
    
    # Matrice de confusion précédente
    with open('v2f_confusion_matrix_detailed.json', 'r', encoding='utf-8') as f:
        confusion_data = json.load(f)
    
    print(f"   • Prédictions V2F: {len(v2f_predictions)}")
    print(f"   • Labels humains: {len(human_labels)}")
    print(f"   • Textes holdout: {len(holdout_dataset)}")
    print(f"   • Données confusion: {confusion_data['total_samples']} échantillons")
    
    return v2f_predictions, human_labels, holdout_dataset, confusion_data

def identify_all_errors(v2f_predictions, human_labels, holdout_dataset):
    """Identifie toutes les erreurs avec détails complets"""
    print("\n🔍 IDENTIFICATION DÉTAILLÉE DES ERREURS")
    print("=" * 45)
    
    errors = []
    
    for item_id in sorted(human_labels.keys()):
        if item_id in v2f_predictions and item_id in holdout_dataset:
            human_label = human_labels[item_id]['classification']
            v2f_prediction = v2f_predictions[item_id]['prediction']
            
            # Si erreur détectée
            if human_label != v2f_prediction:
                error_info = {
                    'id': item_id,
                    'title': holdout_dataset[item_id].get('title', ''),
                    'description': holdout_dataset[item_id].get('description', ''),
                    'source': holdout_dataset[item_id].get('source', ''),
                    'human_label': human_label,
                    'human_category': human_labels[item_id]['category'],
                    'human_notes': human_labels[item_id]['notes'],
                    'v2f_prediction': v2f_prediction,
                    'v2f_score': v2f_predictions[item_id].get('score', 0),
                    'v2f_confidence': v2f_predictions[item_id].get('confidence', 0),
                    'v2f_intent': v2f_predictions[item_id].get('primary_intent', ''),
                    'v2f_content_type': v2f_predictions[item_id].get('content_type', ''),
                    'v2f_signals': v2f_predictions[item_id].get('signals_detected', ''),
                    'v2f_reasons': v2f_predictions[item_id].get('reasons', ''),
                    'error_type': f"{human_label} → {v2f_prediction}",
                    'business_risk': classify_business_risk(human_label, v2f_prediction)
                }
                errors.append(error_info)
    
    print(f"   • Total erreurs identifiées: {len(errors)}")
    
    # Grouper par type d'erreur
    errors_by_type = defaultdict(list)
    for error in errors:
        errors_by_type[error['error_type']].append(error)
    
    print(f"   • Types d'erreurs uniques: {len(errors_by_type)}")
    
    return errors, errors_by_type

def classify_business_risk(human_label, v2f_prediction):
    """Classifie le risque métier pour Wend-Kabré"""
    # CRITIQUE: Non-marchés envoyés comme opportunités
    if v2f_prediction == 'VALID' and human_label == 'REJECTED':
        return 'CRITIQUE'
    
    # MAJEURE: Opportunités perdues ou pollution modérée  
    if (human_label == 'VALID' and v2f_prediction == 'REJECTED') or \
       (v2f_prediction == 'VALID' and human_label == 'REVIEW'):
        return 'MAJEURE'
    
    # MODÉRÉE: Classifications sous-optimales mais récupérables
    if (human_label == 'VALID' and v2f_prediction == 'REVIEW') or \
       (human_label == 'REVIEW' and v2f_prediction in ['VALID', 'REJECTED']) or \
       (human_label == 'REJECTED' and v2f_prediction == 'REVIEW'):
        return 'MODÉRÉE'
    
    return 'FAIBLE'

def analyze_critical_errors(errors):
    """Analyse en profondeur les erreurs critiques"""
    print(f"\n🚨 ANALYSE DES ERREURS CRITIQUES")
    print("=" * 35)
    
    critical_errors = [e for e in errors if e['business_risk'] == 'CRITIQUE']
    
    if not critical_errors:
        print("   ✅ Aucune erreur critique détectée")
        return []
    
    print(f"   ⚠️  {len(critical_errors)} erreurs critiques trouvées:")
    
    for i, error in enumerate(critical_errors, 1):
        print(f"\n🔴 ERREUR CRITIQUE #{i}:")
        print(f"   ID: {error['id']}")
        print(f"   Type: {error['error_type']}")
        print(f"   Titre: {error['title'][:80]}...")
        print(f"   Description: {error['description'][:100]}...")
        print(f"   Source: {error['source']}")
        print(f"   Label humain: {error['human_label']} ({error['human_category']})")
        print(f"   Notes humaines: {error['human_notes']}")
        print(f"   V2F prédit: {error['v2f_prediction']}")
        print(f"   V2F score: {error['v2f_score']}")
        print(f"   V2F intent: {error['v2f_intent']}")
        print(f"   V2F signaux: {error['v2f_signals']}")
        print(f"   V2F raisons: {error['v2f_reasons']}")
        print(f"   💥 IMPACT: Non-marché affiché comme opportunité dans dashboard")
    
    return critical_errors

def analyze_major_errors(errors):
    """Analyse en profondeur les erreurs majeures"""
    print(f"\n⚠️  ANALYSE DES ERREURS MAJEURES")
    print("=" * 35)
    
    major_errors = [e for e in errors if e['business_risk'] == 'MAJEURE']
    
    if not major_errors:
        print("   ✅ Aucune erreur majeure détectée")
        return []
    
    print(f"   📊 {len(major_errors)} erreurs majeures trouvées")
    
    # Grouper par sous-type
    major_by_subtype = defaultdict(list)
    for error in major_errors:
        major_by_subtype[error['error_type']].append(error)
    
    for error_type, error_list in major_by_subtype.items():
        print(f"\n🟡 {error_type} ({len(error_list)} cas):")
        
        # Afficher les 3 premiers de chaque type
        for i, error in enumerate(error_list[:3]):
            print(f"   #{i+1} - {error['id']}: {error['title'][:60]}...")
            print(f"        Humain: {error['human_category']}")
            print(f"        V2F: {error['v2f_prediction']} (score={error['v2f_score']})")
            print(f"        Intent: {error['v2f_intent']}, Signaux: {error['v2f_signals']}")
        
        if len(error_list) > 3:
            print(f"        ... et {len(error_list) - 3} autres cas similaires")
    
    return major_errors

def analyze_patterns_in_errors(errors):
    """Identifie les patterns communs dans les erreurs"""
    print(f"\n🔍 ANALYSE DES PATTERNS D'ERREURS")
    print("=" * 35)
    
    patterns = {
        'intent_patterns': defaultdict(list),
        'score_ranges': defaultdict(list),
        'content_type_patterns': defaultdict(list),
        'source_patterns': defaultdict(list),
        'signal_patterns': defaultdict(list)
    }
    
    # Analyser les patterns par intent V2F
    for error in errors:
        patterns['intent_patterns'][error['v2f_intent']].append(error)
        
        # Catégoriser par score
        score = error['v2f_score']
        if score >= 3:
            score_range = 'HIGH (3+)'
        elif score >= 1:
            score_range = 'MEDIUM (1-3)'
        elif score >= -1:
            score_range = 'LOW (-1 to 1)'
        else:
            score_range = 'VERY_LOW (<-1)'
        patterns['score_ranges'][score_range].append(error)
        
        patterns['content_type_patterns'][error['v2f_content_type']].append(error)
        patterns['source_patterns'][error['source']].append(error)
        
        # Analyser signaux détectés
        signals = error['v2f_signals']
        if 'R:' in signals and 'M:' in signals:
            r_score = signals.split('R:')[1].split(',')[0].strip()
            m_score = signals.split('M:')[1].split(',')[0].strip() if ',' in signals.split('M:')[1] else signals.split('M:')[1].strip()
            signal_pattern = f"R:{r_score}, M:{m_score}"
            patterns['signal_patterns'][signal_pattern].append(error)
    
    # Afficher les patterns significatifs
    print(f"🧠 PATTERNS PAR INTENT V2F:")
    for intent, error_list in sorted(patterns['intent_patterns'].items(), key=lambda x: len(x[1]), reverse=True):
        if len(error_list) >= 3:  # Seulement les patterns significatifs
            print(f"   • {intent}: {len(error_list)} erreurs")
            risk_breakdown = defaultdict(int)
            for e in error_list:
                risk_breakdown[e['business_risk']] += 1
            print(f"     Risques: {dict(risk_breakdown)}")
    
    print(f"\n📊 PATTERNS PAR SCORE V2F:")
    for score_range, error_list in sorted(patterns['score_ranges'].items()):
        print(f"   • {score_range}: {len(error_list)} erreurs")
    
    print(f"\n🎯 PATTERNS PAR SIGNAUX:")
    for signal_pattern, error_list in sorted(patterns['signal_patterns'].items(), key=lambda x: len(x[1]), reverse=True)[:10]:
        if len(error_list) >= 2:
            print(f"   • {signal_pattern}: {len(error_list)} erreurs")
    
    return patterns

def identify_vocabulary_issues(errors):
    """Identifie les problèmes de vocabulaire dans les erreurs"""
    print(f"\n📚 ANALYSE DES PROBLÈMES DE VOCABULAIRE")
    print("=" * 40)
    
    vocabulary_issues = []
    
    for error in errors:
        title = error['title'].lower()
        description = error['description'].lower()
        
        # Chercher des mots-clés qui pourraient poser problème
        problematic_patterns = {
            'words_missing': [],
            'words_misleading': [],
            'context_issues': []
        }
        
        # Mots qui devraient indiquer VALID mais V2F rate
        if error['human_label'] == 'VALID' and error['v2f_prediction'] != 'VALID':
            market_indicators = ['appel d\'offres', 'marché', 'fourniture', 'construction', 'travaux', 'acquisition', 'prestation']
            found_indicators = [word for word in market_indicators if word in title or word in description]
            if found_indicators:
                problematic_patterns['words_missing'] = found_indicators
        
        # Mots qui induisent V2F en erreur vers VALID
        if error['human_label'] != 'VALID' and error['v2f_prediction'] == 'VALID':
            misleading_context = []
            if 'recrutement' in title and error['v2f_prediction'] == 'VALID':
                misleading_context.append('recrutement mal interprété')
            if 'avis' in title and 'décès' in title:
                misleading_context.append('avis de décès confondu')
            if misleading_context:
                problematic_patterns['words_misleading'] = misleading_context
        
        # Contexte ambigu
        if error['business_risk'] in ['MAJEURE', 'CRITIQUE']:
            if len(error['v2f_reasons'].split('→')) > 2:  # Multiple règles contradictoires
                problematic_patterns['context_issues'].append('règles contradictoires')
        
        if any(problematic_patterns.values()):
            vocabulary_issues.append({
                'error': error,
                'patterns': problematic_patterns
            })
    
    print(f"   • Erreurs avec problèmes vocabulaire: {len(vocabulary_issues)}")
    
    # Grouper par type de problème
    missing_indicators = [vi for vi in vocabulary_issues if vi['patterns']['words_missing']]
    misleading_words = [vi for vi in vocabulary_issues if vi['patterns']['words_misleading']]
    context_problems = [vi for vi in vocabulary_issues if vi['patterns']['context_issues']]
    
    print(f"   • Indicateurs marchés manqués: {len(missing_indicators)}")
    print(f"   • Mots induisant en erreur: {len(misleading_words)}")
    print(f"   • Problèmes de contexte: {len(context_problems)}")
    
    return vocabulary_issues

def main():
    print("🚀 ANALYSE DÉTAILLÉE DES ERREURS V2F")
    print("=" * 40)
    
    # Charger toutes les données
    v2f_predictions, human_labels, holdout_dataset, confusion_data = load_all_data()
    
    # Identifier toutes les erreurs
    errors, errors_by_type = identify_all_errors(v2f_predictions, human_labels, holdout_dataset)
    
    # Analyser les erreurs critiques
    critical_errors = analyze_critical_errors(errors)
    
    # Analyser les erreurs majeures
    major_errors = analyze_major_errors(errors)
    
    # Analyser les patterns d'erreurs
    patterns = analyze_patterns_in_errors(errors)
    
    # Identifier problèmes de vocabulaire
    vocabulary_issues = identify_vocabulary_issues(errors)
    
    # Statistiques finales
    print(f"\n📊 RÉSUMÉ ANALYSE ERREURS:")
    print("=" * 30)
    print(f"   • Total erreurs analysées: {len(errors)}")
    print(f"   • Erreurs critiques: {len(critical_errors)}")
    print(f"   • Erreurs majeures: {len(major_errors)}")
    print(f"   • Erreurs modérées: {len([e for e in errors if e['business_risk'] == 'MODÉRÉE'])}")
    print(f"   • Types d'erreurs: {len(errors_by_type)}")
    print(f"   • Problèmes vocabulaire: {len(vocabulary_issues)}")
    
    # Sauvegarde détaillée
    results = {
        'analysis_date': '2026-09-24',
        'total_errors': len(errors),
        'errors_by_risk': {
            'critical': critical_errors,
            'major': major_errors,
            'moderate': [e for e in errors if e['business_risk'] == 'MODÉRÉE']
        },
        'errors_by_type': {k: v for k, v in errors_by_type.items()},
        'patterns_analysis': patterns,
        'vocabulary_issues': vocabulary_issues,
        'all_errors': errors
    }
    
    with open('v2f_detailed_errors_analysis.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Analyse détaillée sauvegardée: v2f_detailed_errors_analysis.json")
    
    return results

if __name__ == '__main__':
    main()