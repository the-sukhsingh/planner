import { Webhooks } from '@dodopayments/nextjs'
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { Id } from '../../../../../convex/_generated/dataModel';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const POST = Webhooks({
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY || process.env.DODO_WEBHOOK_SECRET || "",
    onPaymentSucceeded: async (payload) => {
        console.log("Full payment webhook payload:", JSON.stringify(payload, null, 2));
        
        // The payload structure for Dodo Payments includes metadata
        // We expect userId and credits to be passed in metadata
        const metadata = (payload as any).data.metadata;
        const userId = metadata?.userId as Id<"users"> | undefined;
        const creditsStr = metadata?.credits;
        const credits = creditsStr ? parseInt(String(creditsStr)) : 0;
        
        console.log(`Webhook received: Succeeded payment for user ${userId}, credits: ${credits}`);
        console.log("Metadata received:", metadata);

        if (!userId) {
            console.error("No userId found in metadata:", metadata);
            return;
        }

        if (!credits || credits <= 0) {
            console.error("Invalid credits amount:", creditsStr);
            return;
        }

        try {
            await convex.mutation(api.users.addCredits, {
                userId,
                amount: credits,
                reason: 'purchase',
            });
            console.log(`Successfully added ${credits} credits to user ${userId}`);
        } catch (error) {
            console.error(`Error adding credits to user ${userId}:`, error);
            throw error; // Re-throw to let Dodo Payments know the webhook failed
        }
    },
});

// import { NextRequest, NextResponse } from "next/server";
// import { Webhook } from "standardwebhooks";

// const webhookSecret = process.env.DODOPAYMENTS_WEBHOOK_SECRET!;

// export async function POST(req: NextRequest) {
//     try {
//         // Get webhook headers
//         const webhookId = req.headers.get("webhook-id");
//         const webhookSignature = req.headers.get("webhook-signature");
//         const webhookTimestamp = req.headers.get("webhook-timestamp");

//         if (!webhookId || !webhookSignature || !webhookTimestamp) {
//             return NextResponse.json(
//                 { error: "Missing webhook headers" },
//                 { status: 400 }
//             );
//         }

//         // Get raw body
//         const body = await req.text();

//         // Verify webhook signature
//         const webhook = new Webhook(webhookSecret);

//         try {
//             await webhook.verify(body, {
//                 "webhook-id": webhookId,
//                 "webhook-signature": webhookSignature,
//                 "webhook-timestamp": webhookTimestamp,
//             });
//         } catch (err) {
//             console.error("Webhook verification failed:", err);
//             return NextResponse.json(
//                 { error: "Invalid webhook signature" },
//                 { status: 400 }
//             );
//         }

//         // Parse the verified payload
//         const payload = JSON.parse(body);
//         console.log("WEBHOOK", payload.data);

//         // Handle different webhook events
//         switch (payload.type) {
//             case "payment.succeeded":
//                 console.log("Payment succeeded:", payload.data);
//                 // Handle successful payment
//                 // Update your database, send confirmation email, etc.
//                 break;

//             case "payment.failed":
//                 console.log("Payment failed:", payload.data);
//                 // Handle failed payment
//                 break;

//             case "subscription.created":
//                 console.log("Subscription created:", payload.data);
//                 // Handle new subscription
//                 break;

//             case "subscription.cancelled":
//                 console.log("Subscription cancelled:", payload.data);
//                 // Handle subscription cancellation
//                 break;

//             case "subscription.updated":
//                 console.log("Subscription updated:", payload.data);
//                 // Handle subscription update
//                 break;

//             default:
//                 console.log("Unhandled webhook event:", payload.type);
//         }

//         // Return success response
//         return NextResponse.json(
//             { received: true, type: payload.type },
//             { status: 200 }
//         );
//     } catch (error) {
//         console.error("Webhook processing error:", error);
//         return NextResponse.json(
//             { error: "Webhook processing failed" },
//             { status: 500 }
//         );
//     }
// }