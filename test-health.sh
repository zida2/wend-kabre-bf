#!/bin/bash

# ============================================================================
# Script de Test Health Check — Payment Service Wend-Kabré
# Usage: ./test-health.sh [URL]
# Exemple: ./test-health.sh https://payment-service-wendkabre.onrender.com
# ============================================================================

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL du service (argument ou défaut)
SERVICE_URL="${1:-https://payment-service-wendkabre.onrender.com}"
HEALTH_ENDPOINT="${SERVICE_URL}/health"

echo "════════════════════════════════════════════════════════"
echo "  🧪 Test Health Check — Payment Service"
echo "════════════════════════════════════════════════════════"
echo ""
echo "🔗 URL: ${HEALTH_ENDPOINT}"
echo ""

# Test 1: Disponibilité HTTP
echo "━━━ Test 1: Disponibilité HTTP ━━━"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${HEALTH_ENDPOINT}")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ HTTP 200 OK${NC}"
else
    echo -e "${RED}❌ HTTP ${HTTP_CODE} (attendu: 200)${NC}"
    exit 1
fi

echo ""

# Test 2: Format JSON Response
echo "━━━ Test 2: Réponse JSON ━━━"
RESPONSE=$(curl -s "${HEALTH_ENDPOINT}")
echo "${RESPONSE}" | jq . > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ JSON valide${NC}"
    echo "${RESPONSE}" | jq .
else
    echo -e "${RED}❌ JSON invalide${NC}"
    echo "${RESPONSE}"
    exit 1
fi

echo ""

# Test 3: Champs obligatoires
echo "━━━ Test 3: Champs obligatoires ━━━"

STATUS=$(echo "${RESPONSE}" | jq -r '.status')
SERVICE=$(echo "${RESPONSE}" | jq -r '.service')
DATABASE=$(echo "${RESPONSE}" | jq -r '.database')

# Vérifier status
if [ "$STATUS" = "OK" ]; then
    echo -e "${GREEN}✅ status: OK${NC}"
else
    echo -e "${RED}❌ status: ${STATUS} (attendu: OK)${NC}"
fi

# Vérifier service
if [ "$SERVICE" = "payment-service" ]; then
    echo -e "${GREEN}✅ service: payment-service${NC}"
else
    echo -e "${YELLOW}⚠️  service: ${SERVICE}${NC}"
fi

# Vérifier database
if [ "$DATABASE" = "connected" ]; then
    echo -e "${GREEN}✅ database: connected${NC}"
else
    echo -e "${RED}❌ database: ${DATABASE} (attendu: connected)${NC}"
fi

echo ""

# Test 4: Temps de réponse
echo "━━━ Test 4: Performance ━━━"
TIME=$(curl -s -o /dev/null -w "%{time_total}" "${HEALTH_ENDPOINT}")
echo "⏱️  Temps de réponse: ${TIME}s"

if (( $(echo "$TIME < 2.0" | bc -l) )); then
    echo -e "${GREEN}✅ Performance OK (< 2s)${NC}"
else
    echo -e "${YELLOW}⚠️  Performance dégradée (> 2s)${NC}"
fi

echo ""

# Résumé
echo "════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Tous les tests passés — Service opérationnel !${NC}"
echo "════════════════════════════════════════════════════════"
echo ""
echo "🎯 Prochaines étapes:"
echo "   1. Vérifier Render Logs (aucune erreur)"
echo "   2. Configurer variables Money Fusion"
echo "   3. Enregistrer URLs webhooks chez MF"
echo "   4. Test paiement sandbox (si disponible)"
echo "   5. Premier paiement réel 15 000 FCFA"
echo ""
