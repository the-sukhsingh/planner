"use client";

import React from "react";
import { BuyCreditsButton } from "@/components/BuyCreditsButton";
import { Rocket, Check, Sparkles, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const PricingPage = () => {
    const tiers = [
        {
            name: "Starter",
            credits: 100,
            price: "₹99",
            productId: "pdt_0NVkfbJeSIbqQxDZFZpQA", // Placeholder
            description: "Perfect for students starting their journey.",
            features: [
                "100 AI Credits",
                "Unlimited Plans",
                "Document Processing",
                "Community Support",
            ],
            popular: false,
        },
        {
            name: "Popular",
            credits: 400,
            price: "₹299",
            productId: "pdt_0NVl8hUVufh9IXEDXgI8u", // Placeholder
            description: "Best balance of credits and value.",
            features: [
                "400 AI Credits (₹0.75/credit)",
                "Priority AI Processing",
                "Advanced Analytics",
                "Priority Support",
            ],
            popular: true,
        },
        {
            name: "Pro",
            credits: 1000,
            price: "₹599",
            productId: "pdt_0NVlZtyWjflp2R1yZP0H7", // Placeholder
            description: "The ultimate package for power learners.",
            features: [
                "1000 AI Credits (₹0.59/credit)",
                "Early Access Features",
                "Personalized Insights",
                "Dedicated Support",
            ],
            popular: false,
        },
    ];

    return (
        <div className="min-h-screen bg-linear-to-b from-background to-accent/20 py-20 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center space-y-4 mb-16 animate-in fade-in slide-in-from-top-10 duration-1000">
                    <Badge variant="outline" className="px-4 py-1 border-primary/20 text-primary bg-primary/5 rounded-full">
                        <Sparkles className="h-3 w-3 mr-2" />
                        Pricing Plans
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                        Boost Your <span className="text-primary">Learning</span> Power
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Choose the best plan to power your learning journey with AI-driven insights and structured plans.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {tiers.map((tier, index) => (
                        <Card
                            key={tier.name}
                            className={`relative flex flex-col overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 group ${tier.popular ? "border-primary shadow-xl scale-105 z-10" : "border-border/50 hover:border-primary/20"
                                } animate-in fade-in slide-in-from-bottom-10 duration-700`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {tier.popular && (
                                <div className="absolute top-0 right-0">
                                    <div className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-8 py-1 rotate-45 translate-x-10 translate-y-3 shadow-lg">
                                        Popular
                                    </div>
                                </div>
                            )}

                            <CardHeader>
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`p-2 rounded-lg ${tier.popular ? "bg-primary/20 text-primary" : "bg-accent text-muted-foreground"}`}>
                                        <Rocket className="h-6 w-6" />
                                    </div>
                                    {tier.popular && (
                                        <Badge className="bg-primary/10 text-primary border-primary/20">Best Value</Badge>
                                    )}
                                </div>
                                <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                                <CardDescription className="text-sm">{tier.description}</CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1 space-y-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-extrabold">{tier.price}</span>
                                    <span className="text-muted-foreground">one-time</span>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                                        <Shield className="h-3 w-3" />
                                        What's Included
                                    </p>
                                    {tier.features.map((feature) => (
                                        <div key={feature} className="flex items-start gap-3 text-sm">
                                            <div className="mt-1 bg-primary/20 rounded-full p-0.5">
                                                <Check className="h-3 w-3 text-primary" />
                                            </div>
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>

                            <CardFooter className="pt-6">
                                <BuyCreditsButton
                                    productId={tier.productId}
                                    credits={tier.credits}
                                    price={tier.price}
                                    variant={tier.popular ? "default" : "outline"}
                                />
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                <div className="mt-20 p-8 rounded-3xl bg-primary/5 border border-primary/10 text-center space-y-4 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold">Secure Payment Processing</h2>
                    <p className="text-muted-foreground">
                        All payments are securely handled by Dodo Payments. We do not store your credit card information. Credits are added to your account immediately after a successful transaction.
                    </p>
                    <div className="text-center text-balance grayscale opacity-50">
                        If you have any questions about our pricing plans or need assistance, please contact our support team <Link href="mailto:sukhaji65@gmail.com" className="underline">here</Link>.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
