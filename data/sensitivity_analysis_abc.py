#!/usr/bin/env python3
"""
Analyse de sensibilité aux labels - Scénarios A/B/C
A: Labels CERTAINS seulement
B: Tous labels officiellement adjudiqués (Gold V1)  
C: Cas ambigus exclus (analyse seulement)
"""

import json
import csv
from collections import defaultdict

def calculate_metrics_manual(true_labels, predictions):
    """Calcule métriques manuellement"""
    classes = sorted(set(true_labels) | set(predictions))
    class_to_idx = {cls: i for i, cls in enumerate(classes)}
    n_classes = len(classes)
    
    # Matrice de confusion
    cm = [[0 for _ in range(n_classes)] for _ in range(n_classes)]
    for true, pred in zip(true_labels, predictions):
        cm[class_to_idx[true]][class_to_idx[pred]] += 1
    
    # Accuracy
    correct = sum(cm[i][i] for i in range(n_classes))
    total = sum(sum(row) for row in cm)
    accuracy = correct / total if total > 0 else 0
    
    # Metrics par classe
    metrics_by_class = {}
    for i, cls in enumerate(classes):
        tp = cm[i][i]
        fp = sum(cm[j][i] for j in range(n_classes) if j != i)
        fn = sum(cm[i][j] for j in range(n_classes) if j != i)
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        
        metrics_by_class[cls] = {'precision': precision, 'recall': recall, 'f1': f1}
    
    # Macro averages
    macro_precision = sum(m['precision'] for m in metrics_by_class.values()) / len(metrics_by_class)
    macro_recall = sum(m['recall'] for m in metrics_by_class.values()) / len(metrics_by_class)
    macro_f1 = sum(m['f1'] for m in metrics_by_class.values()) / len(metrics_by_class)
    
    # Pollution
    valid_predicted = sum(1 for p in predictions if p == 'VALID')
    false_positives = sum(1 for t, p in zip(true_labels, predictions) if t == 'REJECTED' and p == 'VALID')
    pollution_rate = (false_positives / valid_predicted * 100) if valid_predicted > 0 else 0
    
    return {
        'accuracy': accuracy,
        'macro_precision': macro_precision,
        'macro_recall': macro_recall,
        'macro_f1': macro_f1,
        'pollution_rate': pollution_rate,
        'sample_count': len(true_labels),
        'class_distribution': {cls: sum(1 for t in true_labels if t == cls) for cls in classes}
    }

def load_data():
    """Charge toutes les données"""
    print("📁 Chargement des données...")
    
    # Dataset holdout original
    with open('holdout-validation-dataset.json', 'r', encoding='utf-8') as f:
        holdout_dataset = {item['id']: item for item in json.load(f)}
    
    # Labels humains
    human_labels = {}
    with open('holdout_human_reference.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            human_labels[row['id']] = row['classification_humaine']
    
    # Prédictions V2F
    with open('holdout_predictions.json', 'r', encoding='utf-8') as f:
        v2f_predictions = {pred['id']: pred for pred in json.load(f)}
    
    # Contradictions identifiées
    with open('false_negatives_audit.json', 'r', encoding='utf-8') as f:
        audit_data = json.load(f)
        contradictions = {c['id']: c for c in audit_data['all_contradictions']}
    
    return holdout_dataset, human_labels, v2f_predictions, contradictions

def convert_category_to_class(category):
    """Convertit les catégories en classes VALID/REVIEW/REJECTED"""
    if category.startswith('expected_valid'):
        return 'VALID'
    elif category.startswith('expected_review'):
        return 'REVIEW'
    elif category.startswith('expected_rejected'):
        return 'REJECTED'
    else:
        return 'UNKNOWN'

def create_scenario_a(holdout_dataset, human_labels, v2f_predictions, contradictions):
    """Scénario A: Labels CERTAINS seulement - exclut les contradictions"""
    print(f"\n🔍 SCÉNARIO A - LABELS CERTAINS UNIQUEMENT:")
    print("─" * 45)
    
    # Exclure tous les IDs avec contradictions
    contradiction_ids = set(contradictions.keys())
    
    scenario_a_true = []
    scenario_a_pred = []
    scenario_a_ids = []
    
    for item_id in holdout_dataset:
        if item_id not in contradiction_ids and item_id in v2f_predictions:
            # Utiliser les labels du dataset holdout (cohérents)
            true_category = holdout_dataset[item_id].get('category', 'unknown')
            true_class = convert_category_to_class(true_category)
            
            pred_class = v2f_predictions[item_id].get('prediction', 'UNKNOWN')
            
            scenario_a_true.append(true_class)
            scenario_a_pred.append(pred_class)
            scenario_a_ids.append(item_id)
    
    print(f"   • Échantillons totaux: {len(holdout_dataset)}")
    print(f"   • Contradictions exclues: {len(contradiction_ids)}")
    print(f"   • Échantillons retenus: {len(scenario_a_true)}")
    print(f"   • Pourcentage retenu: {len(scenario_a_true)/len(holdout_dataset)*100:.1f}%")
    
    metrics_a = calculate_metrics_manual(scenario_a_true, scenario_a_pred)
    
    return scenario_a_true, scenario_a_pred, scenario_a_ids, metrics_a

def create_scenario_b(holdout_dataset, human_labels, v2f_predictions):
    """Scénario B: Tous labels officiellement adjudiqués (Gold V1 = Holdout original)"""
    print(f"\n🔍 SCÉNARIO B - TOUS LABELS ADJUDIQUÉS (GOLD V1):")
    print("─" * 50)
    
    scenario_b_true = []
    scenario_b_pred = []
    scenario_b_ids = []
    
    for item_id in holdout_dataset:
        if item_id in v2f_predictions:
            # Utiliser labels holdout (= Gold V1)
            true_category = holdout_dataset[item_id].get('category', 'unknown')
            true_class = convert_category_to_class(true_category)
            
            pred_class = v2f_predictions[item_id].get('prediction', 'UNKNOWN')
            
            scenario_b_true.append(true_class)
            scenario_b_pred.append(pred_class)
            scenario_b_ids.append(item_id)
    
    print(f"   • Échantillons inclus: {len(scenario_b_true)}")
    print(f"   • Approche: Labels dataset holdout/Gold V1")
    
    metrics_b = calculate_metrics_manual(scenario_b_true, scenario_b_pred)
    
    return scenario_b_true, scenario_b_pred, scenario_b_ids, metrics_b

def create_scenario_c(holdout_dataset, human_labels, v2f_predictions, contradictions):
    """Scénario C: Cas ambigus exclus - analyse uniquement"""
    print(f"\n🔍 SCÉNARIO C - EXCLUSION CAS AMBIGUS (ANALYSE):")
    print("─" * 48)
    
    # Identifier les cas "clairement" classifiables (non-ambigus)
    # Basé sur les contradictions types : exclure VALID vs REVIEW, REVIEW vs REJECTED
    ambiguous_contradiction_types = ['VALID vs REVIEW', 'REVIEW vs REJECTED', 'UNKNOWN vs']
    
    ambiguous_ids = set()
    for item_id, contradiction in contradictions.items():
        if any(amb_type in contradiction['contradiction_type'] for amb_type in ambiguous_contradiction_types):
            ambiguous_ids.add(item_id)
    
    scenario_c_true = []
    scenario_c_pred = []
    scenario_c_ids = []
    
    for item_id in holdout_dataset:
        if item_id not in ambiguous_ids and item_id in v2f_predictions:
            # Utiliser labels holdout
            true_category = holdout_dataset[item_id].get('category', 'unknown')
            true_class = convert_category_to_class(true_category)
            
            pred_class = v2f_predictions[item_id].get('prediction', 'UNKNOWN')
            
            scenario_c_true.append(true_class)
            scenario_c_pred.append(pred_class)
            scenario_c_ids.append(item_id)
    
    print(f"   • Échantillons totaux: {len(holdout_dataset)}")
    print(f"   • Cas ambigus exclus: {len(ambiguous_ids)}")
    print(f"   • Échantillons analysés: {len(scenario_c_true)}")
    print(f"   • Pourcentage analysé: {len(scenario_c_true)/len(holdout_dataset)*100:.1f}%")
    print(f"   ⚠️  ATTENTION: Scénario C pour analyse uniquement, ne remplace pas dataset complet")
    
    metrics_c = calculate_metrics_manual(scenario_c_true, scenario_c_pred)
    
    return scenario_c_true, scenario_c_pred, scenario_c_ids, metrics_c

def compare_scenarios(metrics_a, metrics_b, metrics_c):
    """Compare les 3 scénarios"""
    print(f"\n📊 COMPARAISON DES 3 SCÉNARIOS:")
    print("=" * 40)
    
    scenarios = {
        'A (CERTAINS)': metrics_a,
        'B (GOLD V1)': metrics_b, 
        'C (NON-AMBIGUS)': metrics_c
    }
    
    print(f"{'Métrique':<15} {'A (CERTAINS)':<12} {'B (GOLD V1)':<12} {'C (ANALYSE)':<12}")
    print("─" * 60)
    
    metrics_keys = [
        ('Échantillons', 'sample_count'),
        ('Accuracy', 'accuracy'),
        ('Macro Prec.', 'macro_precision'),
        ('Macro Recall', 'macro_recall'),
        ('Macro F1', 'macro_f1'),
        ('Pollution', 'pollution_rate')
    ]
    
    for name, key in metrics_keys:
        if key == 'sample_count':
            a_val = f"{metrics_a[key]}"
            b_val = f"{metrics_b[key]}"
            c_val = f"{metrics_c[key]}"
        elif key == 'pollution_rate':
            a_val = f"{metrics_a[key]:.1f}%"
            b_val = f"{metrics_b[key]:.1f}%"
            c_val = f"{metrics_c[key]:.1f}%"
        else:
            a_val = f"{metrics_a[key]:.1%}"
            b_val = f"{metrics_b[key]:.1%}"
            c_val = f"{metrics_c[key]:.1%}"
        
        print(f"{name:<15} {a_val:<12} {b_val:<12} {c_val:<12}")
    
    print(f"\n💡 OBSERVATIONS:")
    print("─" * 15)
    
    # Analyser les différences
    if abs(metrics_a['accuracy'] - metrics_b['accuracy']) < 0.01:
        print("• Scénarios A et B ont des performances similaires")
        print("  → Exclusion des contradictions n'améliore pas significativement")
    
    if metrics_c['accuracy'] > metrics_b['accuracy']:
        print("• Scénario C (non-ambigus) performe mieux")
        print("  → Les cas ambigus dégradent effectivement les métriques")
    else:
        print("• Scénario C ne performe pas mieux")
        print("  → L'ambiguïté n'est pas le facteur principal")
    
    if metrics_a['pollution_rate'] < metrics_b['pollution_rate']:
        print("• Scénario A réduit la pollution")
        print("  → Exclusion des contradictions nettoie les métriques")

def main():
    print("🚀 ANALYSE DE SENSIBILITÉ AUX LABELS - SCÉNARIOS A/B/C")
    print("=" * 65)
    
    # Charger les données
    holdout_dataset, human_labels, v2f_predictions, contradictions = load_data()
    
    # Créer les 3 scénarios
    true_a, pred_a, ids_a, metrics_a = create_scenario_a(holdout_dataset, human_labels, v2f_predictions, contradictions)
    true_b, pred_b, ids_b, metrics_b = create_scenario_b(holdout_dataset, human_labels, v2f_predictions)
    true_c, pred_c, ids_c, metrics_c = create_scenario_c(holdout_dataset, human_labels, v2f_predictions, contradictions)
    
    # Comparer les scénarios
    compare_scenarios(metrics_a, metrics_b, metrics_c)
    
    print(f"\n🎯 CONCLUSIONS POUR DÉVELOPPEMENT V2G:")
    print("─" * 40)
    print("• Scénario B (Gold V1) = référence actuelle")
    print("• Scénario A montre l'impact des corrections de labels")
    print("• Scénario C évalue le coût de l'ambiguïté")
    print("• V2G devrait cibler les patterns révélés par ces analyses")
    
    # Sauvegarde
    results = {
        'analysis_date': '2026-09-24',
        'scenarios': {
            'A_certain_labels': {
                'description': 'Labels certains uniquement - contradictions exclues',
                'sample_count': len(true_a),
                'metrics': metrics_a,
                'sample_ids': ids_a[:20]  # Premiers 20 pour référence
            },
            'B_gold_v1': {
                'description': 'Tous labels adjudiqués (Gold V1 = Holdout original)',
                'sample_count': len(true_b),
                'metrics': metrics_b
            },
            'C_non_ambiguous': {
                'description': 'Cas ambigus exclus (analyse uniquement)',
                'sample_count': len(true_c),
                'metrics': metrics_c,
                'warning': 'Analysis only - does not replace complete dataset'
            }
        },
        'key_findings': {
            'scenarios_a_b_similar': abs(metrics_a['accuracy'] - metrics_b['accuracy']) < 0.01,
            'scenario_c_better': metrics_c['accuracy'] > metrics_b['accuracy'],
            'contradiction_impact': len(contradictions),
            'ambiguity_cost': metrics_b['accuracy'] - metrics_c['accuracy'] if metrics_c['accuracy'] < metrics_b['accuracy'] else 0
        }
    }
    
    with open('sensitivity_analysis_abc.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Analyse sauvegardée: sensitivity_analysis_abc.json")
    
    return results

if __name__ == '__main__':
    main()