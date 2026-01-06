"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { publishPlan } from "@/actions/marketplace";
import { Rocket, Loader2, Tag as TagIcon, CoinsIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Plan } from "@/context/PlanContext";

export function PublishDialog({ plan }: { plan: Plan }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isFree, setIsFree] = useState(true);
    const [price, setPrice] = useState("0");
    const [tags, setTags] = useState("");
    const router = useRouter();

    const handlePublish = async () => {
        try {
            setLoading(true);
            const priceInCredits = Math.round(parseFloat(price));
            const tagArray = tags.split(",").map(t => t.trim()).filter(t => t !== "");

            await publishPlan(plan.id, {
                isFree,
                price: isFree ? 0 : priceInCredits,
                visibility: "public",
                tags: tagArray
            });

            setOpen(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to publish plan");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-full shadow-lg shadow-primary/10">
                    <Rocket className="w-4 h-4 mr-2" />
                    Publish
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Publish to Marketplace</DialogTitle>
                    <DialogDescription>
                        Make your "{plan.title}" planner available for others to fork and learn.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-primary/5">
                        <div className="space-y-0.5">
                            <Label className="text-base font-bold">Free Access</Label>
                            <p className="text-xs text-muted-foreground">Allow anyone to fork this for free.</p>
                        </div>
                        <Switch
                            checked={isFree}
                            onCheckedChange={setIsFree}
                        />
                    </div>

                    {!isFree && (
                        <div className="space-y-2 px-1">
                            <Label htmlFor="price" className="font-bold flex items-center gap-2">
                                <CoinsIcon className="w-4 h-4" />
                                Set Price (Credits)
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                placeholder="10"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="h-12 bg-muted/20 border-primary/10 rounded-xl"
                            />
                        </div>
                    )}

                    <div className="space-y-2 px-1">
                        <Label htmlFor="tags" className="font-bold flex items-center gap-2">
                            <TagIcon className="w-4 h-4" />
                            Tags (comma separated)
                        </Label>
                        <Input
                            id="tags"
                            placeholder="nextjs, programming, beginner"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="h-12 bg-muted/20 border-primary/10 rounded-xl"
                        />
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
                    <Button
                        onClick={handlePublish}
                        disabled={loading}
                        className="rounded-xl px-8 font-bold"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Now"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
