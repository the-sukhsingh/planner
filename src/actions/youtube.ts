"use server";

import { auth } from "@/auth";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";

async function getCurrentUser() {
    const session = await auth();
    if (!session?.user?.email) return null;
    
    const user = await fetchQuery(api.users.getUserByEmail, { 
        email: session.user.email 
    });
    
    return user;
}

interface YouTubeVideo {
    title: string;
    description: string;
    videoId: string;
    position: number;
}

async function fetchYouTubePlaylist(playlistId: string): Promise<YouTubeVideo[]> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        throw new Error("YouTube API key not configured");
    }

    const videos: YouTubeVideo[] = [];
    let nextPageToken = '';

    try {
        do {
            const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.items) {
                data.items.forEach((item: any) => {
                    videos.push({
                        title: item.snippet.title,
                        description: item.snippet.description || '',
                        videoId: item.snippet.resourceId.videoId,
                        position: item.snippet.position,
                    });
                });
            }

            nextPageToken = data.nextPageToken || '';
        } while (nextPageToken);

        return videos.sort((a, b) => a.position - b.position);
    } catch (error) {
        console.error('Error fetching YouTube playlist:', error);
        throw new Error('Failed to fetch YouTube playlist');
    }
}

function extractPlaylistId(url: string): string | null {
    // Handle different YouTube playlist URL formats
    const patterns = [
        /[?&]list=([^&]+)/,  // Standard format
        /youtube\.com\/playlist\?list=([^&]+)/,
        /youtube\.com\/watch\?.*list=([^&]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    // If it's just the playlist ID
    if (/^[A-Za-z0-9_-]+$/.test(url)) {
        return url;
    }

    return null;
}

export async function createPlanFromYouTubePlaylist(playlistUrl: string, planData: {
    title?: string;
    description?: string;
    difficulty?: string;
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    if (user.credits < 10) throw new Error("Not enough credits");

    // Extract playlist ID
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
        throw new Error("Invalid YouTube playlist URL");
    }

    // Fetch playlist videos
    const videos = await fetchYouTubePlaylist(playlistId);
    if (videos.length === 0) {
        throw new Error("No videos found in playlist");
    }

    // Create the learning plan
    const planId = await fetchMutation(api.plans.createPlan, {
        userId: user._id,
        title: planData.title || videos[0]?.title || "YouTube Playlist",
        description: planData.description || `Learning plan from YouTube playlist with ${videos.length} videos`,
        difficulty: (planData.difficulty as "easy" | "medium" | "hard") || "medium",
        estimatedDuration: videos.length,
        status: "active",
        isForked: false,
    });

    // Create todos from videos
    const planStartDate = Date.now();
    const todoValues = videos.map((video, index) => {
        const dueDate = planStartDate + (index * 24 * 60 * 60 * 1000); // Add days in milliseconds
        return {
            planId: planId,
            title: video.title,
            description: video.description || undefined,
            order: index,
            priority: "medium" as const,
            status: "pending",
            dueDate: dueDate,
            estimatedTime: undefined,
            resources: [`https://www.youtube.com/watch?v=${video.videoId}`],
        };
    });

    await fetchMutation(api.todos.createMultipleTodos, {
        todos: todoValues
    });

    // Deduct 10 credits from user
    await fetchMutation(api.users.deductCredits, {
        userId: user._id,
        amount: 10
    });

    return { success: true, planId: planId, videosCount: videos.length };
}
