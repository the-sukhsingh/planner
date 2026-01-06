import { db } from "@/db";
import { marketplacePlansTable, learningPlansTable, usersTable } from "@/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, FolderDown, Star, TrendingUp, Clock, Tag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MarketplacePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const filter = params.filter as string || "newest";
    const query = params.q as string || "";

    // Fetch marketplace plans with joined data
    const marketplacePlans = await db.query.marketplacePlansTable.findMany({
        where: and(
            eq(marketplacePlansTable.status, "published"),
            eq(marketplacePlansTable.visibility, "public")
        ),
        with: {
            plan: true,
            user: true,
            tags: {
                with: {
                    tag: true
                }
            }
        },
        orderBy: filter === "trending"
            ? [desc(marketplacePlansTable.installs)]
            : [desc(marketplacePlansTable.createdAt)]
    });

    return (
        <div className="container mx-auto py-10 px-4 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Planner Marketplace
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Discover and fork expert-curated learning paths to accelerate your growth.
                    </p>
                </div>
                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search planners..."
                            className="pl-10 h-11 bg-background/50 backdrop-blur-sm focus-visible:ring-primary/20 border-primary/10"
                        />
                    </div>
                    <Link href="/dashboard/marketplace">
                        <Button variant="outline" className="h-11">My Planners</Button>
                    </Link>
                </div>
            </div>

            <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                <Button variant={filter === "newest" ? "default" : "secondary"} size="sm" className="rounded-full px-6">
                    <Clock className="w-4 h-4 mr-2" />
                    Newest
                </Button>
                <Button variant={filter === "trending" ? "default" : "secondary"} size="sm" className="rounded-full px-6">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Trending
                </Button>
                <Button variant={filter === "free" ? "default" : "secondary"} size="sm" className="rounded-full px-6">
                    Free
                </Button>
                <Button variant={filter === "paid" ? "default" : "secondary"} size="sm" className="rounded-full px-6">
                    Premium
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplacePlans.map((mp) => (
                    <Card key={mp.id} className="group overflow-hidden border-primary/5 hover:border-primary/20 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 bg-card/50 backdrop-blur-md flex flex-col">
                        <CardHeader className="relative pb-4">
                            <div className="flex justify-between items-start mb-3">
                                <Badge variant={mp.isFree ? "secondary" : "default"} className="font-semibold px-3 py-1 bg-primary/10 text-primary border-none">
                                    {mp.isFree ? "FREE" : `${mp.price} CREDITS`}
                                </Badge>
                                <div className="flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                                    <FolderDown className="w-3 h-3 mr-1" />
                                    {mp.installs}
                                </div>
                            </div>
                            <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2">
                                {mp.plan.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-2 mt-2 min-h-[40px]">
                                {mp.plan.description || "No description provided."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold opacity-70">
                                    {mp.plan.difficulty}
                                </Badge>
                                {mp.tags.map(t => (
                                    <Badge key={t.tag.id} variant="secondary" className="text-[10px] hover:bg-primary/20 transition-colors">
                                        #{t.tag.name}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-primary/5 pt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 ring-2 ring-primary/5">
                                    <AvatarImage src={mp.user.imageUrl || ""} />
                                    <AvatarFallback>{mp.user.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="text-xs">
                                    <p className="font-medium text-foreground">{mp.user.name}</p>
                                    <p className="text-muted-foreground">Expert Creator</p>
                                </div>
                            </div>
                            <Link href={`/marketplace/${mp.id}`}>
                                <Button size="sm" className="rounded-full px-5 hover:scale-105 transition-transform active:scale-95">
                                    View Detail
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {marketplacePlans.length === 0 && (
                <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-primary/10">
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-1">No planners found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters or search keywords.</p>
                </div>
            )}
        </div>
    );
}
