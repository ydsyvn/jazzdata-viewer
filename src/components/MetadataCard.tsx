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
          <InfoRow label="Featured Artists" value={metadata.otherArtists} />
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

        {/* Data Availability Notice */}
        {metadata.composers.length === 0 && metadata.producers.length === 0 && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-200 text-xs">
              ℹ️ Extended credits not available for this {metadata.type}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
