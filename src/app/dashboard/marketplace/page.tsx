import { db } from "@/db";
import { marketplacePlansTable, learningPlansTable, usersTable, planForksTable } from "@/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/auth";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Globe, Settings, Eye, Trash2, ArrowRight, Share2, Download } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MyMarketplacePage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/");

    const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.email, session.user.email)
    });

    if (!user) redirect("/");

    // Fetch user's published plans
    const publishedPlans = await db.query.marketplacePlansTable.findMany({
        where: eq(marketplacePlansTable.userId, user.id),
        with: {
            plan: true
        }
    });

    // Fetch user's forked plans (plans they forked from others)
    const forkedPlans = await db.query.planForksTable.findMany({
        where: eq(planForksTable.userId, user.id),
        with: {
            originalPlan: {
                with: {
                    user: true
                }
            },
            forkedPlan: true
        }
    });

    // Fetch all user's plans to allow publishing
    const allUserPlans = await db.query.learningPlansTable.findMany({
        where: eq(learningPlansTable.userId, user.id),
        orderBy: [desc(learningPlansTable.updatedAt)]
    });

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

            <Tabs defaultValue="published" className="space-y-8">
                <TabsList className="bg-muted/50 p-1 rounded-xl">
                    <TabsTrigger value="published" className="rounded-lg px-8">My Published Planners</TabsTrigger>
                    <TabsTrigger value="forks" className="rounded-lg px-8">Remixes & Forks</TabsTrigger>
                    <TabsTrigger value="publish" className="rounded-lg px-8">Publish New</TabsTrigger>
                </TabsList>

                <TabsContent value="published" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {publishedPlans.map((mp) => (
                            <Card key={mp.id} className="border-primary/10 hover:shadow-lg transition-all">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <Badge variant={mp.status === 'published' ? 'default' : 'secondary'}>
                                            {mp.status.toUpperCase()}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground flex items-center">
                                            <Download className="w-3 h-3 mr-1" />
                                            {mp.installs} installs
                                        </span>
                                    </div>
                                    <CardTitle className="mt-2 text-xl">{mp.plan.title}</CardTitle>
                                    <CardDescription className="line-clamp-1">{mp.plan.description}</CardDescription>
                                </CardHeader>
                                <CardFooter className="bg-muted/30 pt-4 flex justify-between gap-2">
                                    <div className="flex gap-2">
                                        <Link href={`/marketplace/${mp.id}`}>
                                            <Button variant="ghost" size="sm">
                                                <Eye className="w-4 h-4 mr-2" />
                                                View
                                            </Button>
                                        </Link>
                                        <EditMarketplaceDialog mpPlan={mp} />
                                    </div>
                                    <DeleteMarketplaceDialog mpId={mp.id} />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    {publishedPlans.length === 0 && (
                        <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-primary/10">
                            <h3 className="text-lg font-semibold">You haven't published any planners yet.</h3>
                            <p className="text-muted-foreground mt-2">Share your expertise with the community!</p>
                            <Button className="mt-6 rounded-full px-8">Get Started</Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="forks" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {forkedPlans.map((fork) => (
                            <Card key={fork.id} className="border-primary/10">
                                <CardHeader>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className="text-[10px]">REMIX</Badge>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                            Original by {fork.originalPlan.user.name}
                                        </span>
                                    </div>
                                    <CardTitle className="text-xl">{fork.forkedPlan.title}</CardTitle>
                                </CardHeader>
                                <CardFooter className="bg-muted/30 pt-4 flex justify-between">
                                    <Link href={`/plans`}>
                                        <Button variant="link" className="p-0 h-auto font-bold text-primary">
                                            Go to Plan <ArrowRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </Link>
                                    <span className="text-xs text-muted-foreground">
                                        Forked on {new Date(fork.createdAt).toLocaleDateString()}
                                    </span>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    {forkedPlans.length === 0 && (
                        <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-primary/10">
                            <h3 className="text-lg font-semibold">No remixes yet.</h3>
                            <p className="text-muted-foreground mt-2">Explore the marketplace to find planners to fork.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="publish">
                    <Card className="border-primary/20 shadow-xl overflow-hidden">
                        <CardHeader className="bg-primary/5">
                            <CardTitle>Choose a Planner to Publish</CardTitle>
                            <CardDescription>Select one of your existing learning plans to share on the marketplace.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border">
                                {allUserPlans.map((plan) => {
                                    const isPublished = publishedPlans.some(mp => mp.planId === plan.id);
                                    return (
                                        <div key={plan.id} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                                            <div>
                                                <h4 className="font-bold text-lg">{plan.title}</h4>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{plan.goal}</p>
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
                                                    <PublishDialog plan={plan} />
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

// Actions components
import { EditMarketplaceDialog, DeleteMarketplaceDialog } from "./MarketplacePlanActions";
import { PublishDialog } from "./PublishDialog";
