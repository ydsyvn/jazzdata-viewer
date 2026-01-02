import { Metadata } from "@/types/metadata";
import Image from "next/image";

interface MetadataCardProps {
  metadata: Metadata;
}

export default function MetadataCard({ metadata }: MetadataCardProps) {
  const ExternalLinkIcon = () => (
    <svg
      className="w-3 h-3 ml-1 inline-block opacity-70 group-hover:opacity-100 transition-opacity"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );

  const InfoRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | string[] | null;
  }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return null;
    }

    const displayValue = Array.isArray(value) ? value.join(", ") : value;

    return (
      <div className="border-b border-white/5 pb-3 last:border-b-0">
        <dt className="text-xs uppercase tracking-wider font-semibold text-purple-300/80 mb-1">
          {label}
        </dt>
        <dd className="text-base text-gray-100">{displayValue}</dd>
      </div>
    );
  };

  // Determine if we have detailed instrument data (from MusicBrainz)
  const hasDetailedData = metadata.featuredArtists.some((a) => a.instrument);
  const showFeaturedArtists = metadata.featuredArtists.length > 0;

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
      {/* Hero Section */}
      <div className="relative w-full aspect-square md:aspect-video bg-gradient-to-br from-purple-900/60 to-slate-900/60 flex flex-col justify-end p-6 md:p-8">
        {metadata.artwork ? (
          <>
            <Image
              src={metadata.artwork}
              alt={metadata.albumName}
              fill
              className="object-cover -z-10"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center -z-10">
            <span className="text-white/20 text-8xl">🎵</span>
          </div>
        )}

        {/* Hero Content */}
        <div className="relative z-10 space-y-3 md:space-y-4">
          {/* Main Artist */}
          <div className="flex flex-wrap items-baseline gap-2 leading-none">
            {metadata.mainArtistUrl ? (
              <a
                href={metadata.mainArtistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg md:text-2xl font-bold text-purple-300 hover:text-white transition-colors flex items-center group leading-tight"
              >
                {metadata.mainArtist}
                <ExternalLinkIcon />
              </a>
            ) : (
              <span className="text-lg md:text-2xl font-bold text-purple-300 leading-tight">
                {metadata.mainArtist}
              </span>
            )}
            {metadata.mainArtistInstrument && (
              <span className="text-sm md:text-base font-light text-purple-200/80 italic">
                — {metadata.mainArtistInstrument}
              </span>
            )}
          </div>

          {/* Title */}
          {metadata.trackName && (
            <h1 className="text-3xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
              {metadata.trackName}
            </h1>
          )}

          {/* Album */}
          <div className="flex flex-wrap items-center text-purple-200/90 text-sm md:text-base gap-y-1">
            <span className="mr-2 opacity-70 hidden md:inline">Album:</span>
            {metadata.albumUrl ? (
              <a
                href={metadata.albumUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-white transition-colors flex items-center group mr-2"
              >
                {metadata.albumName}
                <ExternalLinkIcon />
              </a>
            ) : (
              <span className="font-medium mr-2">{metadata.albumName}</span>
            )}
            <span className="opacity-50 mx-1">•</span>
            <span className="mx-1">{metadata.releaseYear}</span>
            <span className="opacity-50 mx-1">•</span>
            <span className="capitalize mx-1">{metadata.type}</span>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="p-6 md:p-8 bg-black/20 space-y-8">
        <dl className="space-y-6">
          {/* Missing Data Warning */}
          {!hasDetailedData && showFeaturedArtists && (
             <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-yellow-200/80 text-sm flex items-start gap-2">
               <svg className="w-5 h-5 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               <p>Detailed instrument data not available. Showing basic artist list from Spotify.</p>
             </div>
          )}

          {/* Featured Artists */}
          {showFeaturedArtists && (
            <div className="border-b border-white/5 pb-6">
              <dt className="text-xs uppercase tracking-wider font-bold text-purple-400/90 mb-4">
                Featured Artists
              </dt>
              <dd className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {metadata.featuredArtists.map((artist, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 text-gray-100 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500/70 shrink-0" />
                    <div className="flex flex-col">
                    {artist.spotifyUrl ? (
                       <a
                         href={artist.spotifyUrl}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="font-medium hover:text-purple-300 transition-colors flex items-center group"
                       >
                         {artist.name}
                         <ExternalLinkIcon />
                       </a>
                    ) : (
                       <span className="font-medium">{artist.name}</span>
                    )}
                    </div>
                    {artist.instrument && (
                      <span className="text-sm text-gray-400 italic">
                        - {artist.instrument}
                      </span>
                    )}
                  </div>
                ))}
              </dd>
            </div>
          )}

          {/* Fallback Featured Artists (legacy support) */}
          {!showFeaturedArtists && metadata.otherArtists.length > 0 && (
            <InfoRow label="Featured Artists" value={metadata.otherArtists} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InfoRow
              label="Composers"
              value={metadata.composers.length > 0 ? metadata.composers : null}
            />
            <InfoRow
              label="Producers"
              value={metadata.producers.length > 0 ? metadata.producers : null}
            />
          </div>

          <InfoRow label="Label" value={metadata.label || null} />
        </dl>
      </div>
    </div>
  );
}
