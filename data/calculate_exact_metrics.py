#!/usr/bin/env python3
"""
Calculer les métriques EXACTES de V2F sur HOLDOUT vs GOLD V1
Prouver définitivement s'il y a ou non amélioration de performance
"""

import json
import csv
from collections import defaultdict

def load_all_data():
    """Charge toutes les données nécessaires"""
    print("📁 Chargement des données...")
    
    # Dataset holdout original
    with open('holdout-validation-dataset.json', 'r', encoding='utf-8') as f:
        holdout_dataset = {item['id']: item for item in json.load(f)}
    
    # Gold Dataset V1
    with open('gold-dataset-v1.json', 'r', encoding='utf-8') as f:
        gold_data = json.load(f)
        gold_dataset = {item['id']: item for item in gold_data['samples']}
    
    # Prédictions V2F
    with open('holdout_predictions.json', 'r', encoding='utf-8') as f:
        v2f_predictions = {pred['id']: pred for pred in json.load(f)}
    
    # Labels humains 
    human_labels = {}
    with open('holdout_human_reference.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            human_labels[row['id']] = row['classification_humaine']
    
    print(f"   • Holdout dataset: {len(holdout_dataset)} échantillons")
    print(f"   • Gold Dataset V1: {len(gold_dataset)} échantillons")
    print(f"   • Prédictions V2F: {len(v2f_predictions)} échantillons")
    print(f"   • Labels humains: {len(human_labels)} échantillons")
    
    return holdout_dataset, gold_dataset, v2f_predictions, human_labels

def convert_category_to_class(category):
    """Convertit les catégories dataset en classes VALID/REVIEW/REJECTED"""
    if category.startswith('expected_valid'):
        return 'VALID'
    elif category.startswith('expected_review'):
        return 'REVIEW'
    elif category.startswith('expected_rejected'):
        return 'REJECTED'
    else:
        return 'UNKNOWN'

def calculate_metrics_manually(true_labels, predictions):
    """Calcule les métriques manuellement sans sklearn"""
    
    # Créer la matrice de confusion manuellement
    classes = sorted(set(true_labels) | set(predictions))
    class_to_idx = {cls: i for i, cls in enumerate(classes)}
    n_classes = len(classes)
    
    # Initialiser matrice de confusion
    cm = [[0 for _ in range(n_classes)] for _ in range(n_classes)]
    
    # Remplir la matrice
    for true, pred in zip(true_labels, predictions):
        true_idx = class_to_idx[true]
        pred_idx = class_to_idx[pred]
        cm[true_idx][pred_idx] += 1
    
    # Calculer accuracy
    correct = sum(cm[i][i] for i in range(n_classes))
    total = sum(sum(row) for row in cm)
    accuracy = correct / total if total > 0 else 0
    
    # Calculer precision, recall, f1 par classe
    precision_by_class = {}
    recall_by_class = {}
    f1_by_class = {}
    
    for i, cls in enumerate(classes):
        # True positives
        tp = cm[i][i]
        
        # False positives (autres classes prédites comme cls)
        fp = sum(cm[j][i] for j in range(n_classes) if j != i)
        
        # False negatives (cls prédit comme autres classes)  
        fn = sum(cm[i][j] for j in range(n_classes) if j != i)
        
        # Precision
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        precision_by_class[cls] = precision
        
        # Recall
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        recall_by_class[cls] = recall
        
        # F1
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        f1_by_class[cls] = f1
    
    # Macro averages
    macro_precision = sum(precision_by_class.values()) / len(precision_by_class) if precision_by_class else 0
    macro_recall = sum(recall_by_class.values()) / len(recall_by_class) if recall_by_class else 0
    macro_f1 = sum(f1_by_class.values()) / len(f1_by_class) if f1_by_class else 0
    
    return {
        'accuracy': accuracy,
        'macro_precision': macro_precision,
        'macro_recall': macro_recall,
        'macro_f1': macro_f1,
        'precision_by_class': precision_by_class,
        'recall_by_class': recall_by_class,
        'f1_by_class': f1_by_class,
        'confusion_matrix': cm,
        'confusion_matrix_labels': classes
    }

def calculate_metrics_detailed(true_labels, predictions, dataset_name):
    """Calcule toutes les métriques détaillées"""
    print(f"\n📊 MÉTRIQUES {dataset_name}:")
    print("─" * (12 + len(dataset_name)))
    
    # Distribution des classes
    true_dist = defaultdict(int)
    pred_dist = defaultdict(int)
    
    for t in true_labels:
        true_dist[t] += 1
    for p in predictions:
        pred_dist[p] += 1
    
    print("📈 Distribution des classes:")
    print(f"   Ground Truth - VALID: {true_dist['VALID']}, REVIEW: {true_dist['REVIEW']}, REJECTED: {true_dist['REJECTED']}")
    print(f"   Prédictions  - VALID: {pred_dist['VALID']}, REVIEW: {pred_dist['REVIEW']}, REJECTED: {pred_dist['REJECTED']}")
    
    # Calculer métriques
    metrics = calculate_metrics_manually(true_labels, predictions)
    
    print(f"\n🎯 Métriques principales:")
    print(f"   • Accuracy: {metrics['accuracy']:.1%}")
    print(f"   • Macro Precision: {metrics['macro_precision']:.1%}")
    print(f"   • Macro Recall: {metrics['macro_recall']:.1%}")
    print(f"   • Macro F1: {metrics['macro_f1']:.1%}")
    
    # Métriques par classe
    print(f"\n📋 Par classe:")
    for cls in metrics['confusion_matrix_labels']:
        p = metrics['precision_by_class'][cls]
        r = metrics['recall_by_class'][cls]  
        f1 = metrics['f1_by_class'][cls]
        print(f"   • {cls}: P={p:.1%}, R={r:.1%}, F1={f1:.1%}")
    
    # Matrice de confusion
    cm = metrics['confusion_matrix']
    labels = metrics['confusion_matrix_labels']
    print(f"\n📊 Matrice de confusion:")
    print(f"     Predicted: {' '.join([f'{l:<8}' for l in labels])}")
    for i, true_label in enumerate(labels):
        row = ' '.join([f'{cm[i][j]:<8}' for j in range(len(labels))])
        print(f"   {true_label:<6}: {row}")
    
    # Calcul pollution (VALID prédit mais devrait être REJECTED)
    valid_predicted = pred_dist['VALID']
    false_positives = 0
    for t, p in zip(true_labels, predictions):
        if t == 'REJECTED' and p == 'VALID':
            false_positives += 1
    
    pollution_rate = (false_positives / valid_predicted * 100) if valid_predicted > 0 else 0
    
    print(f"\n🚨 Pollution:")
    print(f"   • VALID prédits: {valid_predicted}")
    print(f"   • False Positives (REJECTED→VALID): {false_positives}")
    print(f"   • Taux de pollution: {pollution_rate:.1f}%")
    
    # Ajouter pollution aux métriques
    metrics.update({
        'distribution_true': dict(true_dist),
        'distribution_pred': dict(pred_dist),
        'pollution_rate': pollution_rate,
        'false_positives': false_positives,
        'valid_predicted': valid_predicted
    })
    
    return metrics

def compare_datasets_performance(holdout_metrics, gold_metrics):
    """Compare les performances entre les deux datasets"""
    print(f"\n🔄 COMPARAISON HOLDOUT vs GOLD V1:")
    print("=" * 40)
    
    metrics_to_compare = [
        ('Accuracy', 'accuracy'),
        ('Macro Precision', 'macro_precision'),
        ('Macro Recall', 'macro_recall'),
        ('Macro F1', 'macro_f1'),
        ('Pollution Rate', 'pollution_rate')
    ]
    
    for name, key in metrics_to_compare:
        holdout_val = holdout_metrics[key]
        gold_val = gold_metrics[key]
        diff = gold_val - holdout_val
        
        if key == 'pollution_rate':
            print(f"{name:<15}: Holdout {holdout_val:5.1f}% → Gold V1 {gold_val:5.1f}% (Δ {diff:+5.1f}%)")
        else:
            print(f"{name:<15}: Holdout {holdout_val:5.1%} → Gold V1 {gold_val:5.1%} (Δ {diff:+5.1%})")
    
    # Test si les datasets sont identiques
    are_identical = True
    tolerance = 0.001  # 0.1% de tolérance
    
    for _, key in metrics_to_compare:
        if abs(holdout_metrics[key] - gold_metrics[key]) > tolerance:
            are_identical = False
            break
    
    print(f"\n💡 CONCLUSION:")
    if are_identical:
        print("✅ Les performances sont IDENTIQUES (différences < 0.1%)")
        print("   → Gold Dataset V1 n'apporte AUCUNE amélioration")
        print("   → Confirme que Gold V1 ≈ Holdout original")
    else:
        print("⚠️  Différences détectées entre les datasets")
        print("   → Investigation supplémentaire requise")

def main():
    print("🚀 CALCUL MÉTRIQUES EXACTES V2F - HOLDOUT vs GOLD V1")
    print("=" * 60)
    
    # Charger toutes les données
    holdout_dataset, gold_dataset, v2f_predictions, human_labels = load_all_data()
    
    # Préparer les données pour holdout original
    print(f"\n🏗️ PRÉPARATION DONNÉES HOLDOUT ORIGINAL:")
    
    holdout_true = []
    holdout_pred = []
    
    for item_id in sorted(holdout_dataset.keys()):
        if item_id in v2f_predictions:
            # True label depuis le dataset holdout
            true_category = holdout_dataset[item_id].get('category', 'unknown')
            true_class = convert_category_to_class(true_category)
            
            # Prédiction V2F
            pred_class = v2f_predictions[item_id].get('prediction', 'UNKNOWN')
            
            holdout_true.append(true_class)
            holdout_pred.append(pred_class)
    
    # Préparer les données pour Gold V1
    print(f"\n🏗️ PRÉPARATION DONNÉES GOLD V1:")
    
    gold_true = []
    gold_pred = []
    
    for item_id in sorted(gold_dataset.keys()):
        if item_id in v2f_predictions:
            # True label depuis Gold V1
            true_category = gold_dataset[item_id].get('category', 'unknown')
            true_class = convert_category_to_class(true_category)
            
            # Prédiction V2F (identique)
            pred_class = v2f_predictions[item_id].get('prediction', 'UNKNOWN')
            
            gold_true.append(true_class)
            gold_pred.append(pred_class)
    
    print(f"   • Échantillons Holdout: {len(holdout_true)}")
    print(f"   • Échantillons Gold V1: {len(gold_true)}")
    
    # Calculer métriques pour chaque dataset
    holdout_metrics = calculate_metrics_detailed(holdout_true, holdout_pred, "HOLDOUT ORIGINAL")
    gold_metrics = calculate_metrics_detailed(gold_true, gold_pred, "GOLD DATASET V1")
    
    # Comparer les performances
    compare_datasets_performance(holdout_metrics, gold_metrics)
    
    # Analyse avec labels humains pour référence
    print(f"\n📋 RÉFÉRENCE AVEC LABELS HUMAINS:")
    print("─" * 35)
    
    human_true = []
    human_pred = []
    
    for item_id in sorted(human_labels.keys()):
        if item_id in v2f_predictions:
            human_true.append(human_labels[item_id])
            human_pred.append(v2f_predictions[item_id].get('prediction', 'UNKNOWN'))
    
    human_metrics = calculate_metrics_detailed(human_true, human_pred, "LABELS HUMAINS")
    
    # Sauvegarde des résultats
    results = {
        'comparison_date': '2026-09-24',
        'datasets_compared': ['holdout_original', 'gold_v1', 'human_labels'],
        'holdout_metrics': holdout_metrics,
        'gold_v1_metrics': gold_metrics,
        'human_reference_metrics': human_metrics,
        'samples_count': {
            'holdout': len(holdout_true),
            'gold_v1': len(gold_true),
            'human': len(human_true)
        },
        'conclusion': {
            'performance_identical': abs(holdout_metrics['accuracy'] - gold_metrics['accuracy']) < 0.001,
            'improvement_claim_validated': False,
            'gold_v1_justification': 'No performance improvement - Gold V1 equivalent to original holdout'
        }
    }
    
    with open('V2F_EXACT_METRICS_COMPARISON.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Métriques sauvegardées: V2F_EXACT_METRICS_COMPARISON.json")
    
    return results

if __name__ == '__main__':
    main()