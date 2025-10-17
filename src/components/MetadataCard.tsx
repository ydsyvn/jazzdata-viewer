import { Metadata } from "@/types/metadata";
import Image from "next/image";

interface MetadataCardProps {
  metadata: Metadata;
}

export default function MetadataCard({ metadata }: MetadataCardProps) {
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
      <div className="border-b border-white/10 pb-3 last:border-b-0">
        <dt className="text-sm font-medium text-purple-300 mb-1">{label}</dt>
        <dd className="text-base text-white">{displayValue}</dd>
      </div>
    );
  };

  // Determine if we have MusicBrainz data
  const hasMusicBrainzData = metadata.featuredArtists.length > 0;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
      {/* Album Artwork */}
      <div className="relative w-full aspect-square bg-gradient-to-br from-purple-900/50 to-slate-900/50">
        {metadata.artwork ? (
          <Image
            src={metadata.artwork}
            alt={metadata.albumName}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white/30 text-6xl">🎵</div>
          </div>
        )}
      </div>

      {/* Metadata Content */}
      <div className="p-6">
        {/* Title Section */}
        <div className="mb-6">
          {metadata.trackName && (
            <h2 className="text-2xl font-bold text-white mb-1">
              {metadata.trackName}
            </h2>
          )}
          <h3 className="text-xl font-semibold text-purple-200">
            {metadata.albumName}
          </h3>
          <p className="text-sm text-purple-300/70 mt-1">
            {metadata.releaseYear} •{" "}
            {metadata.type === "track" ? "Track" : "Album"}
          </p>
        </div>

        {/* Credits */}
        <dl className="space-y-3">
          <InfoRow label="Main Artist" value={metadata.mainArtist} />

          {/* Featured Artists with Instruments (MusicBrainz data) */}
          {hasMusicBrainzData && metadata.featuredArtists.length > 0 && (
            <div className="border-b border-white/10 pb-3">
              <dt className="text-sm font-medium text-purple-300 mb-2">
                Featured Artists
              </dt>
              <dd className="space-y-1">
                {metadata.featuredArtists.map((artist, index) => (
                  <div
                    key={index}
                    className="text-base text-white flex items-baseline gap-2"
                  >
                    <span>{artist.name}</span>
                    {artist.instrument && (
                      <span className="text-sm text-purple-300/80">
                        - {artist.instrument}
                      </span>
                    )}
                  </div>
                ))}
              </dd>
            </div>
          )}

          {/* Fallback to Spotify-only featured artists if no MusicBrainz data */}
          {!hasMusicBrainzData && metadata.otherArtists.length > 0 && (
            <InfoRow label="Featured Artists" value={metadata.otherArtists} />
          )}

          <InfoRow
            label="Composers"
            value={metadata.composers.length > 0 ? metadata.composers : null}
          />
          <InfoRow
            label="Producers"
            value={metadata.producers.length > 0 ? metadata.producers : null}
          />
          <InfoRow label="Label" value={metadata.label || null} />
        </dl>
      </div>
    </div>
  );
}
