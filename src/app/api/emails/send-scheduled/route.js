import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  sendWelcomeEmail,
  sendMarketsEmail,
  sendAiTutorialEmail,
  sendPremiumOfferEmail,
  sendWeeklyCheckinEmail,
  sendLeadEmail,
} from '@/lib/email-service';

/**
 * Email Automation Cron Job Handler
 * POST /api/emails/send-scheduled
 * Triggered by Vercel Cron or manual call with Authorization header
 *
 * Sends emails based on user lifecycle stage:
 * - Day 0: Welcome email (on signup)
 * - Day 1: Markets recommendation
 * - Day 2: AI tutorial
 * - Day 3: Premium offer
 * - Day 7: Weekly check-in
 * - Leads: Daily re-engagement emails
 */

// Protect this endpoint with a secret
const CRON_SECRET = process.env.CRON_SECRET || process.env.NEXT_PUBLIC_CRON_SECRET;

export async function POST(request) {
  try {
    // Verify Vercel Cron or authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      console.warn('❌ Unauthorized email automation request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const emailsSent = {
      welcome: 0,
      markets: 0,
      aiTutorial: 0,
      premiumOffer: 0,
      weeklyCheckin: 0,
      leads: 0,
    };

    // ─────────────────────────────────────────────────────────────
    // 1. SEND DAY 0: WELCOME EMAIL
    // ─────────────────────────────────────────────────────────────
    try {
      const usersRef = collection(db, 'users');
      const day0Query = query(
        usersRef,
        where('onboarding_step', '==', 0),
        where('email_verified', '==', false)
      );
      const day0Snap = await getDocs(day0Query);

      for (const userDoc of day0Snap.docs) {
        const user = userDoc.data();
        try {
          await sendWelcomeEmail(user.email, user.name || 'Ami');
          
          // Update user onboarding step
          await updateDoc(doc(db, 'users', userDoc.id), {
            onboarding_step: 1,
            welcome_email_sent_at: serverTimestamp(),
            lifecycle_stage: 'active',
          });
          
          emailsSent.welcome++;
          console.log(`✅ Welcome email sent to ${user.email}`);
        } catch (err) {
          console.error(`❌ Failed to send welcome email to ${user.email}:`, err);
        }
      }
    } catch (err) {
      console.error('❌ Error in welcome email batch:', err);
    }

    // ─────────────────────────────────────────────────────────────
    // 2. SEND DAY 1: MARKETS EMAIL
    // ─────────────────────────────────────────────────────────────
    try {
      const usersRef = collection(db, 'users');
      const day1Query = query(
        usersRef,
        where('onboarding_step', '==', 1)
      );
      const day1Snap = await getDocs(day1Query);

      for (const userDoc of day1Snap.docs) {
        const user = userDoc.data();
        // Check if 24 hours have passed since welcome email
        const welcomeSentAt = user.welcome_email_sent_at?.toDate?.() || new Date();
        const hoursDiff = (now - welcomeSentAt) / (1000 * 60 * 60);

        if (hoursDiff >= 24) {
          try {
            await sendMarketsEmail(user.email, user.name || 'Ami', 10);
            
            await updateDoc(doc(db, 'users', userDoc.id), {
              onboarding_step: 2,
              markets_email_sent_at: serverTimestamp(),
            });
            
            emailsSent.markets++;
            console.log(`✅ Markets email sent to ${user.email}`);
          } catch (err) {
            console.error(`❌ Failed to send markets email to ${user.email}:`, err);
          }
        }
      }
    } catch (err) {
      console.error('❌ Error in markets email batch:', err);
    }

    // ─────────────────────────────────────────────────────────────
    // 3. SEND DAY 2: AI TUTORIAL EMAIL
    // ─────────────────────────────────────────────────────────────
    try {
      const usersRef = collection(db, 'users');
      const day2Query = query(
        usersRef,
        where('onboarding_step', '==', 2)
      );
      const day2Snap = await getDocs(day2Query);

      for (const userDoc of day2Snap.docs) {
        const user = userDoc.data();
        const marketsSentAt = user.markets_email_sent_at?.toDate?.() || new Date();
        const hoursDiff = (now - marketsSentAt) / (1000 * 60 * 60);

        if (hoursDiff >= 24) {
          try {
            await sendAiTutorialEmail(user.email, user.name || 'Ami');
            
            await updateDoc(doc(db, 'users', userDoc.id), {
              onboarding_step: 3,
              ai_tutorial_email_sent_at: serverTimestamp(),
            });
            
            emailsSent.aiTutorial++;
            console.log(`✅ AI tutorial email sent to ${user.email}`);
          } catch (err) {
            console.error(`❌ Failed to send AI tutorial email to ${user.email}:`, err);
          }
        }
      }
    } catch (err) {
      console.error('❌ Error in AI tutorial email batch:', err);
    }

    // ─────────────────────────────────────────────────────────────
    // 4. SEND DAY 3: PREMIUM OFFER EMAIL
    // ─────────────────────────────────────────────────────────────
    try {
      const usersRef = collection(db, 'users');
      const day3Query = query(
        usersRef,
        where('onboarding_step', '==', 3)
      );
      const day3Snap = await getDocs(day3Query);

      for (const userDoc of day3Snap.docs) {
        const user = userDoc.data();
        const aiEmailSentAt = user.ai_tutorial_email_sent_at?.toDate?.() || new Date();
        const hoursDiff = (now - aiEmailSentAt) / (1000 * 60 * 60);

        if (hoursDiff >= 24) {
          try {
            await sendPremiumOfferEmail(user.email, user.name || 'Ami');
            
            await updateDoc(doc(db, 'users', userDoc.id), {
              onboarding_step: 4,
              premium_offer_email_sent_at: serverTimestamp(),
            });
            
            emailsSent.premiumOffer++;
            console.log(`✅ Premium offer email sent to ${user.email}`);
          } catch (err) {
            console.error(`❌ Failed to send premium offer email to ${user.email}:`, err);
          }
        }
      }
    } catch (err) {
      console.error('❌ Error in premium offer email batch:', err);
    }

    // ─────────────────────────────────────────────────────────────
    // 5. SEND DAY 7: WEEKLY CHECK-IN EMAIL
    // ─────────────────────────────────────────────────────────────
    try {
      const usersRef = collection(db, 'users');
      const day7Query = query(
        usersRef,
        where('onboarding_step', '==', 4)
      );
      const day7Snap = await getDocs(day7Query);

      for (const userDoc of day7Snap.docs) {
        const user = userDoc.data();
        const premiumEmailSentAt = user.premium_offer_email_sent_at?.toDate?.() || new Date();
        const hoursDiff = (now - premiumEmailSentAt) / (1000 * 60 * 60);

        if (hoursDiff >= 96) { // 4 days after premium offer
          try {
            await sendWeeklyCheckinEmail(user.email, user.name || 'Ami');
            
            await updateDoc(doc(db, 'users', userDoc.id), {
              onboarding_step: 5, // Completed onboarding sequence
              weekly_checkin_email_sent_at: serverTimestamp(),
            });
            
            emailsSent.weeklyCheckin++;
            console.log(`✅ Weekly check-in email sent to ${user.email}`);
          } catch (err) {
            console.error(`❌ Failed to send weekly check-in email to ${user.email}:`, err);
          }
        }
      }
    } catch (err) {
      console.error('❌ Error in weekly check-in email batch:', err);
    }

    // ─────────────────────────────────────────────────────────────
    // 6. SEND TO LEADS (Non-converting visitors)
    // ─────────────────────────────────────────────────────────────
    try {
      const leadsRef = collection(db, 'leads');
      const leadsQuery = query(
        leadsRef,
        where('status', '==', 'active'),
        where('last_email_sent', '==', null)
      );
      const leadsSnap = await getDocs(leadsQuery);

      for (const leadDoc of leadsSnap.docs) {
        const lead = leadDoc.data();
        try {
          await sendLeadEmail(lead.email);
          
          await updateDoc(doc(db, 'leads', leadDoc.id), {
            last_email_sent: serverTimestamp(),
            email_opens: 0,
          });
          
          emailsSent.leads++;
          console.log(`✅ Lead email sent to ${lead.email}`);
        } catch (err) {
          console.error(`❌ Failed to send lead email to ${lead.email}:`, err);
        }
      }
    } catch (err) {
      console.error('❌ Error in leads email batch:', err);
    }

    console.log('✅ Email automation complete:', emailsSent);
    
    return NextResponse.json({
      success: true,
      message: 'Email automation completed',
      emailsSent,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Email automation error:', error);
    return NextResponse.json(
      { error: error.message || 'Email automation failed' },
      { status: 500 }
    );
  }
}
