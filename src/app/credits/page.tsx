"use client";

import React from "react";
import { BuyCreditsButton } from "@/components/BuyCreditsButton";
import { Check } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import CreditHistory from './CreditHistory';

const PricingPage = () => {
    const tiers = [
        {
            name: "Starter Pack",
            credits: 100,
            price: "$1.10",
            productId: "pdt_0NVkfbJeSIbqQxDZFZpQA",
            description: "Perfect for trying out AI features.",
            features: [
                "100 AI Credits",
                "$0.011 per credit",
                "Pay as you go",
                "No expiration",
            ],
            popular: false,
        },
        {
            name: "Value Pack",
            credits: 400,
            price: "$3.33",
            productId: "pdt_0NVl8hUVufh9IXEDXgI8u",
            description: "Best value for regular learners.",
            features: [
                "400 AI Credits",
                "$0.0083 per credit",
                "Pay as you go",
                "No expiration",
            ],
            popular: true,
        },
        {
            name: "Power Pack",
            credits: 1000,
            price: "$6.67",
            productId: "pdt_0NVlZtyWjflp2R1yZP0H7",
            description: "Maximum credits at the best rate.",
            features: [
                "1000 AI Credits",
                "$0.0067 per credit",
                "Pay as you go",
                "No expiration",
            ],
            popular: false,
        },
    ];

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto max-w-6xl py-6 px-4 md:px-6">
                {/* Hero + Credit History */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-10">
                    <div className="p-2">
                        <h1 className="text-4xl font-bold tracking-tight mb-2 ">
                            Credits
                        </h1>
                        <p className="text-sm text-muted-foreground max-w-xl">
                            Purchase credits to power AI features across the app. Credits are only deducted after a successful AI response — failed or partial responses are not charged.
                        </p>

                        <div className="mt-3 text-sm text-muted-foreground flex flex-col gap-2">
                            <span className="inline-flex items-center mr-3"><span className="w-2 h-2 rounded-full bg-green-600 mr-2" aria-hidden></span>No surprise charges — only successful responses consume credits.</span>
                            <span className="text-muted-foreground inline-flex items-center"><span className="w-2 h-2 rounded-full bg-green-600 mr-2" aria-hidden></span>Credits never expire.</span>
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-3">
                            <Link href="#pricing" className="inline-block">
                                <span className="inline-flex items-center rounded px-3 py-1 text-sm font-medium border border-border text-foreground hover:bg-muted transition">
                                    View plans
                                </span>
                            </Link>
                        </div>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
                            <div>
                                <div className="text-xs">Short chat</div>
                                <div className="font-medium">1–2 credits</div>
                            </div>
                            <div>
                                <div className="text-xs">Long explanation</div>
                                <div className="font-medium">3–5 credits</div>
                            </div>
                            <div>
                                <div className="text-xs">Playlist / batch</div>
                                <div className="font-medium">8–15 credits</div>
                            </div>
                        </div>

                        <p className="mt-4 text-xs text-muted-foreground max-w-xl">
                            Credits are deducted only after successful AI responses. Token-level logs are stored securely server-side for auditing; only totals are shown here.
                        </p>
                    </div>

                    <div className="w-full">
                        <CreditHistory />
                    </div>
                </section>

                {/* Pricing */}
                <section id="pricing" className="mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tiers.map((tier) => (
                            <Card
                                key={tier.name}
                                className={`relative flex flex-col rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-transform transform hover:-translate-y-1 ${tier.popular ? 'ring-2 ring-primary/20' : ''}`}
                            >
                                {tier.popular && (
                                    <div className="absolute top-3 right-3">
                                        <div className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">Most Popular</div>
                                    </div>
                                )}

                                <CardHeader className="pt-6 pb-4">
                                    <CardTitle className="text-lg font-medium">{tier.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                                </CardHeader>

                                <CardContent className="flex-1">
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-3xl md:text-4xl font-extrabold">{tier.price}</span>
                                        <span className="text-sm text-muted-foreground">one-time</span>
                                    </div>

                                    <div className="mt-5 space-y-3">
                                        {tier.features.map((feature) => (
                                            <div key={feature} className="flex items-start gap-3 text-sm">
                                                <Check className="h-4 w-4 text-primary mt-1 shrink-0" />
                                                <span className="text-foreground">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>

                                <CardFooter className="pt-4 pb-6 px-6">
                                    <BuyCreditsButton
                                        productId={tier.productId}
                                        price={tier.price}
                                        variant={tier.popular ? "default" : "outline"}
                                    />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </section>

                <div className="max-w-2xl mx-auto space-y-4 text-center text-sm text-muted-foreground">
                    <p>
                        All payments are securely processed by Dodo Payments. Credits are added instantly to your account.
                    </p>
                    <p>
                        Questions? Contact support at{' '}
                        <Link href="mailto:sukhaji65@gmail.com" className="text-foreground underline underline-offset-4">
                            sukhaji65@gmail.com
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
