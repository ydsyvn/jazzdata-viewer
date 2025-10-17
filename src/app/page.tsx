"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Jazz Metadata Viewer</h1>
        <button
          onClick={() => signIn("spotify")}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Sign in with Spotify
        </button>
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Welcome, {session.user?.name}</h1>
        <button
          onClick={() => signOut()}
          className="text-sm text-gray-600 underline"
        >
          Sign out
        </button>
      </div>
      <p className="mt-4">You're signed in! Access token: ✅</p>
    </main>
  );
}
