"use client";

import React from "react";
import { BuyCreditsButton } from "@/components/BuyCreditsButton";
import { Check } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const PricingPage = () => {
    const tiers = [
        {
            name: "Starter Pack",
            credits: 100,
            price: "$1.10",
            productId: "pdt_0NVkfbJeSIbqQxDZFZpQA",
            description: "Get started with AI-powered learning.",
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
        <div className="min-h-screen bg-background py-10 px-4">
            <div className="max-w-5xl mx-auto">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {tiers.map((tier) => (
                        <Card
                            key={tier.name}
                            className={`relative flex flex-col ${
                                tier.popular ? "border-primary" : "border-border"
                            }`}
                        >
                            {tier.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <div className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                                        Most Popular
                                    </div>
                                </div>
                            )}

                            <CardHeader className="pb-8">
                                <CardTitle className="text-xl font-medium">{tier.name}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                            </CardHeader>

                            <CardContent className="flex-1 space-y-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-semibold">{tier.price}</span>
                                    <span className="text-sm text-muted-foreground">one-time</span>
                                </div>

                                <div className="space-y-3 pt-4 border-t">
                                    {tier.features.map((feature) => (
                                        <div key={feature} className="flex items-start gap-3 text-sm">
                                            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                            <span className="text-foreground">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>

                            <CardFooter className="pt-6">
                                <BuyCreditsButton
                                    productId={tier.productId}
                                    price={tier.price}
                                    variant={tier.popular ? "default" : "outline"}
                                />
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                <div className="max-w-2xl mx-auto space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        All payments are securely processed by Dodo Payments. Credits are added instantly to your account.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Questions? Contact support at{" "}
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
