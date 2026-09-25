# V2G VERSION CONTROL - VALIDATION PROTOCOL

## 🔒 FROZEN VERSIONS

### V2F ORIGINAL (FROZEN)
- **File**: `src/lib/intentClassifierV2F_frozen_backup.js` ✅ Created
- **Status**: FROZEN - DO NOT MODIFY
- **Version**: Pre-modifications baseline
- **Performance**: 53.8% accuracy on holdout-221

### V2G CURRENT (FROZEN FOR VALIDATION)
- **File**: `src/lib/intentClassifierV2F.js` (current modifications)
- **Status**: FROZEN FOR VALIDATION - NO MODIFICATIONS ALLOWED
- **Version**: All recent modifications (rules, thresholds, signals)
- **Freeze Date**: 2026-09-24 16:00 UTC
- **Git Hash**: N/A (manual backup system)

## 📋 V2F → V2G DOCUMENTED CHANGES

### 1. Context Rules
- Added government source detection
- Critical patterns for .gov.bf domains
- Communication vs market distinction

### 2. Market Signals Enhancement  
- Added: mobilier, infrastructure, construction, matériel
- Added: véhicules, ambulances, panneaux solaires, bitumage
- Added: réhabilitation, équipement

### 3. Threshold Changes
- **CRITICAL**: validThreshold 1.5 → 2.0
- Gray zone management 1.5-3.0

### 4. Score=0 Logic Recalibration
- Less punitive default (REVIEW instead of REJECTED)
- Enhanced market signal detection for zero scores

### 5. Function Signature
- Added `source` parameter to classifyWithIntentAnalysisV2F

### 6. Ambiguity Detection
- Suspicious patterns for government contexts
- Force REVIEW for ambiguous cases

## ⚠️ VALIDATION PROTOCOL RULES

### ABSOLUTELY FORBIDDEN DURING VALIDATION:
- ❌ Modify any threshold
- ❌ Adjust any weight 
- ❌ Add new rules
- ❌ Change keywords
- ❌ Alter decision logic
- ❌ Fix specific errors discovered

### ONLY ALLOWED:
- ✅ Execute V2G on test data
- ✅ Record predictions
- ✅ Calculate metrics
- ✅ Document errors
- ✅ Compare with V2F baseline

## 📊 VALIDATION TARGETS

1. **Holdout-221 Validation**: Real execution on original holdout dataset
2. **V2F vs V2G Comparison**: Side-by-side on same 221 cases  
3. **Blind Set ≥100**: New dataset never used for development
4. **Strict Criteria**: <5% pollution, ≥95% recall VALID

## 🎯 SUCCESS CRITERIA

**V2G is NOT production-ready unless:**
- Pollution rate < 5% (formally defined)
- VALID recall ≥ 95%
- No critical regressions vs V2F
- Blind set validation passes
- All metrics calculated on real executions (not estimates)

---
**FROZEN FOR VALIDATION - NO MODIFICATIONS ALLOWED**
*Validation Start: 2026-09-24 16:00*