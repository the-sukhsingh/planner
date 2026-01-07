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
import { Settings, Trash2, Loader2, CoinsIcon, Globe, Lock } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function EditMarketplaceDialog({ mpPlan, userId }: { mpPlan: any, userId: any }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isFree, setIsFree] = useState(mpPlan.isFree);
    const [price, setPrice] = useState(mpPlan.price?.toString() || "0");
    const [visibility, setVisibility] = useState(mpPlan.visibility);

    const updatePlan = useMutation(api.marketplaceplans.updateMarketplacePlan);

    const handleUpdate = async () => {
        try {
            setLoading(true);
            const priceInCredits = Math.round(parseFloat(price));

            await updatePlan({
                planId: mpPlan._id,
                authorId: userId,
                isFree,
                price: isFree ? 0 : priceInCredits,
                visibility: visibility as 'public' | 'private',
            });

            setOpen(false);
        } catch (error) {
            console.error(error);
            alert("Failed to update plan");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Marketplace Settings</DialogTitle>
                    <DialogDescription>
                        Update visibility and pricing for "{mpPlan.snapshot.title}"
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
                                Price (Credits)
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
                        <Label className="font-bold">Visibility Control</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                type="button"
                                variant={visibility === 'public' ? 'default' : 'outline'}
                                className="rounded-xl h-12"
                                onClick={() => setVisibility('public')}
                            >
                                <Globe className="w-4 h-4 mr-2" />
                                Public
                            </Button>
                            <Button
                                type="button"
                                variant={visibility === 'private' ? 'default' : 'outline'}
                                className="rounded-xl h-12"
                                onClick={() => setVisibility('private')}
                            >
                                <Lock className="w-4 h-4 mr-2" />
                                Private
                            </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
                    <Button
                        onClick={handleUpdate}
                        disabled={loading}
                        className="rounded-xl px-8 font-bold"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function DeleteMarketplaceDialog({ mpId, userId }: { mpId: any, userId: any }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const deletePlan = useMutation(api.marketplaceplans.deleteMarketplacePlan);

    const handleDelete = async () => {
        try {
            setLoading(true);
            await deletePlan({
                planId: mpId,
                authorId: userId,
            });
            setOpen(false);
        } catch (error) {
            console.error(error);
            alert("Failed to delete plan from marketplace");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-destructive">Unpublish Planner?</DialogTitle>
                    <DialogDescription>
                        Internal data won't be deleted, but it will be removed from the marketplace for all users. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
                    <Button
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unpublish Everything"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
