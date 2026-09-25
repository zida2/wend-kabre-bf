#!/usr/bin/env python3
"""
Analyse complète de la matrice de confusion V2F vs labels humains
Focus sur l'impact métier réel pour Wend-Kabré
"""

import json
import csv
from collections import defaultdict

def load_data():
    """Charge toutes les données nécessaires"""
    print("📁 Chargement des données...")
    
    # Prédictions V2F
    with open('holdout_predictions.json', 'r', encoding='utf-8') as f:
        v2f_predictions = {pred['id']: pred for pred in json.load(f)}
    
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
    
    # Dataset holdout pour textes complets
    with open('holdout-validation-dataset.json', 'r', encoding='utf-8') as f:
        holdout_dataset = {item['id']: item for item in json.load(f)}
    
    print(f"   • Prédictions V2F: {len(v2f_predictions)}")
    print(f"   • Labels humains: {len(human_labels)}")
    print(f"   • Textes holdout: {len(holdout_dataset)}")
    
    return v2f_predictions, human_labels, holdout_dataset

def create_detailed_confusion_matrix(v2f_predictions, human_labels):
    """Crée la matrice de confusion détaillée avec métriques par classe"""
    print("\n📊 CRÉATION MATRICE DE CONFUSION DÉTAILLÉE")
    print("=" * 45)
    
    # Préparer les données alignées
    true_labels = []
    pred_labels = []
    sample_ids = []
    
    for item_id in sorted(human_labels.keys()):
        if item_id in v2f_predictions:
            true_labels.append(human_labels[item_id]['classification'])
            pred_labels.append(v2f_predictions[item_id]['prediction'])
            sample_ids.append(item_id)
    
    # Classes présentes
    all_classes = sorted(set(true_labels) | set(pred_labels))
    print(f"Classes détectées: {all_classes}")
    
    # Construire matrice de confusion manuelle
    class_to_idx = {cls: i for i, cls in enumerate(all_classes)}
    n_classes = len(all_classes)
    
    confusion_matrix = [[0 for _ in range(n_classes)] for _ in range(n_classes)]
    
    # Remplir la matrice
    for true_label, pred_label in zip(true_labels, pred_labels):
        true_idx = class_to_idx[true_label]
        pred_idx = class_to_idx[pred_label]
        confusion_matrix[true_idx][pred_idx] += 1
    
    # Affichage matrice
    print(f"\n📋 MATRICE DE CONFUSION V2F vs LABELS HUMAINS:")
    print("─" * 60)
    
    # Header
    header = "                 |" + "|".join([f"{cls:>10}" for cls in all_classes])
    print(header)
    print("─" * len(header))
    
    # Lignes
    for i, true_class in enumerate(all_classes):
        row_data = "|".join([f"{confusion_matrix[i][j]:>10}" for j in range(n_classes)])
        print(f"{true_class:>15} |{row_data}")
    
    return confusion_matrix, all_classes, true_labels, pred_labels, sample_ids

def calculate_metrics_per_class(confusion_matrix, all_classes):
    """Calcule précision, recall, F1 et support pour chaque classe"""
    print(f"\n📊 MÉTRIQUES DÉTAILLÉES PAR CLASSE:")
    print("─" * 40)
    
    n_classes = len(all_classes)
    metrics = {}
    
    for i, cls in enumerate(all_classes):
        # True positives
        tp = confusion_matrix[i][i]
        
        # False positives (autres classes prédites comme cls)
        fp = sum(confusion_matrix[j][i] for j in range(n_classes) if j != i)
        
        # False negatives (cls prédit comme autres classes)
        fn = sum(confusion_matrix[i][j] for j in range(n_classes) if j != i)
        
        # True negatives (tout le reste)
        tn = sum(confusion_matrix[j][k] 
                for j in range(n_classes) for k in range(n_classes)
                if j != i and k != i)
        
        # Support (nombre d'échantillons réels de cette classe)
        support = sum(confusion_matrix[i][j] for j in range(n_classes))
        
        # Métriques
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        
        # Spécificité (important pour évaluer les faux positifs)
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
        
        metrics[cls] = {
            'precision': precision,
            'recall': recall,
            'f1': f1,
            'specificity': specificity,
            'support': support,
            'tp': tp,
            'fp': fp,
            'fn': fn,
            'tn': tn
        }
        
        print(f"{cls:>12}: Prec={precision:5.1%} Rec={recall:5.1%} F1={f1:5.1%} Spec={specificity:5.1%} Support={support:>3}")
    
    return metrics

def analyze_business_impact(metrics, confusion_matrix, all_classes):
    """Analyse l'impact métier selon le contexte Wend-Kabré"""
    print(f"\n🏢 ANALYSE D'IMPACT MÉTIER WEND-KABRÉ:")
    print("=" * 40)
    
    # Classification des risques par type d'erreur
    business_risks = {}
    
    # Index des classes
    class_to_idx = {cls: i for i, cls in enumerate(all_classes)}
    
    # Analyser les erreurs critiques
    critical_errors = []
    major_errors = []
    moderate_errors = []
    
    for i, true_class in enumerate(all_classes):
        for j, pred_class in enumerate(all_classes):
            if i != j and confusion_matrix[i][j] > 0:  # Il y a des erreurs
                error_count = confusion_matrix[i][j]
                error_type = f"{true_class} → {pred_class}"
                
                # Classification du risque métier
                risk_level = classify_business_risk(true_class, pred_class)
                
                error_info = {
                    'error_type': error_type,
                    'count': error_count,
                    'risk_level': risk_level,
                    'true_class': true_class,
                    'predicted_class': pred_class
                }
                
                if risk_level == 'CRITIQUE':
                    critical_errors.append(error_info)
                elif risk_level == 'MAJEURE':
                    major_errors.append(error_info)
                else:
                    moderate_errors.append(error_info)
    
    # Affichage par niveau de risque
    print(f"🚨 ERREURS CRITIQUES ({len(critical_errors)}):")
    for error in sorted(critical_errors, key=lambda x: x['count'], reverse=True):
        print(f"   • {error['error_type']}: {error['count']} cas - {get_risk_explanation(error['true_class'], error['predicted_class'])}")
    
    print(f"\n⚠️  ERREURS MAJEURES ({len(major_errors)}):")
    for error in sorted(major_errors, key=lambda x: x['count'], reverse=True):
        print(f"   • {error['error_type']}: {error['count']} cas - {get_risk_explanation(error['true_class'], error['predicted_class'])}")
    
    print(f"\n📋 ERREURS MODÉRÉES ({len(moderate_errors)}):")
    for error in sorted(moderate_errors, key=lambda x: x['count'], reverse=True)[:10]:  # Top 10
        print(f"   • {error['error_type']}: {error['count']} cas")
    
    if len(moderate_errors) > 10:
        print(f"   ... et {len(moderate_errors) - 10} autres erreurs modérées")
    
    return {
        'critical_errors': critical_errors,
        'major_errors': major_errors,
        'moderate_errors': moderate_errors
    }

def classify_business_risk(true_class, predicted_class):
    """Classifie le niveau de risque métier pour Wend-Kabré"""
    
    # CRITIQUE: Non-marchés envoyés dans le dashboard comme opportunités
    if predicted_class == 'VALID' and true_class == 'REJECTED':
        return 'CRITIQUE'
    
    # MAJEURE: Opportunités perdues ou pollution significative
    if (true_class == 'VALID' and predicted_class == 'REJECTED') or \
       (predicted_class == 'VALID' and true_class == 'REVIEW'):
        return 'MAJEURE'
    
    # MODÉRÉE: Classifications sous-optimales mais récupérables
    if (true_class == 'VALID' and predicted_class == 'REVIEW') or \
       (true_class == 'REVIEW' and predicted_class in ['VALID', 'REJECTED']) or \
       (true_class == 'REJECTED' and predicted_class == 'REVIEW'):
        return 'MODÉRÉE'
    
    return 'FAIBLE'

def get_risk_explanation(true_class, predicted_class):
    """Explique pourquoi cette erreur est risquée"""
    if predicted_class == 'VALID' and true_class == 'REJECTED':
        return "Pollution dashboard - non-marché affiché comme opportunité"
    elif true_class == 'VALID' and predicted_class == 'REJECTED':
        return "Opportunité manquée - marché rejeté par erreur"
    elif predicted_class == 'VALID' and true_class == 'REVIEW':
        return "Pollution modérée - cas ambigu affiché comme sûr"
    elif true_class == 'VALID' and predicted_class == 'REVIEW':
        return "Retard traitement - opportunité en file d'attente"
    else:
        return "Impact métier limité"

def calculate_pollution_detailed(confusion_matrix, all_classes, metrics):
    """Calcule la pollution avec plusieurs définitions"""
    print(f"\n🔍 ANALYSE DÉTAILLÉE DE LA POLLUTION:")
    print("=" * 40)
    
    class_to_idx = {cls: i for i, cls in enumerate(all_classes)}
    
    if 'VALID' in class_to_idx and 'REJECTED' in class_to_idx:
        valid_idx = class_to_idx['VALID']
        rejected_idx = class_to_idx['REJECTED']
        
        # Échantillons prédits VALID
        total_predicted_valid = sum(confusion_matrix[i][valid_idx] for i in range(len(all_classes)))
        
        # Faux positifs REJECTED → VALID
        false_positives_rejected_to_valid = confusion_matrix[rejected_idx][valid_idx]
        
        # Pollution classique
        pollution_classic = (false_positives_rejected_to_valid / total_predicted_valid * 100) if total_predicted_valid > 0 else 0
        
        print(f"📊 FORMULES DE POLLUTION:")
        print(f"   • Total prédit VALID: {total_predicted_valid}")
        print(f"   • Faux positifs (REJECTED→VALID): {false_positives_rejected_to_valid}")
        print(f"   • Pollution classique: {pollution_classic:.1f}%")
        print(f"   • VALID Precision: {metrics.get('VALID', {}).get('precision', 0):.1%}")
        print(f"   • VALID Recall: {metrics.get('VALID', {}).get('recall', 0):.1%}")
        
        # Pollution étendue (inclut REVIEW → VALID si applicable)
        if 'REVIEW' in class_to_idx:
            review_idx = class_to_idx['REVIEW']
            false_positives_review_to_valid = confusion_matrix[review_idx][valid_idx]
            total_false_positives = false_positives_rejected_to_valid + false_positives_review_to_valid
            pollution_extended = (total_false_positives / total_predicted_valid * 100) if total_predicted_valid > 0 else 0
            
            print(f"   • Faux positifs (REVIEW→VALID): {false_positives_review_to_valid}")
            print(f"   • Pollution étendue: {pollution_extended:.1f}%")
        
        return {
            'total_predicted_valid': total_predicted_valid,
            'false_positives_rejected': false_positives_rejected_to_valid,
            'pollution_classic': pollution_classic,
            'valid_precision': metrics.get('VALID', {}).get('precision', 0),
            'valid_recall': metrics.get('VALID', {}).get('recall', 0)
        }
    else:
        print("   ⚠️  Classes VALID/REJECTED non trouvées pour calcul pollution")
        return {}

def main():
    print("🚀 ANALYSE MATRICE CONFUSION V2F - IMPACT MÉTIER")
    print("=" * 55)
    
    # Charger les données
    v2f_predictions, human_labels, holdout_dataset = load_data()
    
    # Créer matrice de confusion détaillée
    confusion_matrix, all_classes, true_labels, pred_labels, sample_ids = create_detailed_confusion_matrix(v2f_predictions, human_labels)
    
    # Calculer métriques par classe
    metrics = calculate_metrics_per_class(confusion_matrix, all_classes)
    
    # Analyser l'impact métier
    business_impact = analyze_business_impact(metrics, confusion_matrix, all_classes)
    
    # Analyser la pollution en détail
    pollution_analysis = calculate_pollution_detailed(confusion_matrix, all_classes, metrics)
    
    # Calculer accuracy globale pour référence
    total_samples = len(true_labels)
    correct_predictions = sum(1 for t, p in zip(true_labels, pred_labels) if t == p)
    overall_accuracy = correct_predictions / total_samples if total_samples > 0 else 0
    
    print(f"\n📊 RÉSUMÉ GLOBAL:")
    print("─" * 15)
    print(f"   • Échantillons analysés: {total_samples}")
    print(f"   • Accuracy globale: {overall_accuracy:.1%}")
    print(f"   • Classes détectées: {len(all_classes)}")
    print(f"   • Erreurs critiques: {len(business_impact['critical_errors'])}")
    print(f"   • Erreurs majeures: {len(business_impact['major_errors'])}")
    
    # Sauvegarde des résultats
    results = {
        'analysis_date': '2026-09-24',
        'total_samples': total_samples,
        'overall_accuracy': overall_accuracy,
        'classes': all_classes,
        'confusion_matrix': confusion_matrix,
        'metrics_per_class': metrics,
        'business_impact': business_impact,
        'pollution_analysis': pollution_analysis,
        'sample_ids': sample_ids
    }
    
    with open('v2f_confusion_matrix_detailed.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Analyse sauvegardée: v2f_confusion_matrix_detailed.json")
    
    return results

if __name__ == '__main__':
    main()