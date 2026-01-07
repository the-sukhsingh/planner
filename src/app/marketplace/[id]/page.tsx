"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
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
    Lock,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { ForkButton } from "./ForkButton";
import { useAuth } from "@/context/AuthContext";

export default function MarketplacePlanDetailPage() {
    const params = useParams();
    const id = params.id as Id<"marketplaceplans">;
    const { user } = useAuth();

    const mpPlan = useQuery(api.marketplaceplans.getMarketplacePlan, { planId: id });
    const isPurchasedResult = useQuery(api.purchases.hasPurchased, user ? { userId: user._id, planId: id } : "skip");

    if (mpPlan === undefined) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (mpPlan === null) {
        return (
            <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">Planner Not Found</h1>
                <Link href="/marketplace">
                    <Button>Back to Marketplace</Button>
                </Link>
            </div>
        );
    }

    const isOwner = user?._id === mpPlan.authorId;
    const isPurchased = !!isPurchasedResult || isOwner;

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header / Hero Section */}
            <div className="bg-primary/5 border-b border-primary/10">
                <div className="container mx-auto py-12 px-4 max-w-5xl">
                    <Link href="/marketplace" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors font-medium">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Marketplace
                    </Link>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                        <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold uppercase tracking-wider text-[10px] px-3">
                                    {mpPlan.isFree ? "Free Access" : `${mpPlan.price} Credits`}
                                </Badge>
                                <Badge variant="outline" className="text-muted-foreground font-medium">
                                    {mpPlan.installs} Installations
                                </Badge>
                                {mpPlan.tags?.map(tag => (
                                    <Badge key={tag} variant="secondary" className="opacity-70 font-medium">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                                {mpPlan.snapshot.title}
                            </h1>
                        </div>

                        <div className="w-full md:w-auto">
                            <ForkButton
                                marketplacePlanId={mpPlan._id}
                                isFree={mpPlan.isFree}
                                isPurchased={isPurchased}
                                price={mpPlan.price || 0}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto py-12 px-4 max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-12">
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                                <Target className="w-6 h-6 text-primary" />
                                The Goal
                            </h2>
                            <div className="bg-card p-8 rounded-3xl border border-primary/5 shadow-2xl shadow-primary/5">
                                <p className="text-lg leading-relaxed text-muted-foreground italic">
                                    "{mpPlan.snapshot.description}"
                                </p>
                            </div>
                        </section>

                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <BookOpen className="w-6 h-6 text-primary" />
                                    Tasks & Curriculum
                                </h2>
                                <Badge variant="outline" className="font-bold">{mpPlan.snapshot.todos.length} Tasks</Badge>
                            </div>
                            <div className="bg-muted/30 rounded-3xl p-6 space-y-4 border border-dashed border-primary/20">
                                {mpPlan.snapshot.todos.slice(0, 5).map((todo, idx) => (
                                    <div key={idx} className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-primary/5 flex items-center gap-4 hover:border-primary/20 transition-all duration-300">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <span className="font-semibold block">{todo.title}</span>
                                            {todo.description && <p className="text-xs text-muted-foreground line-clamp-1">{todo.description}</p>}
                                        </div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 bg-muted px-2 py-1 rounded-md">
                                            {todo.estimatedTime ? `${todo.estimatedTime}m` : "15m"}
                                        </div>
                                    </div>
                                ))}
                                {mpPlan.snapshot.todos.length > 5 && (
                                    <div className="text-center pt-6 pb-2">
                                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground bg-background/50 px-4 py-2 rounded-full border border-primary/5">
                                            <Lock className="w-4 h-4 text-primary" />
                                            Remix this plan to see the remaining {mpPlan.snapshot.todos.length - 5} tasks
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 delay-300">
                        <Card className="rounded-[2.5rem] border-primary/10 shadow-2xl shadow-primary/5 overflow-hidden bg-card/50 backdrop-blur-xl">
                            <CardContent className="p-8 space-y-8">
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                                            <BarChart className="w-4 h-4 mr-2 text-primary" />
                                            Difficulty
                                        </div>
                                        <Badge variant="secondary" className="uppercase font-bold text-[10px] tracking-widest bg-primary/10 text-primary border-none">
                                            {mpPlan.snapshot.difficulty}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                                            <Clock className="w-4 h-4 mr-2 text-primary" />
                                            Duration
                                        </div>
                                        <span className="font-bold text-foreground">{mpPlan.snapshot.estimatedDuration || "Varies"} Days</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                                            <Calendar className="w-4 h-4 mr-2 text-primary" />
                                            Published
                                        </div>
                                        <span className="font-bold text-foreground">{new Date(mpPlan.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <Separator className="bg-primary/5" />

                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Created By</p>
                                    <div className="flex items-center gap-4 p-4 rounded-3xl bg-primary/5 border border-primary/10 shadow-inner">
                                        <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                                            <AvatarImage src={mpPlan.author?.imageUrl || ""} />
                                            <AvatarFallback className="font-bold">{mpPlan.author?.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-extrabold text-sm text-foreground">{mpPlan.author?.name}</p>
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Expert Creator</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-linear-to-br from-primary/10 to-transparent rounded-[2.5rem] p-8 border border-primary/10 relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                            <h4 className="font-bold flex items-center gap-2 mb-4 text-primary relative">
                                <Zap className="w-4 h-4 fill-current" />
                                Why this planner?
                            </h4>
                            <ul className="text-sm space-y-3 text-muted-foreground relative">
                                <li className="flex items-start gap-2">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                    <span>Expertly structured curriculum</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                    <span>Ready to use in one click</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                    <span>Fully customizable after remixing</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                    <span>Includes resources & references</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
