"use client"

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

function formatDate(ts: number) {
    const d = new Date(ts);
    return d.toLocaleString();
}

function mapReasonToLabel(reason: string) {
    if (!reason) return 'Activity';
    const r = reason.toLowerCase();
    if (r.includes('chat') || r.includes('ai')) return 'AI Chat Response';
    if (r.includes('top_up') || r.includes('topup') || r.includes('credit')) return 'Credit Top-up';
    if (r.includes('bonus')) return 'Bonus Credit';
    if (r.includes('youtube') || r.includes('video')) return 'YouTube Plan';
    return reason.replace(/_/g, ' ');
}

export default function CreditHistory() {
    const { user, isLoading } = useAuth();

    const transactions = useQuery(
        api.users.listCreditTransactions,
        user?._id ? { userId: user._id, limit: 25 } : "skip"
    );

    if (isLoading) return null;


    return (
        <Card className='h-full lg:max-h-[70vh]'>
            <CardHeader>
                <div className="flex items-start justify-between w-full gap-4">
                    <div>
                        <CardTitle>Credit History</CardTitle>
                        <div className="text-xs text-muted-foreground mt-1">Recent charges and top-ups. Token-level logs are stored securely server-side for auditing.</div>
                    </div>

                    <div className="text-right">
                        <div className="text-sm font-medium text-foreground">{user?.credits ?? 0} remaining</div>
                        <div className="text-xs text-muted-foreground mt-1">No surprise charges — failed or partial responses are not charged.</div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className='overflow-y-auto'>
                {(!transactions || transactions.length === 0) ? (
                    <div className="text-sm text-muted-foreground">No credit activity found.</div>
                ) : (
                    <div className="flex flex-col-reverse gap-3 overflow-y-auto">
                        {transactions.map((tx: any) => {
                            const label = mapReasonToLabel(tx.reason);
                            const isUsage = tx.amount < 0 || (tx.metadata && tx.metadata.type === 'usage');
                            const amountClass = isUsage ? 'text-red-600' : tx.amount > 0 ? 'text-green-600' : 'text-muted-foreground';

                            return (
                                <div key={tx._id} className="py-2 border-b last:border-b-0">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-medium text-foreground">{label}</div>
                                                <div className="text-xs text-muted-foreground">· {formatDate(tx.createdAt)}</div>
                                            </div>
                                            {tx.metadata && tx.metadata.videosCount != null && (
                                                <div className="text-xs text-muted-foreground mt-1">Videos: {tx.metadata.videosCount}</div>
                                            )}
                                        </div>

                                        <div className="shrink-0 text-right">
                                            <div className={`text-sm font-semibold ${amountClass}`}>
                                                {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable details for usage or when metadata exists */}
                                    {(isUsage || tx.metadata) && (
                                        <details className="mt-3">
                                            <summary className="cursor-pointer text-sm text-muted-foreground">Details</summary>
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                {((tx.metadata?.inputTokens != null) || (tx.metadata?.outputTokens != null) || tx.metadata?.totalTokens != null) ? (
                                                    <div>Total tokens: {tx.metadata?.totalTokens ?? ((tx.metadata?.inputTokens ?? 0) + (tx.metadata?.outputTokens ?? 0))}</div>
                                                ) : null}

                                                <div className="mt-2 text-xs text-muted-foreground">Token logs are securely stored server-side for auditing; only the total tokens are shown here.</div>
                                            </div>
                                        </details>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
