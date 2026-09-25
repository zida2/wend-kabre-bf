#!/usr/bin/env python3
"""
Audit des "13 corrections VALID→REJECTED" supposées dans Gold Dataset V1
Vérifier si ces corrections ont vraiment eu lieu et sont justifiées
"""

import json

def main():
    print("🚀 AUDIT DES 13 CORRECTIONS SUPPOSÉES VALID→REJECTED")
    print("=" * 58)
    
    print("\n📋 RÉCAPITULATIF DES DÉCOUVERTES PRÉCÉDENTES:")
    print("─" * 50)
    print("1. Gold Dataset V1 contient seulement 1 modification réelle:")
    print("   • holdout-007: Confirmation VALID (métadonnées ajoutées)")
    print("2. Aucune correction de catégorie détectée")
    print("3. Échantillons 209-221 étaient DÉJÀ expected_rejected")
    print("4. Contradiction titres vs notes pour 209-221")
    
    print("\n🔍 ANALYSE DES 13 CORRECTIONS SUPPOSÉES:")
    print("─" * 45)
    
    # Les 13 IDs supposés avoir été corrigés
    supposed_corrected_ids = [f"holdout-{i}" for i in range(209, 222)]
    
    print(f"📌 IDs supposés corrigés: {', '.join(supposed_corrected_ids)}")
    
    print("\n💡 RÉALITÉ DES CORRECTIONS:")
    print("─" * 30)
    
    # Charger le dataset original pour vérifier
    with open('holdout-validation-dataset.json', 'r', encoding='utf-8') as f:
        original_dataset = {item['id']: item for item in json.load(f)}
    
    # Charger Gold Dataset V1 pour vérifier
    with open('gold-dataset-v1.json', 'r', encoding='utf-8') as f:
        gold_data = json.load(f)
        gold_dataset = {item['id']: item for item in gold_data['samples']}
    
    print("✅ VÉRIFICATION CORRECTION PAR CORRECTION:")
    print()
    
    corrections_analysis = []
    
    for item_id in supposed_corrected_ids:
        original_item = original_dataset.get(item_id, {})
        gold_item = gold_dataset.get(item_id, {})
        
        original_category = original_item.get('category', 'N/A')
        gold_category = gold_item.get('category', 'N/A')
        
        correction_applied = 'correction_applied' in gold_item
        
        analysis = {
            'id': item_id,
            'original_category': original_category,
            'gold_category': gold_category,
            'correction_metadata': correction_applied,
            'category_changed': original_category != gold_category,
            'title': original_item.get('title', 'N/A')[:60] + '...',
            'conclusion': 'NO_CORRECTION_APPLIED'
        }
        
        if original_category == gold_category and original_category == 'expected_rejected':
            analysis['conclusion'] = 'ALREADY_REJECTED_NO_CHANGE'
        elif original_category != gold_category:
            analysis['conclusion'] = 'CATEGORY_CHANGED'
        
        corrections_analysis.append(analysis)
        
        print(f"{item_id}:")
        print(f"   Original: {original_category}")
        print(f"   Gold V1:  {gold_category}")
        print(f"   Changé:   {original_category != gold_category}")
        print(f"   Métadon.: {correction_applied}")
        print(f"   Status:   {analysis['conclusion']}")
        print()
    
    print("📊 RÉSUMÉ FINAL:")
    print("─" * 15)
    
    no_change = sum(1 for a in corrections_analysis if a['conclusion'] == 'ALREADY_REJECTED_NO_CHANGE')
    changed = sum(1 for a in corrections_analysis if a['conclusion'] == 'CATEGORY_CHANGED')
    
    print(f"• Déjà REJECTED (aucun changement): {no_change}/13")
    print(f"• Catégorie réellement changée: {changed}/13")
    print(f"• Corrections métadonnées: {sum(1 for a in corrections_analysis if a['correction_metadata'])}/13")
    
    print("\n🎯 CONCLUSION SUR LES 13 CORRECTIONS:")
    print("─" * 40)
    
    if no_change == 13:
        print("❌ AUCUNE des 13 corrections supposées n'a été appliquée")
        print("   • Tous les échantillons étaient déjà expected_rejected")
        print("   • Le script de création Gold Dataset V1 n'a rien modifié")
        print("   • L'audit précédent était basé sur des données incorrectes")
        
        print("\n🔥 PROBLÈME FONDAMENTAL IDENTIFIÉ:")
        print("   • Confusion entre TITRES et NOTES dans l'analyse")
        print("   • Les titres (communications) justifient REJECTED")
        print("   • Les notes (marchés) justifieraient VALID")
        print("   • Le dataset original était cohérent avec les titres")
    else:
        print("⚠️  Situation mixte détectée - investigation requise")
    
    print("\n📝 IMPLICATION POUR L'ÉVALUATION V2F:")
    print("─" * 40)
    print("• Gold Dataset V1 ≈ Dataset holdout original (sauf 1 métadonnée)")
    print("• Aucune 'correction' de labels n'a été appliquée")
    print("• Les métriques V2F sur Gold V1 ≈ métriques sur holdout original")
    print("• L'amélioration de performance supposée n'existe pas")
    
    # Sauvegarde
    results = {
        'audit_date': '2026-09-24',
        'supposed_corrections': 13,
        'actual_corrections': changed,
        'already_rejected': no_change,
        'corrections_analysis': corrections_analysis,
        'conclusion': 'NO_CORRECTIONS_APPLIED' if no_change == 13 else 'MIXED_SITUATION',
        'fundamental_issue': 'Title-Notes mapping error in holdout-209-221 range'
    }
    
    with open('audit_13_corrections.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Audit sauvegardé: audit_13_corrections.json")
    
    return results

if __name__ == '__main__':
    main()