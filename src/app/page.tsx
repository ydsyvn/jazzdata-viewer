"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { Metadata } from "@/types/metadata";
import MetadataCard from "@/components/MetadataCard";

function HomeContent() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState("");
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const metadataCardRef = useRef<HTMLDivElement>(null);

  // Handle shared URLs from PWA share target
  useEffect(() => {
    const sharedUrl = searchParams.get("url");
    if (sharedUrl) {
      setUrl(sharedUrl);
      // Auto-submit the form with the shared URL
      fetchMetadata(sharedUrl);
    }
  }, [searchParams]);

  const fetchMetadata = async (spotifyUrl: string) => {
    if (!spotifyUrl.trim()) {
      setError("Please enter a Spotify URL");
      return;
    }

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

      // Scroll to metadata card after a brief delay to ensure render
      setTimeout(() => {
        metadataCardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
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
    await fetchMetadata(url);
  };

  const handleClear = () => {
    setUrl("");
    setMetadata(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#1a103c] to-black p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-8">
        {/* Header */}
        <div className="text-center pt-8 md:pt-16 pb-6">
          <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-white to-purple-200 mb-4 tracking-tight">
            Jazzdata
          </h1>
          <p className="text-purple-200/60 text-lg font-light tracking-wide">
            Detailed credits, personnel & instruments for your favorite jazz records
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl">
          <form onSubmit={handleSubmit} className="bg-black/20 rounded-xl p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="spotify-url"
                className="block text-xs font-semibold uppercase tracking-wider text-purple-300/80 pl-1"
              >
                Spotify Link
              </label>
              <div className="relative group">
                <input
                  id="spotify-url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste a Spotify track or album link..."
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-300/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent focus:bg-white/10 transition-all shadow-inner"
                  disabled={loading}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-purple-900 disabled:to-indigo-900 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </span>
                ) : "Get Metadata"}
              </button>

              {(metadata || error) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-colors duration-200"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 mx-6 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Metadata Display */}
        {metadata && (
          <div ref={metadataCardRef} className="pb-12">
            <MetadataCard metadata={metadata} />
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-purple-300/40 text-xs py-8">
          <p>Powered by Spotify & MusicBrainz APIs</p>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#1a103c] to-black p-4 md:p-8 flex flex-col items-center">
          <div className="max-w-3xl w-full space-y-8">
            <div className="text-center pt-8 md:pt-16 pb-6">
              <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-white to-purple-200 mb-4 tracking-tight">
                Jazzdata
              </h1>
              <p className="text-purple-200/60 text-lg font-light tracking-wide italic">
                Warming up...
              </p>
            </div>
          </div>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
