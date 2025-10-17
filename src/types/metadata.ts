export interface FeaturedArtist {
  name: string;
  instrument?: string;
}

export interface Metadata {
  type: "track" | "album";
  artwork: string | null;
  albumName: string;
  trackName?: string;
  releaseYear: string;
  mainArtist: string;
  otherArtists: string[]; // Keep for backward compatibility with Spotify-only data
  featuredArtists: FeaturedArtist[]; // New detailed artist info from MusicBrainz
  composers: string[];
  producers: string[];
  label: string;
  isrc: string | null;
}
