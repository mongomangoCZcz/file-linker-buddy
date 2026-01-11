import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Coin package price IDs from Stripe
const COIN_PACKAGES: Record<string, { priceId: string; coins: number }> = {
  "starter": { priceId: "price_1SoUi5CEvaNNIJ6N4CMRc5B9", coins: 5 },
  "regular": { priceId: "price_1SoUiICEvaNNIJ6NYICAgEFC", coins: 10 },
  "value": { priceId: "price_1SoUiVCEvaNNIJ6NUJ9QTOWq", coins: 20 },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { packageId, userId, userEmail } = await req.json();
    
    if (!packageId || !COIN_PACKAGES[packageId]) {
      throw new Error("Invalid package selected");
    }

    const coinPackage = COIN_PACKAGES[packageId];
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer already exists
    let customerId: string | undefined;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price: coinPackage.priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/store?success=true&coins=${coinPackage.coins}&userId=${userId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/store?canceled=true`,
      metadata: {
        userId,
        coins: coinPackage.coins.toString(),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
