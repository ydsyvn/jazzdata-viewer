export interface Metadata {
  type: "track" | "album";
  artwork: string | null;
  albumName: string;
  trackName?: string;
  releaseYear: string;
  mainArtist: string;
  otherArtists: string[];
  composers: string[];
  producers: string[];
  label: string;
  isrc: string | null;
}
