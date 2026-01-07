import DodoPayments from 'dodopayments';
import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const client = new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY || 'your-default-api-key-here',
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT as 'live_mode' | 'test_mode' || 'live_mode', // defaults to 'live_mode'
});



export const POST = async (req: Request) => {

    try {
        const { prodID, userEmail, userName } = await req.json();

        const user = await convex.query(api.users.getUserByEmail, { email: userEmail });
        if (!user) {
            console.error("User not found for email:", userEmail);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }


        const session = await client.checkoutSessions.create({
            product_cart: [{ product_id: prodID, quantity: 1 }],
            customer: { email: userEmail, name: userName },
            return_url: process.env.DODO_PAYMENTS_RETURN_URL || 'https://localhost:3000/plans',
            metadata: {
                userId: user._id,
                credits: getCredits(prodID).toString(),
            }
        });
        console.log("Session is", session);
        return NextResponse.json(session);
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }
};

const CREDIT_PACKS: Record<string, number> = {
    pdt_0NVkfbJeSIbqQxDZFZpQA: 100,
    pdt_0NVl8hUVufh9IXEDXgI8u: 400,
    pdt_0NVlZtyWjflp2R1yZP0H7: 1000,
};

export const getCredits = (prodId: string): number => {
    return CREDIT_PACKS[prodId] ?? 0;
};
