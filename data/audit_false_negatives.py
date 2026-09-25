#!/usr/bin/env python3
"""
Audit des "faux négatifs" supposés de V2F
Comprendre la contradiction entre dataset holdout et labels humains
"""

import json
import csv
from collections import defaultdict

def load_data():
    """Charge toutes les données nécessaires"""
    print("📁 Chargement des données...")
    
    # Dataset holdout original
    with open('holdout-validation-dataset.json', 'r', encoding='utf-8') as f:
        holdout_dataset = {item['id']: item for item in json.load(f)}
    
    # Labels humains
    human_labels = {}
    with open('holdout_human_reference.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            human_labels[row['id']] = {
                'classification': row['classification_humaine'],
                'category': row['category_detailed'],
                'notes': row['notes']
            }
    
    # Résultats V2F (si disponibles)
    v2f_results = {}
    try:
        # Chercher un fichier de résultats V2F
        with open('v2f_holdout_results.json', 'r', encoding='utf-8') as f:
            v2f_data = json.load(f)
            for result in v2f_data.get('results', []):
                v2f_results[result['id']] = result
    except FileNotFoundError:
        print("   ⚠️  Résultats V2F non trouvés, analyse partielle")
    
    print(f"   • Holdout dataset: {len(holdout_dataset)} échantillons")
    print(f"   • Labels humains: {len(human_labels)} échantillons")
    print(f"   • Résultats V2F: {len(v2f_results)} échantillons")
    
    return holdout_dataset, human_labels, v2f_results

def compare_labels(holdout_dataset, human_labels):
    """Compare les labels du dataset vs labels humains"""
    print("\n🔍 Comparaison labels dataset vs humains...")
    
    contradictions = []
    
    for item_id in holdout_dataset:
        if item_id not in human_labels:
            continue
            
        holdout_category = holdout_dataset[item_id].get('category', 'unknown')
        human_class = human_labels[item_id]['classification']
        
        # Convertir les catégories pour comparaison
        holdout_simplified = simplify_category(holdout_category)
        human_simplified = simplify_classification(human_class)
        
        if holdout_simplified != human_simplified:
            contradictions.append({
                'id': item_id,
                'title': holdout_dataset[item_id].get('title', '')[:60] + '...',
                'holdout_category': holdout_category,
                'holdout_simplified': holdout_simplified,
                'human_classification': human_class,
                'human_simplified': human_simplified,
                'human_notes': human_labels[item_id]['notes'],
                'contradiction_type': f"{holdout_simplified} vs {human_simplified}"
            })
    
    return contradictions

def simplify_category(category):
    """Simplifie les catégories dataset en VALID/REVIEW/REJECTED"""
    if category.startswith('expected_valid'):
        return 'VALID'
    elif category.startswith('expected_review'):
        return 'REVIEW'  
    elif category.startswith('expected_rejected'):
        return 'REJECTED'
    else:
        return 'UNKNOWN'

def simplify_classification(classification):
    """Simplifie les classifications humaines"""
    return classification.strip().upper()

def identify_false_negatives(contradictions, v2f_results):
    """Identifie les vrais faux négatifs basés sur les contradictions et V2F"""
    print(f"\n🎯 Identification des faux négatifs...")
    
    # Focus sur les cas où dataset=REJECTED mais humain=VALID
    potential_fn = [c for c in contradictions if c['holdout_simplified'] == 'REJECTED' and c['human_simplified'] == 'VALID']
    
    print(f"   • Contradictions REJECTED→VALID: {len(potential_fn)} cas")
    
    # Ces cas correspondent aux "faux négatifs" si V2F suivait le dataset (REJECTED)
    # mais les humains les considèrent VALID
    
    false_negatives_analysis = []
    
    for case in potential_fn:
        analysis = {
            'id': case['id'],
            'title': case['title'],
            'dataset_label': case['holdout_category'],
            'human_label': case['human_classification'],
            'human_notes': case['human_notes'],
            'v2f_prediction': 'N/A',
            'is_true_fn': 'TO_DETERMINE'
        }
        
        # Ajouter résultat V2F si disponible
        if case['id'] in v2f_results:
            v2f_pred = v2f_results[case['id']].get('prediction', 'N/A')
            analysis['v2f_prediction'] = v2f_pred
            
            # Si V2F a prédit REJECTED et humain dit VALID, c'est un FN
            if v2f_pred == 'REJECTED' and case['human_simplified'] == 'VALID':
                analysis['is_true_fn'] = 'TRUE_FN'
            elif v2f_pred == 'VALID' and case['human_simplified'] == 'VALID':
                analysis['is_true_fn'] = 'FALSE_ALARM'  # Pas un FN
        
        false_negatives_analysis.append(analysis)
    
    return false_negatives_analysis

def analyze_209_221_contradiction(holdout_dataset, human_labels):
    """Analyse spécifique de la contradiction 209-221"""
    print(f"\n💥 ANALYSE CONTRADICTION HOLDOUT-209 à HOLDOUT-221")
    print("=" * 60)
    
    target_ids = [f"holdout-{i}" for i in range(209, 222)]
    
    for item_id in target_ids:
        if item_id in holdout_dataset and item_id in human_labels:
            holdout = holdout_dataset[item_id]
            human = human_labels[item_id]
            
            print(f"\n{item_id}:")
            print(f"   Dataset: {holdout.get('category', 'N/A')} (REJECTED)")
            print(f"   Humain:  {human['classification']} ({human['category']})")
            print(f"   Titre:   {holdout.get('title', 'N/A')[:70]}...")
            print(f"   Notes:   {human['notes']}")
            
            # Ce sont des communications officielles dans le dataset mais classées VALID par humains
            # = ERREUR soit dans dataset soit dans labels humains

def main():
    print("🚀 AUDIT DES FAUX NÉGATIFS - RÉSOLUTION CONTRADICTIONS")
    print("=" * 65)
    
    # Charger les données
    holdout_dataset, human_labels, v2f_results = load_data()
    
    # Comparer les labels
    contradictions = compare_labels(holdout_dataset, human_labels)
    
    print(f"\n📊 RÉSUMÉ DES CONTRADICTIONS:")
    print(f"   • Total contradictions: {len(contradictions)}")
    
    # Grouper par type de contradiction
    by_type = defaultdict(list)
    for c in contradictions:
        by_type[c['contradiction_type']].append(c)
    
    for contra_type, items in by_type.items():
        print(f"   • {contra_type}: {len(items)} cas")
    
    # Identifier les faux négatifs
    false_negatives = identify_false_negatives(contradictions, v2f_results)
    
    # Analyse spéciale 209-221
    analyze_209_221_contradiction(holdout_dataset, human_labels)
    
    # Sauvegarde des résultats
    results = {
        'audit_timestamp': '2026-09-24',
        'total_contradictions': len(contradictions),
        'contradictions_by_type': {k: len(v) for k, v in by_type.items()},
        'all_contradictions': contradictions,
        'false_negatives_analysis': false_negatives,
        'holdout_209_221_analysis': 'Communications officielles REJECTED dans dataset mais VALID chez humains'
    }
    
    with open('false_negatives_audit.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Audit sauvegardé: false_negatives_audit.json")
    
    return results

if __name__ == '__main__':
    main()