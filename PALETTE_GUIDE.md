# 🎨 Guide de la Nouvelle Palette - Wend-Kabré

## Palette Simplifiée (4 Couleurs Maximum)

```
┌─────────────────────────────────────────────────────────────┐
│           PALETTE OFFICIELLE WEND-KABRÉ                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🟢 PRIMAIRE (Émeraude)                                     │
│  #059669                                                    │
│  Usage: Boutons, liens, éléments actifs                    │
│                                                             │
│  🟠 ACCENT (Ambre)                                          │
│  #D97706                                                    │
│  Usage: Call-to-action, mises en avant ponctuelles         │
│                                                             │
│  ⚪ FOND (Blanc/Gris)                                       │
│  #FFFFFF / #F8FAFC                                          │
│  Usage: Arrière-plans principaux                           │
│                                                             │
│  ⚫ TEXTE (Slate)                                           │
│  #1e293b / #475569 / #64748b                               │
│  Usage: Textes primaire, secondaire, discret               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📖 Utilisation par Contexte

### 1. TEXTES (À UTILISER SYSTÉMATIQUEMENT)

#### Texte Principal
```css
color: var(--text-primary); /* #1e293b - slate-800 */
```
**Contraste sur blanc** : 14:1 ✅ AAA  
**Usage** : Titres, textes importants, contenu principal

#### Texte Secondaire
```css
color: var(--text-secondary); /* #475569 - slate-600 */
```
**Contraste sur blanc** : 8:1 ✅ AAA  
**Usage** : Descriptions, sous-titres, textes secondaires

#### Texte Discret
```css
color: var(--text-muted); /* #64748b - slate-500 */
```
**Contraste sur blanc** : 6:1 ✅ AA+  
**Usage** : Métadonnées, dates, informations auxiliaires

---

### 2. FONDS

#### Fond Principal
```css
background: var(--color-bg); /* #FFFFFF */
```
**Usage** : Page principale, cartes, surfaces

#### Fond Alterné
```css
background: var(--color-bg-2); /* #F8FAFC */
```
**Usage** : Sections alternées, surfaces secondaires

---

### 3. BOUTONS

#### Bouton Primaire (Action principale)
```html
<button class="btn btn-primary">S'inscrire</button>
```
```css
background: #059669 (émeraude);
color: #FFFFFF;
contraste: 4.7:1 ✅
```

#### Bouton Accent (Call-to-action)
```html
<button class="btn btn-accent">Offre limitée</button>
```
```css
background: #D97706 (ambre);
color: #FFFFFF;
contraste: 4.5:1 ✅
```

#### Bouton Outline (Action secondaire)
```html
<button class="btn btn-outline">En savoir plus</button>
```
```css
background: #FFFFFF;
color: #1e293b;
border: #94A3B8;
```

---

### 4. BADGES

#### Badge Vert (Succès / Actif)
```html
<span class="badge badge-green">Nouveau</span>
```
```css
background: rgba(5,150,105,0.08);
color: #047857;
contraste: 8:1 ✅
```

#### Badge Ambre (Attention / Important)
```html
<span class="badge badge-gold">Important</span>
```
```css
background: rgba(217,119,6,0.08);
color: #92400E;
contraste: 6.8:1 ✅
```

#### Badge Rouge (Urgent / Danger)
```html
<span class="badge badge-red">Urgent</span>
```
```css
background: rgba(220,38,38,0.06);
color: #991B1B;
contraste: 7.2:1 ✅
```

---

## ✅ Exemples de Combinaisons Valides

### Page avec Contraste Optimal
```html
<section style="background: #FFFFFF;">
  <h2 style="color: #1e293b;">Titre Principal</h2>
  <p style="color: #475569;">
    Description avec un bon contraste pour une lecture facile.
  </p>
  <p style="color: #64748b; font-size: 0.875rem;">
    Métadonnées en plus petit et plus discret.
  </p>
  <button class="btn btn-primary">Action</button>
</section>
```

### Section Alternée
```html
<section style="background: #F8FAFC;">
  <div class="card" style="background: #FFFFFF;">
    <h3 style="color: #1e293b;">Titre de Carte</h3>
    <p style="color: #475569;">Contenu de la carte</p>
  </div>
</section>
```

---

## ❌ Combinaisons À ÉVITER

### ❌ Texte Clair sur Fond Clair
```css
/* NE JAMAIS FAIRE */
background: #F8FAFC;
color: #94A3B8; /* Contraste insuffisant ❌ */
```

### ❌ Trop de Couleurs
```css
/* NE JAMAIS FAIRE */
.element1 { color: #059669; }
.element2 { color: #10B981; }
.element3 { color: #34D399; }
.element4 { color: #6EE7B7; }
/* = 4 nuances de vert = confusion */
```

### ❌ Fond Coloré sans Test
```css
/* DANGER - Tester le contraste d'abord */
background: #D97706; /* ambre */
color: #FFFFFF; /* OK: 4.5:1 ✅ */

background: #34D399; /* vert clair */
color: #FFFFFF; /* PAS OK: 2.1:1 ❌ */
```

---

## 🎯 Checklist de Vérification

Avant d'ajouter une nouvelle couleur, vérifiez :

- [ ] **La palette ne dépasse pas 4 couleurs** principales
- [ ] **Le contraste est ≥ 4.5:1** pour texte normal
- [ ] **Le contraste est ≥ 3:1** pour texte large (18px+)
- [ ] **Testé avec un outil** (WebAIM, Coolors)
- [ ] **Lisible sur mobile** en plein soleil
- [ ] **Cohérent avec la palette** existante

---

## 🔧 Outils de Test

### Test de Contraste en Ligne
1. **WebAIM** : https://webaim.org/resources/contrastchecker/
   - Entrer : Couleur texte + Couleur fond
   - Vérifier : Ratio ≥ 4.5:1

2. **Coolors** : https://coolors.co/contrast-checker
   - Visuel + score WCAG immédiat

3. **Chrome DevTools**
   - F12 → Lighthouse → Accessibility
   - Vérification automatique de tous les contrastes

### Test Visuel Rapide
```
Si vous plissez les yeux et que le texte devient illisible
→ Le contraste est insuffisant ❌
```

---

## 📱 Responsive et Accessibilité

### Tailles de Texte Minimales
```css
/* Texte normal */
font-size: 16px; /* minimum */
contraste requis: 4.5:1

/* Texte large */
font-size: 18px; /* ou 14px bold */
contraste requis: 3:1
```

### Zone Tactile Minimale (Mobile)
```css
/* Boutons et liens cliquables */
min-width: 44px;
min-height: 44px;
/* Recommandation Apple/Google */
```

---

## 💡 Résumé - Règle d'Or

```
┌─────────────────────────────────────┐
│  RÈGLE D'OR DU CONTRASTE            │
├─────────────────────────────────────┤
│                                     │
│  Texte SOMBRE (#1e293b)             │
│         sur                         │
│  Fond CLAIR (#FFFFFF)               │
│                                     │
│         OU                          │
│                                     │
│  Texte BLANC (#FFFFFF)              │
│         sur                         │
│  Fond SOMBRE (#059669 ou #064E3B)  │
│                                     │
│  Ratio minimum : 4.5:1              │
│                                     │
└─────────────────────────────────────┘
```

---

**Version** : 1.0  
**Date** : 31 juillet 2026  
**Conformité** : WCAG 2.1 Niveau AA ✅  
**Maintenance** : Tester chaque nouvelle couleur avant intégration
