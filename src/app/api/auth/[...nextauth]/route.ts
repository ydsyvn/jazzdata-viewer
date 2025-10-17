import NextAuth, { NextAuthOptions, Account, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import SpotifyProvider from "next-auth/providers/spotify";

// This is the main configuration object for NextAuth.
export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      // The authorization scope defines the permissions your app is requesting.
      authorization:
        "https://accounts.spotify.com/authorize?scope=user-read-email,user-read-private",
    }),
  ],
  callbacks: {
    /**
     * This callback is called whenever a JSON Web Token is created (i.e. at sign in)
     * or updated (i.e. whenever a session is accessed in the client).
     * We are adding the access token from the provider to the JWT.
     */
    async jwt({
      token,
      account,
    }: {
      token: JWT;
      account: Account | null;
    }): Promise<JWT> {
      // If the user is signing in for the first time, the account object will be available.
      // We save the access token from the provider (e.g., Spotify) to our JWT.
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    /**
     * The session callback is called whenever a session is checked.
     * We are taking the access token from the JWT and making it available on the session object.
     * This allows us to use the access token on the client-side.
     */
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<Session> {
      // Make the access token from the JWT available to the client-side session object.
      // The type definition in `next-auth.d.ts` allows this assignment without a TypeScript error.
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
