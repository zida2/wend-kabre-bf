# 🗄️ Firestore Setup - Subscriptions & Transactions

## Collections to Create

### 1. `/transactions` (Root Collection)

Store all payment transactions.

```javascript
Document ID: auto-generated
{
  userId: "firebase-uid",
  planId: "premium" | "pro",
  plan: "Premium" | "Pro",
  amount: 5000 | 10000,
  currency: "XOF",
  phoneNumber: "+226xxxxxxxxx",
  email: "user@example.com",
  status: "pending" | "completed" | "failed",
  paymentMethod: "orange" | "mtn" | "wave" | "bank" | null,
  tokenPay: "money-fusion-token",
  numeroTransaction: "transaction-number" | null,
  createdAt: "2026-08-22T14:30:00Z",
  completedAt: "2026-08-22T14:35:00Z" | null,
  expiresAt: "2026-08-22T14:45:00Z",
}
```

**Indexes needed**:
- userId (ascending)
- tokenPay (ascending) - for webhook lookup
- status (ascending)
- createdAt (descending)

### 2. `/users/{userId}/subscriptions/current` (Subcollection)

Store current subscription for each user.

```javascript
Document ID: "current"
{
  plan: "premium" | "pro" | "gratuit",
  planName: "Premium" | "Pro" | "Gratuit",
  status: "active" | "expired" | "cancelled",
  startDate: "2026-08-22T14:35:00Z",
  endDate: "2026-09-22T14:35:00Z",
  renewalDate: "2026-09-22T14:35:00Z",
  transactionId: "transaction-doc-id",
  lastPayment: "2026-08-22T14:35:00Z",
  autoRenew: true | false,
}
```

### 3. `/subscriptions-history` (Optional - for analytics)

Track all subscription changes.

```javascript
Document ID: auto-generated
{
  userId: "firebase-uid",
  planFrom: "gratuit",
  planTo: "premium",
  status: "active" | "expired" | "cancelled",
  transactionId: "transaction-doc-id",
  amount: 5000,
  timestamp: "2026-08-22T14:35:00Z",
}
```

---

## Security Rules

Add these to your `firestore.rules`:

```javascript
// Allow users to read/write their own subscriptions
match /users/{userId}/subscriptions/{document=**} {
  allow read: if request.auth.uid == userId;
  allow write: if false; // Written only by backend
}

// Allow backend to write transactions via Admin SDK
match /transactions/{transactionId} {
  allow read: if request.auth.uid == resource.data.userId || 
                 isAdmin(request.auth.uid);
  allow write: if false; // Written only by backend
}

// Subscriptions history
match /subscriptions-history/{document=**} {
  allow read: if isAdmin(request.auth.uid);
  allow write: if false; // Written only by backend
}
```

---

## Setup Instructions

### Manual Setup (via Firebase Console)

1. **Go to Firestore Database** → Create collections
2. **Create `/transactions` collection**
   - Add sample document to create indexes
3. **Create indexes**
   - userId, tokenPay, status, createdAt

### Automatic Setup (via Admin SDK)

Run this setup script:

```javascript
const admin = require('firebase-admin');
const db = admin.firestore();

async function setupSubscriptionsCollections() {
  console.log('Setting up subscriptions collections...');
  
  // Create sample documents to establish structure
  await db.collection('transactions').doc('_sample').set({
    userId: '_sample',
    planId: 'premium',
    plan: 'Premium',
    amount: 5000,
    currency: 'XOF',
    phoneNumber: '+226xx',
    email: 'sample@example.com',
    status: 'pending',
    paymentMethod: null,
    tokenPay: '_sample_token',
    numeroTransaction: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    expiresAt: new Date().toISOString(),
  });
  
  console.log('✅ Collections created');
  console.log('⚠️  Remember to add Firestore indexes for queries');
}

setupSubscriptionsCollections().catch(console.error);
```

---

## Database Fields Reference

### Transaction Statuses
- `pending`: Payment initiated, awaiting confirmation
- `completed`: Payment successful, subscription activated
- `failed`: Payment failed or cancelled

### Subscription Statuses
- `active`: Subscription is current and valid
- `expired`: Subscription expired, needs renewal
- `cancelled`: User cancelled subscription

### Payment Methods
- `orange`: Orange Money
- `mtn`: MTN Mobile Money
- `wave`: Wave (Senegal)
- `bank`: Bank transfer

---

## Testing

### Test Data

Use these test credentials for Money Fusion sandbox (if available):

```
Phone: +226XXXXXXXX (any valid BF number)
Amount: Any amount
```

### Verification Queries

```javascript
// Check all transactions for a user
db.collection('transactions')
  .where('userId', '==', 'test-user-id')
  .orderBy('createdAt', 'desc')
  .get()

// Check pending payments
db.collection('transactions')
  .where('status', '==', 'pending')
  .orderBy('createdAt', 'desc')
  .get()

// Check user's current subscription
db.collection('users')
  .doc('test-user-id')
  .collection('subscriptions')
  .doc('current')
  .get()
```

---

## Monitoring

### Dashboard Queries (for admin)

```javascript
// Total revenue
const revenue = await db.collection('transactions')
  .where('status', '==', 'completed')
  .get();

const total = revenue.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
console.log(`Total revenue: ${total} XOF`);

// Active subscribers
const active = await db.collection('subscriptions-history')
  .where('status', '==', 'active')
  .get();

console.log(`Active subscriptions: ${active.size}`);
```

