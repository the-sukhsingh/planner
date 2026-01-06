import { db } from "@/db";
import { marketplacePlansTable } from "@/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    Clock,
    BarChart,
    Target,
    BookOpen,
    CheckCircle2,
    ArrowLeft,
    Share2,
    Calendar,
    Zap,
    Lock
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";


export default async function MarketplacePlanDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const mpId = parseInt(id);

    if (isNaN(mpId)) return notFound();

    const mpPlan = await db.query.marketplacePlansTable.findFirst({
        where: eq(marketplacePlansTable.id, mpId),
        with: {
            plan: {
                with: {
                    todos: {
                        orderBy: (todos, { asc }) => [asc(todos.order)],
                    },
                    milestones: {
                        orderBy: (milestones, { asc }) => [asc(milestones.order)]
                    }
                }
            },
            user: true,
            tags: {
                with: {
                    tag: true
                }
            }
        }
    });

    if (!mpPlan || !mpPlan.plan) return notFound();

    const session = await auth();
    const isOwner = session?.user?.email === mpPlan.user.email;

    const isPurchased = await db.query.marketplacePlansTable.findFirst({
        where: eq(marketplacePlansTable.id, mpId),
        with: {
            plan: true,
            user: true,
            tags: {
                with: {
                    tag: true
                }
            }
        }
    });

    return (
        <div className="min-h-screen bg-background">
            {/* Header / Hero Section */}
            <div className="bg-primary/5 border-b border-primary/10">
                <div className="container mx-auto py-12 px-4 max-w-5xl">
                    <Link href="/marketplace" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Marketplace
                    </Link>

                    <div className="flex flex-col justify-between items-start gap-8">
                        <div className="flex-1">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                                    {mpPlan.isFree ? "Free Access" : `${mpPlan.price} Credits`}
                                </Badge>
                                <Badge variant="outline" className="text-muted-foreground">
                                    {mpPlan.installs} Installations
                                </Badge>
                                {mpPlan.tags.map(t => (
                                    <Badge key={t.tag.id} variant="secondary" className="opacity-70">
                                        #{t.tag.name}
                                    </Badge>
                                ))}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
                                {mpPlan.plan.title}
                            </h1>
                        </div>

                        <div className="w-full md:w-auto flex flex-col md:flex-row justify-start gap-2">
                            {
                                !isOwner && <ForkButton marketplacePlanId={mpPlan.id} isFree={mpPlan.isFree} isPurchased={!!isPurchased} />

                            }
                            <Button variant="outline" className="w-fit h-14 rounded-2xl">
                                <Share2 className="w-4 h-4 mr-2" />
                                Share Planner
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto py-12 px-4 max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-12">
                        <section>
                            <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                                <Target className="w-6 h-6 text-primary" />
                                The Goal
                            </h2>
                            <div className="bg-card p-6 rounded-2xl border border-primary/5 shadow-sm">
                                <p className="text-lg leading-relaxed text-muted-foreground italic">
                                    "{mpPlan.plan.description}"
                                </p>
                            </div>
                        </section>

                        {
                            mpPlan.plan.milestones.length > 0 && (

                                <section>
                                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                                        <CheckCircle2 className="w-6 h-6 text-primary" />
                                        Planning & Milestones
                                    </h2>
                                    <div className="space-y-4">
                                        {mpPlan.plan.milestones.map((milestone, idx) => (
                                            <div key={milestone.id} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary ring-4 ring-background">
                                                        {idx + 1}
                                                    </div>
                                                    {idx < mpPlan.plan.milestones.length - 1 && (
                                                        <div className="w-0.5 h-full bg-primary/5 mt-2" />
                                                    )}
                                                </div>
                                                <div className="flex-1 pb-8">
                                                    <h3 className="text-lg font-semibold mb-1">{milestone.title}</h3>
                                                    <p className="text-muted-foreground">{milestone.description}</p>

                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )
                        }

                        <section>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <BookOpen className="w-6 h-6 text-primary" />
                                    Tasks & Curriculum
                                </h2>
                                <Badge variant="outline">{mpPlan.plan.todos.length} Tasks</Badge>
                            </div>
                            <div className="bg-muted/30 rounded-3xl p-6 space-y-4 border border-dashed border-primary/20">
                                {mpPlan.plan.todos.slice(0, 5).map((todo) => (
                                    <div key={todo.id} className="bg-background p-4 rounded-xl border border-primary/5 flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        <span className="font-medium">{todo.title}</span>
                                        <span className="ml-auto text-xs text-muted-foreground">
                                            {(todo as any).resources?.length || 0} Resources
                                        </span>
                                    </div>
                                ))}
                                {mpPlan.plan.todos.length > 5 && (
                                    <div className="text-center pt-4">
                                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                            <Lock className="w-4 h-4" />
                                            Fork this plan to see the remaining {mpPlan.plan.todos.length - 5} tasks
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        <Card className="rounded-3xl border-primary/10 shadow-xl shadow-primary/5">
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center text-muted-foreground">
                                            <BarChart className="w-4 h-4 mr-2" />
                                            Difficulty
                                        </div>
                                        <Badge variant="secondary" className="uppercase font-bold text-[10px]">
                                            {mpPlan.plan.difficulty}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center text-muted-foreground">
                                            <Clock className="w-4 h-4 mr-2" />
                                            Duration
                                        </div>
                                        <span className="font-medium text-foreground">{mpPlan.plan.estimatedDuration || "Varies"} Days</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center text-muted-foreground">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Published
                                        </div>
                                        <span className="font-medium text-foreground">{new Date(mpPlan.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Created By</p>
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={mpPlan.user.imageUrl || ""} />
                                            <AvatarFallback>{mpPlan.user.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold text-sm">{mpPlan.user.name}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
                            <h4 className="font-bold flex items-center gap-2 mb-3">
                                <Zap className="w-4 h-4 text-primary" />
                                Why this planner?
                            </h4>
                            <ul className="text-sm space-y-2 text-muted-foreground">
                                <li>• Expertly structured curriculum</li>
                                <li>• Ready to use in one click</li>
                                <li>• Fully customizable after forking</li>
                                <li>• Includes resources & references</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Client component for the fork button to handle the server action
import { ForkButton } from "./ForkButton";
