#!/usr/bin/env python3
"""
Script d'audit d'intégrité Gold Dataset V1
Vérifie que aucun texte/ID n'a été modifié par rapport au holdout original
"""

import json
from collections import defaultdict

def load_datasets():
    """Charge les datasets original et Gold V1"""
    print("📁 Chargement des datasets...")
    
    with open('holdout-validation-dataset.json', 'r', encoding='utf-8') as f:
        original = json.load(f)
    
    with open('gold-dataset-v1.json', 'r', encoding='utf-8') as f:
        gold_v1_full = json.load(f)
        gold_v1 = gold_v1_full.get('samples', [])
    
    print(f"   Original: {len(original)} échantillons")
    print(f"   Gold V1:  {len(gold_v1)} échantillons")
    
    return original, gold_v1, gold_v1_full

def check_basic_integrity(original, gold_v1):
    """Vérifications d'intégrité de base"""
    print("\n🔍 Vérifications d'intégrité de base...")
    
    issues = []
    
    # Nombre d'échantillons
    if len(original) != len(gold_v1):
        issues.append(f"ERREUR: Nombre d'échantillons différent: {len(original)} vs {len(gold_v1)}")
    else:
        print(f"   ✓ Nombre d'échantillons: {len(original)} (identique)")
    
    # IDs uniques dans chaque dataset
    original_ids = {item['id'] for item in original}
    gold_v1_ids = {item['id'] for item in gold_v1}
    
    if len(original_ids) != len(original):
        issues.append(f"ERREUR: IDs dupliqués dans original: {len(original)} items, {len(original_ids)} IDs uniques")
    
    if len(gold_v1_ids) != len(gold_v1):
        issues.append(f"ERREUR: IDs dupliqués dans Gold V1: {len(gold_v1)} items, {len(gold_v1_ids)} IDs uniques")
    
    # IDs manquants/ajoutés
    missing_ids = original_ids - gold_v1_ids
    added_ids = gold_v1_ids - original_ids
    
    if missing_ids:
        issues.append(f"ERREUR: IDs manquants dans Gold V1: {sorted(missing_ids)}")
    
    if added_ids:
        issues.append(f"ERREUR: IDs ajoutés dans Gold V1: {sorted(added_ids)}")
    
    if not missing_ids and not added_ids:
        print(f"   ✓ IDs identiques: {len(original_ids)} IDs uniques")
    
    return issues

def check_content_integrity(original, gold_v1):
    """Vérifie que les textes n'ont pas été modifiés"""
    print("\n📝 Vérification intégrité du contenu...")
    
    # Créer des dictionnaires par ID
    original_dict = {item['id']: item for item in original}
    gold_v1_dict = {item['id']: item for item in gold_v1}
    
    content_issues = []
    modified_fields = defaultdict(list)
    
    for item_id in original_dict:
        if item_id not in gold_v1_dict:
            continue
            
        orig_item = original_dict[item_id]
        gold_item = gold_v1_dict[item_id]
        
        # Vérifier champs critiques qui ne doivent jamais changer
        critical_fields = ['title', 'description', 'source', 'created_at', 'created_for']
        
        for field in critical_fields:
            if field in orig_item and field in gold_item:
                if orig_item[field] != gold_item[field]:
                    content_issues.append(f"ERREUR {item_id}: {field} modifié")
                    content_issues.append(f"  Original: {repr(orig_item[field])}")
                    content_issues.append(f"  Gold V1:  {repr(gold_item[field])}")
        
        # Identifier champs modifiés (attendus)
        for field in orig_item:
            if field in gold_item and orig_item[field] != gold_item[field]:
                modified_fields[field].append(item_id)
        
        # Identifier champs ajoutés
        new_fields = set(gold_item.keys()) - set(orig_item.keys())
        if new_fields:
            modified_fields['_NEW_FIELDS'].extend([f"{item_id}: {field}" for field in new_fields])
    
    if not content_issues:
        print("   ✓ Aucune modification de contenu détectée")
    
    return content_issues, dict(modified_fields)

def analyze_modifications(modified_fields):
    """Analyse les modifications détectées"""
    print("\n🔄 Analyse des modifications...")
    
    modification_summary = {}
    
    for field, items in modified_fields.items():
        modification_summary[field] = {
            'count': len(items),
            'items': items if len(items) <= 20 else items[:20] + ['...']
        }
        
        if field == 'category':
            print(f"   • {field}: {len(items)} modifications")
        elif field == '_NEW_FIELDS':
            print(f"   • Champs ajoutés: {len(items)} occurrences")
        else:
            print(f"   • {field}: {len(items)} modifications")
    
    return modification_summary

def main():
    print("🚀 AUDIT D'INTÉGRITÉ GOLD DATASET V1")
    print("=" * 50)
    
    # Charger les datasets
    original, gold_v1, gold_v1_full = load_datasets()
    
    # Vérifications de base
    basic_issues = check_basic_integrity(original, gold_v1)
    
    # Vérifications de contenu
    content_issues, modified_fields = check_content_integrity(original, gold_v1)
    
    # Analyse des modifications
    modification_summary = analyze_modifications(modified_fields)
    
    # Rapport final
    print(f"\n📊 RÉSUMÉ AUDIT D'INTÉGRITÉ")
    print("=" * 30)
    
    total_issues = len(basic_issues) + len(content_issues)
    
    if total_issues == 0:
        print("✅ INTÉGRITÉ CONFIRMÉE")
        print("   • Aucune modification non autorisée détectée")
        print("   • Textes et métadonnées critiques préservés")
    else:
        print(f"❌ {total_issues} PROBLÈMES D'INTÉGRITÉ DÉTECTÉS")
        
        if basic_issues:
            print("\n🚨 Problèmes structurels:")
            for issue in basic_issues:
                print(f"   {issue}")
        
        if content_issues:
            print(f"\n🚨 Modifications de contenu ({len(content_issues)} lignes):")
            for issue in content_issues[:10]:  # Limite l'affichage
                print(f"   {issue}")
            if len(content_issues) > 10:
                print(f"   ... et {len(content_issues) - 10} autres")
    
    # Modifications attendues (corrections)
    if 'category' in modified_fields:
        print(f"\n📋 Corrections appliquées:")
        print(f"   • Catégories modifiées: {len(modified_fields['category'])} échantillons")
    
    # Sauvegarde du rapport
    integrity_report = {
        'audit_date': '2026-09-24',
        'datasets_compared': {
            'original': 'holdout-validation-dataset.json',
            'gold_v1': 'gold-dataset-v1.json'
        },
        'sample_counts': {
            'original': len(original),
            'gold_v1': len(gold_v1)
        },
        'integrity_status': 'CONFIRMED' if total_issues == 0 else 'ISSUES_DETECTED',
        'basic_issues': basic_issues,
        'content_issues_count': len(content_issues),
        'modifications_summary': modification_summary,
        'metadata': gold_v1_full.get('metadata', {})
    }
    
    with open('gold_v1_integrity_report.json', 'w', encoding='utf-8') as f:
        json.dump(integrity_report, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Rapport sauvegardé: gold_v1_integrity_report.json")
    
    return integrity_report

if __name__ == '__main__':
    main()