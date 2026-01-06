import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "./db";
import { usersTable } from "./schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (!user.email) return false;

            try {
                // Check if user exists
                const existingUser = await db
                    .select()
                    .from(usersTable)
                    .where(eq(usersTable.email, user.email))
                    .limit(1);

                if (existingUser.length === 0) {
                    // Create new user
                    await db.insert(usersTable).values({
                        name: user.name || "Unknown",
                        email: user.email,
                        imageUrl: user.image || null,
                        plan: "free",
                        credits: 20, // Give 20 credits on signup
                    });
                } else {
                    // Update existing user's last login
                    await db
                        .update(usersTable)
                        .set({ updatedAt: new Date() })
                        .where(eq(usersTable.email, user.email));
                }
                return true;
            } catch (error) {
                console.error("Error saving user to database:", error);
                return false;
            }
        },
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
    },
    pages: {
        signIn: "/",
    },
});
