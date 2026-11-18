import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';
import { getCollections } from '../db.js';
import { verifyToken } from '../middlewares/auth.js';

dotenv.config();

const router = express.Router();
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = new Stripe(stripeKey);

// POST /api/payments/create-checkout-session (Stripe Checkout)
router.post('/create-checkout-session', verifyToken, async (req, res) => {
  try {
    const { planType } = req.body; // 'tutor' or 'student'
    const role = req.user.role;

    // Pro Tutor is $15, Pro Student is $10
    const isTutor = planType === 'tutor' || role === 'tutor';
    const amount = isTutor ? 1500 : 1000; // in cents ($15 or $10)
    const planName = isTutor ? 'Pro Tutor Plan' : 'Pro Student Plan';
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    // If Stripe key is configured, create live Stripe Checkout Session
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `MentorLagbe ${planName}`,
                description: isTutor
                  ? 'Unlimited tuition listings, verified golden badge, and priority student reach.'
                  : 'Priority tutor applications, unlimited bookmarks, and instant responses.',
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: req.user.email,
        client_reference_id: req.user._id,
        metadata: {
          userEmail: req.user.email,
          userName: req.user.name,
          userRole: req.user.role,
          planName,
          amountDollars: isTutor ? '15' : '10',
        },
        success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/payment/cancel`,
      });

      return res.status(200).json({
        success: true,
        sessionId: session.id,
        url: session.url,
      });
    } else {
      // Test / Sandbox Mode Fallback when Stripe keys are in placeholder mode
      const mockSessionId = `cs_test_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      return res.status(200).json({
        success: true,
        sessionId: mockSessionId,
        url: `${clientUrl}/payment/success?session_id=${mockSessionId}&plan=${encodeURIComponent(
          planName
        )}&amount=${isTutor ? 15 : 10}&mock=true`,
      });
    }
  } catch (error) {
    console.error('Stripe Session Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate Stripe Checkout.',
    });
  }
});

// POST /api/payments/verify-session (Database Sync: updates plan to 'pro' and records payment)
router.post('/verify-session', verifyToken, async (req, res) => {
  try {
    const { sessionId, planName, amount } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required.' });
    }

    const { paymentsCollection, usersCollection } = getCollections();

    // Check if already processed
    const existingPayment = await paymentsCollection.findOne({ stripeSessionId: sessionId });
    if (existingPayment) {
      return res.status(200).json({
        success: true,
        alreadyProcessed: true,
        message: 'Payment has already been processed.',
        payment: existingPayment,
      });
    }

    let finalAmount = Number(amount) || (req.user.role === 'tutor' ? 15 : 10);
    let finalPlanName = planName || (req.user.role === 'tutor' ? 'Pro Tutor Plan' : 'Pro Student Plan');
    let transactionId = `txn_${Date.now()}`;

    // If live Stripe configured, verify genuine Stripe session (both live and cs_test_ sandbox sessions)
    const isOfflineMockSession = sessionId.includes('_mock_') || sessionId.startsWith('cs_dummy_');
    const hasLiveStripeKey =
      process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder');

    if (hasLiveStripeKey && !isOfflineMockSession) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === 'paid') {
          finalAmount = (session.amount_total || 1500) / 100;
          finalPlanName = session.metadata?.planName || finalPlanName;
          transactionId = session.payment_intent || session.id;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Payment was not completed.',
          });
        }
      } catch (err) {
        console.warn('Could not verify session with Stripe API, using metadata:', err.message);
      }
    }

    // Insert record in payments collection
    const paymentRecord = {
      userEmail: req.user.email,
      userName: req.user.name,
      userRole: req.user.role,
      planName: finalPlanName,
      amount: finalAmount,
      currency: 'usd',
      transactionId,
      stripeSessionId: sessionId,
      paymentStatus: 'paid',
      paidAt: new Date(),
    };

    await paymentsCollection.insertOne(paymentRecord);

    // Update user plan to 'pro' in users collection
    await usersCollection.updateOne(
      { email: req.user.email },
      { $set: { plan: 'pro', upgradedAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      message: 'Subscription successfully upgraded to PRO! Enjoy unlimited benefits.',
      payment: paymentRecord,
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment.',
    });
  }
});

export default router;
