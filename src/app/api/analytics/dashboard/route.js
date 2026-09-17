import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  countDocuments,
  aggregate,
  sum,
  Timestamp,
} from 'firebase/firestore';

/**
 * Analytics Dashboard API
 * GET /api/analytics/dashboard?days=7&adminKey=XXX
 * 
 * Returns growth metrics for the landing page funnel:
 * - Visitor counts
 * - Conversion rates
 * - Email capture rates
 * - Signup rates
 * - Premium conversion
 */

const ADMIN_KEY = process.env.ADMIN_ANALYTICS_KEY || 'super_secret_key';

export async function GET(request) {
  try {
    // Verify admin access
    const adminKey = request.nextUrl.searchParams.get('adminKey');
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const days = parseInt(request.nextUrl.searchParams.get('days') || '7');
    const now = new Date();
    const since = new Timestamp(
      Math.floor((now.getTime() - days * 24 * 60 * 60 * 1000) / 1000),
      0
    );

    // ─────────────────────────────────────────────────────────
    // Landing Page Metrics
    // ─────────────────────────────────────────────────────────

    // Page views to /vente
    const ventViewsQuery = query(
      collection(db, 'analytics_events'),
      where('page_path', '==', '/vente'),
      where('event_name', '==', 'page_view'),
      where('created_at', '>=', since)
    );
    const ventViews = await getDocs(ventViewsQuery);

    // Hero CTA clicks
    const heroCTAQuery = query(
      collection(db, 'analytics_events'),
      where('event_name', '==', 'click_hero_cta'),
      where('created_at', '>=', since)
    );
    const heroCTA = await getDocs(heroCTAQuery);

    // Exit intent popups shown
    const popupShownQuery = query(
      collection(db, 'analytics_events'),
      where('event_name', '==', 'exit_intent_popup_shown'),
      where('created_at', '>=', since)
    );
    const popupShown = await getDocs(popupShownQuery);

    // Email captures from popup
    const emailCapturedQuery = query(
      collection(db, 'analytics_events'),
      where('event_name', '==', 'exit_intent_popup_email_captured'),
      where('created_at', '>=', since)
    );
    const emailCaptured = await getDocs(emailCapturedQuery);

    // ─────────────────────────────────────────────────────────
    // Signup Funnel
    // ─────────────────────────────────────────────────────────

    // Signup starts
    const signupStartQuery = query(
      collection(db, 'analytics_events'),
      where('event_name', '==', 'signup_start'),
      where('created_at', '>=', since)
    );
    const signupStarts = await getDocs(signupStartQuery);

    // Signup completes
    const signupCompleteQuery = query(
      collection(db, 'analytics_events'),
      where('event_name', '==', 'signup_complete'),
      where('created_at', '>=', since)
    );
    const signupCompletes = await getDocs(signupCompleteQuery);

    // ─────────────────────────────────────────────────────────
    // User Database Metrics
    // ─────────────────────────────────────────────────────────

    // New users (signed up in this period)
    const usersQuery = query(
      collection(db, 'users'),
      where('signup_date', '>=', since.toDate().toISOString())
    );
    const newUsers = await getDocs(usersQuery);

    // Premium users
    const premiumQuery = query(
      collection(db, 'users'),
      where('plan', '==', 'premium')
    );
    const premiumUsers = await getDocs(premiumQuery);

    // Active users (logged in last 7 days)
    const sevenDaysAgo = new Timestamp(
      Math.floor((now.getTime() - 7 * 24 * 60 * 60 * 1000) / 1000),
      0
    );
    const activeQuery = query(
      collection(db, 'users'),
      where('last_login', '>=', sevenDaysAgo)
    );
    const activeUsers = await getDocs(activeQuery);

    // ─────────────────────────────────────────────────────────
    // Calculate Metrics
    // ─────────────────────────────────────────────────────────

    const ventPageViews = ventViews.size;
    const heroCTAClicks = heroCTA.size;
    const popupShowCount = popupShown.size;
    const emailCaptureCount = emailCaptured.size;
    const signupStartCount = signupStarts.size;
    const signupCompleteCount = signupCompletes.size;
    const totalNewUsers = newUsers.size;
    const totalPremiumUsers = premiumUsers.size;
    const totalActiveUsers = activeUsers.size;

    // Calculate conversion rates
    const heroClickRate = ventPageViews > 0 
      ? ((heroCTAClicks / ventPageViews) * 100).toFixed(2)
      : 0;

    const popupCaptureRate = popupShowCount > 0
      ? ((emailCaptureCount / popupShowCount) * 100).toFixed(2)
      : 0;

    const signupConversionRate = signupStartCount > 0
      ? ((signupCompleteCount / signupStartCount) * 100).toFixed(2)
      : 0;

    const premiumConversionRate = totalNewUsers > 0
      ? ((totalPremiumUsers / totalNewUsers) * 100).toFixed(2)
      : 0;

    const overallFunnelConversion = ventPageViews > 0
      ? ((signupCompleteCount / ventPageViews) * 100).toFixed(2)
      : 0;

    // ─────────────────────────────────────────────────────────
    // Return Dashboard Data
    // ─────────────────────────────────────────────────────────

    return NextResponse.json({
      period: {
        days,
        since: since.toDate().toISOString(),
        until: now.toISOString(),
      },

      // Landing page funnel
      landing_page: {
        page_views: ventPageViews,
        hero_cta_clicks: heroCTAClicks,
        hero_click_rate: `${heroClickRate}%`,
      },

      // Popup & lead capture
      lead_capture: {
        popups_shown: popupShowCount,
        emails_captured: emailCaptureCount,
        capture_rate: `${popupCaptureRate}%`,
      },

      // Signup funnel
      signup_funnel: {
        signup_starts: signupStartCount,
        signup_completes: signupCompleteCount,
        conversion_rate: `${signupConversionRate}%`,
      },

      // User base
      users: {
        new_users: totalNewUsers,
        premium_users: totalPremiumUsers,
        premium_conversion_rate: `${premiumConversionRate}%`,
        active_users_7d: totalActiveUsers,
      },

      // Overall metrics
      metrics: {
        overall_funnel_conversion: `${overallFunnelConversion}%`,
        estimated_weekly_signups: Math.round((signupCompleteCount / days) * 7),
        estimated_weekly_premium: Math.round((totalPremiumUsers / days) * 7),
      },

      // Raw events for debugging
      raw_events: {
        total_events: 
          ventPageViews + heroCTAClicks + popupShowCount + emailCaptureCount + 
          signupStartCount + signupCompleteCount,
      },
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
