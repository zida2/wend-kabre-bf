import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Analytics Event Collector
 * POST /api/analytics/events
 * 
 * Collects conversion funnel events for growth monitoring
 * Events: page_view, click_hero_cta, scroll_to_section, click_pricing, signup_start, 
 *        signup_complete, premium_upgrade, email_capture, popup_shown, etc.
 */

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      event_name,
      event_category,
      user_id,
      session_id,
      properties = {},
      page_path,
      referer,
    } = body;

    if (!event_name) {
      return NextResponse.json(
        { error: 'event_name is required' },
        { status: 400 }
      );
    }

    // Create event document in Firestore
    const eventDoc = {
      event_name,
      event_category: event_category || 'engagement',
      user_id: user_id || null,
      session_id: session_id || null,
      page_path: page_path || '/',
      referer: referer || null,
      properties,
      created_at: serverTimestamp(),
      client_ip: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    };

    await addDoc(collection(db, 'analytics_events'), eventDoc);

    return NextResponse.json({
      success: true,
      message: 'Event recorded',
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
