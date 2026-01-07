"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Eye, ArrowRight, Share2, Download, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { EditMarketplaceDialog, DeleteMarketplaceDialog } from "./MarketplacePlanActions";
import { PublishDialog } from "./PublishDialog";
import { useState } from "react";

export default function MyMarketplacePage() {
    const { data: session, status } = useSession();
    const [activeTab, setActiveTab] = useState("published");

    // Get user by email
    const user = useQuery(api.users.getUserByEmail, {
        email: session?.user?.email || ""
    });

    // Fetch user's data from Convex
    const publishedPlans = useQuery(api.marketplaceplans.listAuthorMarketplacePlans,
        user ? { authorId: user._id } : "skip"
    );



    const allUserPlans = useQuery(api.plans.listUserPlans,
        user ? { userId: user._id } : "skip"
    );

    if (status === "loading" || (session && !user)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) {
        redirect("/");
        return null;
    }

    if (!user) return null;

    return (
        <div className="container mx-auto py-10 px-4 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight mb-1">My Marketplace</h1>
                    <p className="text-muted-foreground">Manage your published planners and remixes.</p>
                </div>
                <Link href="/marketplace">
                    <Button variant="outline" className="rounded-full">
                        <Globe className="w-4 h-4 mr-2" />
                        Explore Marketplace
                    </Button>
                </Link>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="bg-muted/50 p-1 rounded-xl">
                    <TabsTrigger value="published" className="rounded-lg px-8">My Published Planners</TabsTrigger>
                    <TabsTrigger value="publish" className="rounded-lg px-8">Publish New</TabsTrigger>
                </TabsList>

                <TabsContent value="published" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {publishedPlans?.map((mp) => (
                            <Card key={mp._id} className="border-primary/10 hover:shadow-lg transition-all">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <Badge variant={mp.visibility === 'public' ? 'default' : 'secondary'}>
                                            {mp.visibility.toUpperCase()}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground flex items-center">
                                            <Download className="w-3 h-3 mr-1" />
                                            {mp.installs} installs
                                        </span>
                                    </div>
                                    <CardTitle className="mt-2 text-xl">{mp.snapshot.title}</CardTitle>
                                    <CardDescription className="line-clamp-1">{mp.snapshot.description}</CardDescription>
                                </CardHeader>
                                <CardFooter className="bg-muted/30 pt-4 flex justify-between gap-2">
                                    <div className="flex gap-2">
                                        <Link href={`/marketplace/${mp._id}`}>
                                            <Button variant="ghost" size="sm">
                                                <Eye className="w-4 h-4 mr-2" />
                                                View
                                            </Button>
                                        </Link>
                                        <EditMarketplaceDialog mpPlan={mp} userId={user._id} />
                                    </div>
                                    <DeleteMarketplaceDialog mpId={mp._id} userId={user._id} />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    {publishedPlans?.length === 0 && (
                        <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-primary/10">
                            <h3 className="text-lg font-semibold">You haven't published any planners yet.</h3>
                            <p className="text-muted-foreground mt-2">Share your expertise with the community!</p>
                            <Button className="mt-6 rounded-full px-8" onClick={() => setActiveTab("publish")}>Get Started</Button>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="publish">
                    <Card className="border-primary/20 shadow-xl overflow-hidden">
                        <CardHeader className="bg-primary/5 py-2">
                            <CardTitle>Choose a Planner to Publish</CardTitle>
                            <CardDescription>Select one of your existing learning plans to share on the marketplace.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border">
                                {allUserPlans?.map((plan) => {
                                    const isPublished = publishedPlans?.some(mp => mp.sourcePlanId === plan._id);
                                    return (
                                        <div key={plan._id} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                                            <div>
                                                <h4 className="font-bold text-lg">{plan.title}</h4>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{plan.description}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <Badge variant="outline" className="text-[10px] uppercase font-bold">{plan.difficulty}</Badge>
                                                    <Badge variant="outline" className="text-[10px] uppercase font-bold">{plan.status}</Badge>
                                                </div>
                                            </div>
                                            <div>
                                                {isPublished ? (
                                                    <Button disabled variant="outline" className="rounded-full">
                                                        <Share2 className="w-4 h-4 mr-2" />
                                                        Already Published
                                                    </Button>
                                                ) : (
                                                    <PublishDialog plan={plan} userId={user._id} />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
