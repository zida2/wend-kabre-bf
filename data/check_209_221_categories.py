#!/usr/bin/env python3
"""
Vérifier les catégories originales des échantillons holdout-209 à holdout-221
"""

import json

def main():
    print("🔍 Vérification des catégories holdout-209 à holdout-221")
    print("=" * 55)
    
    # Charger le dataset original
    with open('holdout-validation-dataset.json', 'r', encoding='utf-8') as f:
        dataset = json.load(f)
    
    # Chercher les échantillons 209-221
    target_ids = [f"holdout-{i}" for i in range(209, 222)]
    
    found_samples = []
    for item in dataset:
        if item['id'] in target_ids:
            found_samples.append({
                'id': item['id'],
                'title': item.get('title', '')[:60] + ('...' if len(item.get('title', '')) > 60 else ''),
                'category': item.get('category', 'unknown'),
                'subcategory': item.get('subcategory', 'unknown'),
                'full_title': item.get('title', '')
            })
    
    # Trier par ID
    found_samples.sort(key=lambda x: int(x['id'].split('-')[1]))
    
    print(f"📊 Échantillons trouvés: {len(found_samples)}/13")
    print()
    
    if found_samples:
        print("📋 DÉTAILS DES ÉCHANTILLONS 209-221:")
        print("-" * 100)
        print(f"{'ID':<12} {'Catégorie':<20} {'Sous-catégorie':<20} {'Titre':<45}")
        print("-" * 100)
        
        categories_count = {}
        for sample in found_samples:
            print(f"{sample['id']:<12} {sample['category']:<20} {sample['subcategory']:<20} {sample['title']:<45}")
            
            cat = sample['category']
            if cat in categories_count:
                categories_count[cat] += 1
            else:
                categories_count[cat] = 1
        
        print()
        print("📊 DISTRIBUTION DES CATÉGORIES:")
        for cat, count in categories_count.items():
            print(f"   • {cat}: {count} échantillons")
        
        # Vérifier si ce sont des communications
        communication_keywords = ['déclaration', 'communiqué', 'message', 'stratégie', 'politique']
        communication_samples = []
        
        for sample in found_samples:
            title_lower = sample['full_title'].lower()
            if any(keyword in title_lower for keyword in communication_keywords):
                communication_samples.append(sample['id'])
        
        print(f"\n🗣️ ÉCHANTILLONS IDENTIFIÉS COMME COMMUNICATIONS:")
        print(f"   • {len(communication_samples)} sur {len(found_samples)} contiennent des mots-clés de communication")
        if communication_samples:
            print(f"   • IDs: {', '.join(communication_samples)}")
    
    else:
        print("❌ Aucun échantillon trouvé dans la plage 209-221")
    
    return found_samples

if __name__ == '__main__':
    main()