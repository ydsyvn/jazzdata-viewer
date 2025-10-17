"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Metadata } from "@/types/metadata";
import MetadataCard from "@/components/MetadataCard";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const [url, setUrl] = useState("");
  const searchParams = useSearchParams();
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sharedUrl = searchParams.get("url");
    if (sharedUrl && !url) {
      setUrl(sharedUrl);
      handleFetch(sharedUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Extracted fetch logic into a reusable function
  const handleFetch = async (spotifyUrl: string) => {
    setLoading(true);
    setError(null);
    setMetadata(null);

    try {
      // Get Spotify access token
      const tokenResponse = await axios.get("/api/spotify-token");
      const { access_token } = tokenResponse.data;

      // Fetch metadata
      const metadataResponse = await axios.get("/api/metadata", {
        params: {
          url: spotifyUrl.trim(),
          token: access_token,
        },
      });

      setMetadata(metadataResponse.data);
    } catch (err) {
      let errorMessage =
        "Failed to fetch metadata. Please check the URL and try again.";

      if (axios.isAxiosError(err) && err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("Please enter a Spotify URL");
      return;
    }

    await handleFetch(url);
  };

  const handleClear = () => {
    setUrl("");
    setMetadata(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Jazz Metadata Viewer
          </h1>
          <p className="text-purple-200 text-sm md:text-base">
            Discover detailed credits for your favorite jazz tracks and albums
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="spotify-url"
                className="block text-sm font-medium text-purple-200 mb-2"
              >
                Spotify URL
              </label>
              <input
                id="spotify-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://open.spotify.com/track/..."
                className="w-full px-4 py-3 bg-white/20 border border-purple-300/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                disabled={loading}
              />
              <p className="mt-2 text-xs text-purple-300/70">
                Paste a Spotify track or album share link
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800/50 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : "Get Metadata"}
              </button>

              {(metadata || error) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Metadata Display */}
        {metadata && <MetadataCard metadata={metadata} />}

        {/* Footer */}
        <div className="text-center mt-8 text-purple-300/60 text-xs">
          <p>Data from Spotify and MusicBrainz APIs</p>
        </div>
      </div>
    </main>
  );
}
