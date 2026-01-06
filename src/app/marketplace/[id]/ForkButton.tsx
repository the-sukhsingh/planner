"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { forkPlan, purchasePlan } from "@/actions/marketplace";
import { Copy, Loader2, Zap, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";


export function ForkButton({
    marketplacePlanId,
    isFree,
    isPurchased
}: {
    marketplacePlanId: number;
    isFree: boolean;
    isPurchased: boolean;
}) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { refreshCredits } = useAuth();

    const handleFork = async () => {
        try {
            setLoading(true);
            const result = await forkPlan(marketplacePlanId);
            if (result.success) {
                alert("Planner remixed successfully!");
                router.push(`/plans/?${marketplacePlanId}`);
            }
        } catch (error: any) {
            alert(error.message || "Failed to remix planner");
            if (error.message.includes("Purchase required")) {
                // Future: show stripe checkout
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        try {
            setLoading(true);
            const result = await purchasePlan(marketplacePlanId);
            if (result.success) {
                await refreshCredits();
                alert("Purchased successfully! You can now fork the planner.");
            }
        } catch (error: any) {
            alert(error.message || "Failed to purchase planner");
        } finally {
            setLoading(false);
        }
    };

    if (!isFree) {
        return (
            <div className="flex flex-col md:flex-row gap-2 w-full">
                <Button
                    variant="default"
                    className="h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                    onClick={handleFork}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Copy className="w-5 h-5 mr-3" />}
                    Remix This Planner
                </Button>
                {
                    !isPurchased && (
                        <Button
                            variant="outline"
                            className="h-14 rounded-2xl text-lg font-bold"
                            onClick={handlePurchase}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5 mr-3" />}
                            Buy Now
                        </Button>
                    )}
            </div>
        )
    }

    return (
        <Button
            className="h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all group w-full"
            onClick={handleFork}
            disabled={loading}
        >
            {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <>
                    <Zap className="w-5 h-5 mr-3 group-hover:fill-current" />
                    Remix For Free
                </>
            )}
        </Button>
    );
}
