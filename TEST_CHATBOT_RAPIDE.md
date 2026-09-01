# 🧪 TEST RAPIDE DU CHATBOT

## ⚡ GUIDE DE TEST EN 3 MINUTES

### ÉTAPE 1 : Activer un compte Premium (30 secondes)

1. Ouvrir Firebase Console :
   ```
   https://console.firebase.google.com/project/wend-kabre-bf-2026/firestore
   ```

2. Aller dans `users` collection

3. Choisir un utilisateur (ou créer un nouveau compte)

4. Ajouter/modifier le champ :
   ```
   isSubscribed: true (boolean)
   ```

5. Sauvegarder

### ÉTAPE 2 : Se connecter (15 secondes)

1. Aller sur votre site : `http://localhost:3000/connexion` (ou le site en production)

2. Se connecter avec les identifiants du compte Premium

3. Vérifier que vous voyez "Assistant IA 🤖" dans la navbar

### ÉTAPE 3 : Tester le chatbot (2 minutes)

1. Cliquer sur "Assistant IA 🤖"

2. **Premier message** (peut prendre 20 secondes) :
   ```
   Quels documents fournir pour un marché de 50 millions ?
   ```
   
   **Résultat attendu** :
   - Si le modèle dort : Message "Je suis en train de me réveiller..."
   - Attendre 20 secondes
   - Renvoyer le message
   - Réponse sur les pièces ARCOP

3. **Deuxième message** (immédiat) :
   ```
   Comment structurer la méthodologie ?
   ```
   
   **Résultat attendu** :
   - Réponse immédiate
   - Conseils sur rédaction offre technique

4. **Vérifier la référence au Guide** :
   ```
   Quels sont les seuils de marchés publics ?
   ```
   
   **Résultat attendu** :
   - Réponse avec seuils ARCOP 2024-2025
   - Mention du Guide de Soumission

---

## ✅ CHECKLIST DE VÉRIFICATION

### Navigation
- [ ] Lien "Assistant IA 🤖" visible dans navbar desktop
- [ ] Lien "Assistant IA 🤖" visible dans navbar mobile
- [ ] Clic sur le lien amène à `/assistant`

### Accès Premium
- [ ] Utilisateur non connecté → Message "Connexion requise"
- [ ] Utilisateur non-Premium → Modal "Fonctionnalité Premium"
- [ ] Utilisateur Premium → Accès au chat

### Fonctionnement du chat
- [ ] Premier message : Peut afficher message d'attente (20s)
- [ ] Messages suivants : Réponses immédiates
- [ ] Formatage des réponses : Lisible et structuré
- [ ] Auto-scroll : Fenêtre descend automatiquement
- [ ] Loading state : Animation de 3 points visible

### Contenu des réponses
- [ ] Répond en français
- [ ] Fait référence à ARCOP 2024-2025
- [ ] Cite les articles de loi
- [ ] Peut rediriger vers /guide-soumission
- [ ] Ton professionnel

### Gestion d'erreurs
- [ ] Erreur réseau : Message clair
- [ ] Modèle en chargement : Message informatif
- [ ] Erreur serveur : Détail technique affiché

---

## 🎬 SCÉNARIOS DE TEST

### Scénario 1 : Nouvel utilisateur non-Premium
1. Créer un compte → `isSubscribed: false`
2. Se connecter
3. Aller sur `/assistant`
4. **Attendu** : Modal Premium, bouton vers `/tarifs`

### Scénario 2 : Utilisateur Premium, première utilisation
1. Compte avec `isSubscribed: true`
2. Se connecter
3. Aller sur `/assistant`
4. Envoyer un message
5. **Attendu** : 
   - Message d'attente si modèle froid
   - Ou réponse immédiate si modèle chaud

### Scénario 3 : Conversation multiple
1. Envoyer 5 messages différents
2. **Attendu** : 
   - Historique complet visible
   - Scroll automatique
   - Alternance user/bot cohérente

### Scénario 4 : Questions ARCOP spécifiques
1. "Quels sont les seuils de marchés ?"
2. "Quelles pièces fournir ?"
3. "Comment calculer la préférence nationale ?"
4. **Attendu** :
   - Réponses conformes à ARCOP 2024-2025
   - Citations des textes de loi
   - Références au Guide de Soumission

---

## 🐛 PROBLÈMES POSSIBLES ET SOLUTIONS

### ❌ "Le lien Assistant IA n'apparaît pas"
**Solution** : 
```bash
git pull origin master
# Vérifier que vous êtes sur le commit 3da020b ou ultérieur
git log --oneline -3
```

### ❌ "Erreur 403 Forbidden"
**Solution** : Vérifier dans Firebase que `isSubscribed: true` (PAS `isPremium`)

### ❌ "Modèle loading forever"
**Solution** : 
1. Attendre 30 secondes complètes
2. Réessayer le message
3. Si ça persiste, vérifier les logs serveur

### ❌ "Erreur 500 Internal Server Error"
**Solution** :
1. Vérifier les logs : `npm run dev` dans le terminal
2. Vérifier que l'API Hugging Face est accessible
3. Tester manuellement : 
   ```bash
   curl https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium
   ```

---

## 📊 RÉSULTATS ATTENDUS

### Performance
- Premier message : 0-20 secondes
- Messages suivants : 1-3 secondes
- Scroll : Instantané
- Affichage : Fluide

### Qualité des réponses
- Pertinence : ⭐⭐⭐⭐ (4/5)
- Précision ARCOP : ⭐⭐⭐⭐ (4/5)
- Ton professionnel : ⭐⭐⭐⭐⭐ (5/5)
- Français : ⭐⭐⭐⭐ (4/5)

---

## 🎯 QUESTIONS DE TEST RECOMMANDÉES

### Questions simples
1. "Bonjour, comment ça va ?"
2. "Qu'est-ce qu'un marché public ?"
3. "C'est quoi l'ARCOP ?"

### Questions techniques
4. "Quels sont les seuils de marchés publics ?"
5. "Quelles pièces fournir pour un marché de 50 millions ?"
6. "Comment calculer la préférence nationale PME ?"

### Questions complexes
7. "Comment structurer une offre technique pour un marché de travaux de 200 millions ?"
8. "Quelle est la différence entre cotation formelle et demande de prix ?"
9. "Quels sont les délais de soumission selon les seuils ?"

### Questions hors sujet (pour tester les limites)
10. "Quel est le meilleur restaurant à Ouagadougou ?"
    - **Attendu** : Redirection vers sujet marchés publics

---

## ✅ TEST RÉUSSI SI :

- [x] Navigation fonctionne
- [x] Accès Premium vérifié
- [x] Premier message affiché (même si attente)
- [x] Messages suivants immédiats
- [x] Réponses pertinentes sur ARCOP
- [x] Interface fluide et professionnelle
- [x] Gestion d'erreurs claire

---

**Temps total de test** : 3-5 minutes
**Complexité** : 🟢 Facile
**Prérequis** : Compte Firebase avec `isSubscribed: true`

🎉 **Bon test !**
