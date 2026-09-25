#!/usr/bin/env python3
"""
Script pour lister EXACTEMENT toutes les corrections effectuées dans Gold Dataset V1
Évite le double comptage et identifie précisément chaque changement
"""

import json
from datetime import datetime

def load_datasets():
    """Charge les datasets pour comparaison"""
    print("📁 Chargement des datasets...")
    
    with open('holdout-validation-dataset.json', 'r', encoding='utf-8') as f:
        original = json.load(f)
    
    with open('gold-dataset-v1.json', 'r', encoding='utf-8') as f:
        gold_v1_full = json.load(f)
        gold_v1 = gold_v1_full.get('samples', [])
    
    return original, gold_v1, gold_v1_full

def compare_categories(original, gold_v1):
    """Compare les catégories entre original et Gold V1"""
    print("\n🔍 Comparaison des catégories...")
    
    # Créer dictionnaires par ID
    original_dict = {item['id']: item for item in original}
    gold_v1_dict = {item['id']: item for item in gold_v1}
    
    corrections = []
    confirmations = []
    
    for item_id in original_dict:
        orig_item = original_dict[item_id]
        gold_item = gold_v1_dict[item_id]
        
        orig_category = orig_item.get('category', 'unknown')
        gold_category = gold_item.get('category', 'unknown')
        
        if orig_category != gold_category:
            # Correction détectée
            corrections.append({
                'id': item_id,
                'title': orig_item.get('title', '')[:80] + ('...' if len(orig_item.get('title', '')) > 80 else ''),
                'original_category': orig_category,
                'gold_category': gold_category,
                'correction_type': f"{orig_category} → {gold_category}",
                'has_correction_metadata': 'correction_applied' in gold_item,
                'correction_metadata': gold_item.get('correction_applied', {}),
                'text_full': orig_item.get('title', '')
            })
        elif 'confirmation_applied' in gold_item:
            # Confirmation détectée
            confirmations.append({
                'id': item_id,
                'title': orig_item.get('title', '')[:80] + ('...' if len(orig_item.get('title', '')) > 80 else ''),
                'category': orig_category,
                'confirmation_metadata': gold_item.get('confirmation_applied', {}),
                'text_full': orig_item.get('title', '')
            })
    
    return corrections, confirmations

def analyze_corrections(corrections):
    """Analyse détaillée des corrections"""
    print(f"\n📊 Analyse de {len(corrections)} corrections...")
    
    # Grouper par type de correction
    by_type = {}
    for corr in corrections:
        corr_type = corr['correction_type']
        if corr_type not in by_type:
            by_type[corr_type] = []
        by_type[corr_type].append(corr)
    
    print("   Types de corrections:")
    for corr_type, items in by_type.items():
        print(f"     • {corr_type}: {len(items)} cas")
    
    # Vérifier cohérence métadonnées
    with_metadata = sum(1 for c in corrections if c['has_correction_metadata'])
    without_metadata = len(corrections) - with_metadata
    
    print(f"   Métadonnées de correction:")
    print(f"     • Avec métadonnées: {with_metadata}")
    print(f"     • Sans métadonnées: {without_metadata}")
    
    return by_type

def create_corrections_table(corrections, confirmations):
    """Crée le tableau détaillé des corrections"""
    print(f"\n📋 Création tableau des corrections...")
    
    table_data = []
    
    # Ajouter corrections
    for corr in corrections:
        table_data.append({
            'ID': corr['id'],
            'Type': 'CORRECTION',
            'Ancien_Label': corr['original_category'],
            'Nouveau_Label': corr['gold_category'],
            'Texte': corr['text_full'],
            'Justification': corr['correction_metadata'].get('reason', 'Non documentée'),
            'Source_Audit': corr['correction_metadata'].get('audit_source', 'Non documentée'),
            'Date': corr['correction_metadata'].get('date', 'Non documentée')
        })
    
    # Ajouter confirmations
    for conf in confirmations:
        table_data.append({
            'ID': conf['id'],
            'Type': 'CONFIRMATION',
            'Ancien_Label': conf['category'],
            'Nouveau_Label': conf['category'],  # Inchangé
            'Texte': conf['text_full'],
            'Justification': conf['confirmation_metadata'].get('status', 'Non documentée'),
            'Source_Audit': conf['confirmation_metadata'].get('audit_source', 'Non documentée'),
            'Date': conf['confirmation_metadata'].get('date', 'Non documentée')
        })
    
    # Trier par ID
    table_data.sort(key=lambda x: x['ID'])
    
    return table_data

def identify_special_cases(corrections, confirmations):
    """Identifie les cas spéciaux mentionnés dans les audits précédents"""
    print(f"\n🎯 Identification des cas spéciaux...")
    
    # IDs des 13 corrections supposées (VALID → REJECTED)
    supposed_13_corrections = [f"holdout-{i}" for i in range(209, 222)]  # 209-221
    
    # ID confirmé VALID
    supposed_confirmed = ["holdout-007"]
    
    # IDs des 10 faux négatifs supposés
    # Ces IDs doivent être identifiés à partir des audits précédents
    
    actual_corrections = {c['id']: c for c in corrections}
    actual_confirmations = {c['id']: c for c in confirmations}
    
    analysis = {
        'corrections_13_analysis': {
            'expected_ids': supposed_13_corrections,
            'found_corrections': [],
            'missing_corrections': [],
            'unexpected_corrections': []
        },
        'confirmation_analysis': {
            'expected_ids': supposed_confirmed,
            'found_confirmations': [],
            'missing_confirmations': []
        },
        'false_negatives_analysis': {
            'note': 'IDs à identifier à partir des résultats V2F'
        }
    }
    
    # Analyser les 13 corrections supposées
    for expected_id in supposed_13_corrections:
        if expected_id in actual_corrections:
            analysis['corrections_13_analysis']['found_corrections'].append(expected_id)
        else:
            analysis['corrections_13_analysis']['missing_corrections'].append(expected_id)
    
    # Corrections non attendues
    for corr_id in actual_corrections:
        if corr_id not in supposed_13_corrections:
            analysis['corrections_13_analysis']['unexpected_corrections'].append(corr_id)
    
    # Analyser les confirmations
    for expected_id in supposed_confirmed:
        if expected_id in actual_confirmations:
            analysis['confirmation_analysis']['found_confirmations'].append(expected_id)
        else:
            analysis['confirmation_analysis']['missing_confirmations'].append(expected_id)
    
    return analysis

def main():
    print("🚀 LISTING EXACT DES CORRECTIONS GOLD DATASET V1")
    print("=" * 55)
    
    # Charger les datasets
    original, gold_v1, gold_v1_full = load_datasets()
    
    # Comparer les catégories
    corrections, confirmations = compare_categories(original, gold_v1)
    
    # Analyser les corrections
    by_type = analyze_corrections(corrections)
    
    # Créer le tableau détaillé
    table_data = create_corrections_table(corrections, confirmations)
    
    # Identifier les cas spéciaux
    special_analysis = identify_special_cases(corrections, confirmations)
    
    # Résumé final
    print(f"\n📊 RÉSUMÉ DES MODIFICATIONS")
    print("=" * 30)
    print(f"   • Total corrections: {len(corrections)}")
    print(f"   • Total confirmations: {len(confirmations)}")
    print(f"   • Total modifications: {len(corrections) + len(confirmations)}")
    
    # Afficher tableau (premiers résultats)
    if table_data:
        print(f"\n📋 TABLEAU DES CORRECTIONS (aperçu):")
        print("-" * 120)
        print(f"{'ID':<15} {'Type':<12} {'Ancien→Nouveau':<25} {'Texte':<40} {'Justification':<25}")
        print("-" * 120)
        
        for item in table_data[:10]:  # Limiter l'affichage
            ancien_nouveau = f"{item['Ancien_Label']} → {item['Nouveau_Label']}"
            texte_court = item['Texte'][:37] + '...' if len(item['Texte']) > 40 else item['Texte']
            justif_courte = item['Justification'][:22] + '...' if len(item['Justification']) > 25 else item['Justification']
            
            print(f"{item['ID']:<15} {item['Type']:<12} {ancien_nouveau:<25} {texte_court:<40} {justif_courte:<25}")
        
        if len(table_data) > 10:
            print(f"... et {len(table_data) - 10} autres modifications")
    
    # Sauvegarder les résultats
    results = {
        'audit_timestamp': datetime.now().isoformat(),
        'summary': {
            'total_corrections': len(corrections),
            'total_confirmations': len(confirmations),
            'total_modifications': len(corrections) + len(confirmations)
        },
        'corrections_by_type': {k: len(v) for k, v in by_type.items()},
        'detailed_table': table_data,
        'special_cases_analysis': special_analysis,
        'corrections_list': corrections,
        'confirmations_list': confirmations
    }
    
    with open('gold_v1_all_corrections.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Résultats sauvegardés: gold_v1_all_corrections.json")
    
    return results

if __name__ == '__main__':
    main()