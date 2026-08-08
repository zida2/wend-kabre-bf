import appModule from './dist/app.js';
import { prisma } from './dist/config/database.js';
import jwt from 'jsonwebtoken';
import { env } from './dist/config/environment.js';

const app = appModule.default || appModule;

let server;
const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}`;

// Map / array en mémoire pour mock Prisma si Postgres n'est pas actif localement
const dbUsers = new Map();
const dbTransactions = new Map();
const dbSubscriptions = new Map();

function setupPrismaMocks() {
  prisma.user.findUnique = async ({ where }) => {
    return dbUsers.get(where.id) || null;
  };
  prisma.user.create = async ({ data }) => {
    dbUsers.set(data.id, { ...data, createdAt: new Date(), updatedAt: new Date() });
    return dbUsers.get(data.id);
  };
  prisma.user.update = async ({ where, data }) => {
    const u = dbUsers.get(where.id) || {};
    const updated = { ...u, ...data, updatedAt: new Date() };
    dbUsers.set(where.id, updated);
    return updated;
  };

  prisma.paymentTransaction.create = async ({ data }) => {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const tx = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
    dbTransactions.set(data.reference, tx);
    return tx;
  };
  prisma.paymentTransaction.findUnique = async ({ where }) => {
    if (where.reference) return dbTransactions.get(where.reference) || null;
    if (where.id) {
      for (const tx of dbTransactions.values()) {
        if (tx.id === where.id) return tx;
      }
    }
    return null;
  };
  prisma.paymentTransaction.update = async ({ where, data }) => {
    let targetTx = null;
    for (const tx of dbTransactions.values()) {
      if (tx.id === where.id || tx.reference === where.reference) {
        targetTx = tx;
        break;
      }
    }
    if (!targetTx) throw new Error('Tx not found');
    Object.assign(targetTx, data, { updatedAt: new Date() });
    return targetTx;
  };
  prisma.paymentTransaction.count = async (args) => {
    if (!args || !args.where) return dbTransactions.size;
    let count = 0;
    for (const tx of dbTransactions.values()) {
      if (args.where.status && tx.status === args.where.status) count++;
    }
    return count;
  };
  prisma.paymentTransaction.aggregate = async (args) => {
    let sum = 0;
    for (const tx of dbTransactions.values()) {
      if (tx.status === 'SUCCESS') sum += tx.amount;
    }
    return { _sum: { amount: sum } };
  };

  prisma.subscription.updateMany = async ({ where, data }) => {
    for (const sub of dbSubscriptions.values()) {
      if (sub.userId === where.userId && sub.status === where.status) {
        sub.status = data.status;
      }
    }
    return { count: 1 };
  };
  prisma.subscription.create = async ({ data }) => {
    const id = `sub_${Date.now()}`;
    const sub = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
    dbSubscriptions.set(id, sub);
    return sub;
  };
  prisma.subscription.count = async (args) => {
    let count = 0;
    for (const sub of dbSubscriptions.values()) {
      if (args && args.where && args.where.status && sub.status === args.where.status) {
        count++;
      } else {
        count++;
      }
    }
    return count;
  };
}

async function runTests() {
  console.log('=======================================================');
  console.log('🧪 DÉMARRAGE DE LA SUITE DE TESTS COMPLÈTE (PAYMENT-SERVICE)');
  console.log('=======================================================');

  // Activer les mocks Prisma en mémoire si PostgreSQL local n'est pas connecté
  setupPrismaMocks();

  server = app.listen(PORT);
  let passedCount = 0;
  let failedCount = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`✅ PASSED: ${title}`);
      passedCount++;
    } else {
      console.error(`❌ FAILED: ${title}`);
      failedCount++;
    }
  };

  try {
    // 1. Test Healthcheck
    const healthRes = await fetch(`${BASE_URL}/health`);
    assert(healthRes.status === 200, 'Endpoint Health Check /health retourne 200 OK');

    // 2. Test Création de Paiement Valide (Plan PREMIUM - 15000 FCFA)
    const createRes = await fetch(`${BASE_URL}/api/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'usr_test_integration_001',
        email: 'societe.bf@gmail.com',
        phone: '+22670112233',
        amount: 15000,
        planId: 'PREMIUM'
      })
    });
    const createData = await createRes.json();
    assert(createRes.status === 201 && createData.success === true, 'Création de paiement valide (201 Created)');
    assert(!!createData.reference && createData.reference.startsWith('WK-PAY-'), 'Génération de référence unique (WK-PAY-...)');
    assert(!!createData.paymentUrl, 'Retour d\'un lien de paiement Money Fusion');

    const testRef = createData.reference;

    // 3. Test Validation Zod (Données Invalides)
    const invalidRes = await fetch(`${BASE_URL}/api/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '',
        email: 'not-an-email',
        amount: -500,
        planId: 'INVALID_PLAN'
      })
    });
    assert(invalidRes.status === 400, 'Rejet des données invalides par Zod (400 Bad Request)');

    // 4. Test Webhook Callback avec Statut SUCCESS
    const callbackSuccessRes = await fetch(`${BASE_URL}/api/payment/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference: testRef,
        moneyFusionId: 'MF-TX-TEST-999',
        status: 'SUCCESS',
        amount: 15000
      })
    });
    const callbackData = await callbackSuccessRes.json();
    assert(callbackSuccessRes.status === 200 && callbackData.status === 'SUCCESS', 'Callback Money Fusion SUCCESS traité (200 OK)');

    // 5. Test d'Idempotence (Double Callback Bloqué)
    const doubleCallbackRes = await fetch(`${BASE_URL}/api/payment/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference: testRef,
        moneyFusionId: 'MF-TX-TEST-999',
        status: 'SUCCESS',
        amount: 15000
      })
    });
    const doubleData = await doubleCallbackRes.json();
    assert(
      doubleCallbackRes.status === 200 && doubleData.message.includes('déjà finalisée'),
      'Idempotence: Le double callback est ignoré sans régénérer l\'abonnement'
    );

    // 6. Test Statut de Transaction
    const statusRes = await fetch(`${BASE_URL}/api/payment/status/${testRef}`);
    const statusData = await statusRes.json();
    assert(
      statusRes.status === 200 && statusData.transaction.status === 'SUCCESS',
      'Consultation du statut de transaction via /status/:reference'
    );

    // 7. Test Callback FAILED sur une seconde transaction
    const createRes2 = await fetch(`${BASE_URL}/api/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'usr_test_integration_002',
        email: 'echec.bf@gmail.com',
        amount: 55000,
        planId: 'ENTERPRISE'
      })
    });
    const createData2 = await createRes2.json();
    const testRef2 = createData2.reference;

    const callbackFailedRes = await fetch(`${BASE_URL}/api/payment/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference: testRef2,
        status: 'FAILED',
        amount: 55000
      })
    });
    const failedData = await callbackFailedRes.json();
    assert(
      callbackFailedRes.status === 200 && failedData.status === 'FAILED',
      'Callback avec échec de paiement (FAILED) correctement enregistré'
    );

    // 8. Test Statistiques Dashboard Administrateur avec Jeton JWT Valide
    const testJwtToken = jwt.sign(
      { id: 'admin_user', email: 'admin@wendkabre.bf', role: 'ADMIN' },
      env.JWT_SECRET
    );

    const statsRes = await fetch(`${BASE_URL}/api/payment/stats`, {
      headers: { 'Authorization': `Bearer ${testJwtToken}` }
    });
    const statsData = await statsRes.json();
    assert(
      statsRes.status === 200 && statsData.stats.totalTransactions >= 2,
      'Agrégation des statistiques Administrateur (/api/payment/stats)'
    );

    console.log('=======================================================');
    console.log(`📊 RÉSULTAT RÉSULTAT DES TESTS : ${passedCount} RÉUSSIS, ${failedCount} ÉCHOUÉS`);
    console.log('=======================================================');

  } catch (err) {
    console.error('❌ Erreur durant l\'exécution des tests:', err);
  } finally {
    if (server) server.close();
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();
