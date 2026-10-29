const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { identifier, asset_type, package_tier, include_bill_of_sale, amount_cents } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `CheckMyToy ${String(package_tier).toUpperCase()} (${identifier})` + (include_bill_of_sale ? ' + 50-State Bill of Sale' : ''),
          },
          unit_amount: amount_cents,
        },
        quantity: 1,
      }],
      metadata: {
        identifier: String(identifier || ''),
        asset_type: String(asset_type || ''),
        package_tier: String(package_tier || ''),
        include_bill_of_sale: String(!!include_bill_of_sale)
      },
      success_url: `${req.headers.origin}/?checkout_success=1&session_id={CHECKOUT_SESSION_ID}&id=${encodeURIComponent(identifier)}&tier=${encodeURIComponent(package_tier)}&bos=${!!include_bill_of_sale}`,
      cancel_url: `${req.headers.origin}/?checkout_canceled=1`,
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
