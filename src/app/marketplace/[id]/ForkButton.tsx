"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Copy, Loader2, Zap, CreditCard, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Id } from "../../../../convex/_generated/dataModel";

export function ForkButton({
    marketplacePlanId,
    isFree,
    isPurchased,
    price
}: {
    marketplacePlanId: Id<"marketplaceplans">;
    isFree: boolean;
    isPurchased: boolean;
    price: number;
}) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { user } = useAuth();

    const forkMarketplacePlan = useMutation(api.marketplaceplans.forkMarketplacePlan);
    const createPurchase = useMutation(api.purchases.createPurchase);

    const handleFork = async () => {
        if (!user) {
            alert("Please sign in to remix this planner");
            return;
        }

        try {
            setLoading(true);
            const newPlanId = await forkMarketplacePlan({
                marketplacePlanId,
                userId: user._id,
            });
            alert("Planner remixed successfully!");
            router.push(`/?planId=${newPlanId}`);
        } catch (error: any) {
            alert(error.message || "Failed to remix planner");
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        if (!user) {
            alert("Please sign in to purchase this planner");
            return;
        }

        if (user.credits < price) {
            alert(`Insufficient credits. You need ${price} credits but have ${user.credits}.`);
            return;
        }

        try {
            setLoading(true);
            await createPurchase({
                userId: user._id,
                planId: marketplacePlanId,
                price: price,
            });
            alert("Purchase successful! You can now remix this planner.");
        } catch (error: any) {
            alert(error.message || "Failed to purchase planner");
        } finally {
            setLoading(false);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("Marketplace link copied to clipboard!");
    };

    return (
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Primary Action Button */}
            {isPurchased || isFree ? (
                <Button
                    variant="default"
                    className="h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all w-full sm:px-8 group"
                    onClick={handleFork}
                    disabled={loading}
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isFree && !isPurchased ? (
                        <>
                            <Zap className="w-5 h-5 mr-3 group-hover:fill-current text-yellow-500" />
                            Remix For Free
                        </>
                    ) : (
                        <>
                            <Copy className="w-5 h-5 mr-3" />
                            Remix Planner
                        </>
                    )}
                </Button>
            ) : (
                <Button
                    variant="default"
                    className="h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all w-full sm:px-8"
                    onClick={handlePurchase}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5 mr-3" />}
                    Buy for {price} Credits
                </Button>
            )}

            {/* Share Button */}
            <Button
                variant="outline"
                className="h-14 rounded-2xl px-6 font-bold border-primary/10 hover:bg-primary/5 w-full sm:w-auto"
                onClick={handleShare}
            >
                <Share2 className="w-4 h-4 mr-2" />
                Share
            </Button>
        </div>
    );
}
