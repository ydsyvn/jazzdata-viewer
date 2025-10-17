import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";
import { Metadata, FeaturedArtist } from "../../../types/metadata";

// --- Spotify Interfaces ---

interface SpotifyArtist {
  name: string;
}

interface SpotifyImage {
  url: string;
}

interface SpotifyTrackAlbum {
  name: string;
  release_date: string;
  images: SpotifyImage[];
}

interface SpotifyTrack {
  name: string;
  album: SpotifyTrackAlbum;
  artists: SpotifyArtist[];
  external_ids: {
    isrc?: string;
  };
  href?: string;
}

interface SpotifyAlbum {
  name: string;
  release_date: string;
  images: SpotifyImage[];
  artists: SpotifyArtist[];
  label: string;
  tracks: {
    items: SpotifyTrack[];
  };
}

// --- MusicBrainz Interfaces ---

interface MusicBrainzArtistCredit {
  name: string;
  artist: {
    name: string;
    id: string;
  };
  joinphrase: string;
}

interface MusicBrainzRelation {
  type: string;
  artist?: {
    name: string;
    id: string;
  };
  attributes?: string[];
}

interface MusicBrainzRecording {
  id: string;
  title: string;
  "artist-credit"?: MusicBrainzArtistCredit[];
  relations?: MusicBrainzRelation[];
}

interface MusicBrainzResponse {
  count: number;
  offset: number;
  recordings: MusicBrainzRecording[];
}

interface MusicBrainzDetailedRecording {
  id: string;
  title: string;
  relations?: MusicBrainzRelation[];
}

// --- API Route ---

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const spotifyUrl = searchParams.get("url");
  const accessToken = searchParams.get("token");

  if (!spotifyUrl || !accessToken) {
    return NextResponse.json(
      { error: "Missing URL or access token" },
      { status: 400 }
    );
  }

  try {
    // Parse Spotify URL
    const urlMatch = spotifyUrl.match(
      /spotify\.com\/(track|album)\/([a-zA-Z0-9]+)/
    );
    if (!urlMatch) {
      return NextResponse.json(
        { error: "Invalid Spotify URL format" },
        { status: 400 }
      );
    }

    const [, urlType, id] = urlMatch;
    const type = urlType as "track" | "album";

    // Fetch from Spotify
    const spotifyEndpoint =
      type === "track"
        ? `https://api.spotify.com/v1/tracks/${id}`
        : `https://api.spotify.com/v1/albums/${id}`;

    const spotifyResponse = await axios.get(spotifyEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const spotifyData = spotifyResponse.data;

    // Type the Spotify data based on the determined type
    let track: SpotifyTrack | undefined;
    let album: SpotifyAlbum | undefined;

    if (type === "track") {
      track = spotifyData as SpotifyTrack;
    } else {
      album = spotifyData as SpotifyAlbum;
    }

    // Extract common data
    const metadata: Metadata = {
      type,
      artwork: null,
      albumName: "",
      releaseYear: "",
      mainArtist: "",
      otherArtists: [],
      featuredArtists: [],
      composers: [],
      producers: [],
      label: "",
      isrc: null,
    };

    if (track) {
      metadata.artwork = track.album.images[0]?.url || null;
      metadata.albumName = track.album.name;
      metadata.releaseYear = track.album.release_date.split("-")[0];
      metadata.mainArtist = track.artists[0]?.name || "Unknown";
      metadata.otherArtists = track.artists
        .slice(1)
        .map((a: SpotifyArtist) => a.name);
      metadata.isrc = track.external_ids?.isrc ?? null;
      metadata.trackName = track.name;
    } else if (album) {
      metadata.artwork = album.images[0]?.url || null;
      metadata.albumName = album.name;
      metadata.releaseYear = album.release_date.split("-")[0];
      metadata.mainArtist = album.artists[0]?.name || "Unknown";
      metadata.otherArtists = album.artists
        .slice(1)
        .map((a: SpotifyArtist) => a.name);
      metadata.label = album.label;

      // For albums, fetch the first track to get its ISRC
      const firstTrackHref = album.tracks?.items[0]?.href;
      if (firstTrackHref) {
        try {
          const firstTrackResponse = await axios.get<SpotifyTrack>(
            firstTrackHref,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          metadata.isrc = firstTrackResponse.data.external_ids?.isrc ?? null;
        } catch (trackError) {
          console.error(
            "Error fetching first track for ISRC:",
            trackError instanceof AxiosError ? trackError.message : trackError
          );
          // Continue without ISRC
        }
      }
    }

    // Fetch from MusicBrainz if ISRC is available
    if (metadata.isrc) {
      try {
        // Step 1: Get MBID using ISRC
        const mbSearchResponse = await axios.get<MusicBrainzResponse>(
          `https://musicbrainz.org/ws/2/recording?query=isrc:${metadata.isrc}&fmt=json`,
          {
            headers: {
              "User-Agent": "JazzMetadataViewer/1.0.0 (Personal Use)",
            },
          }
        );

        const mbSearchData = mbSearchResponse.data;

        if (mbSearchData.recordings && mbSearchData.recordings.length > 0) {
          const mbid = mbSearchData.recordings[0].id;

          // Step 2: Get detailed recording info using MBID
          const mbDetailResponse =
            await axios.get<MusicBrainzDetailedRecording>(
              `https://musicbrainz.org/ws/2/recording/${mbid}?inc=artist-rels+work-rels&fmt=json`,
              {
                headers: {
                  "User-Agent": "JazzMetadataViewer/1.0.0 (Personal Use)",
                },
              }
            );

          const recording = mbDetailResponse.data;

          // Process relations
          if (recording.relations) {
            const featuredArtists: FeaturedArtist[] = [];
            const composers: string[] = [];
            const producers: string[] = [];

            for (const relation of recording.relations) {
              const artistName = relation.artist?.name;

              // Skip if no artist name or if it's the main artist
              if (!artistName || artistName === metadata.mainArtist) {
                continue;
              }

              if (relation.type === "instrument" || relation.type === "vocal") {
                const instrument = relation.attributes?.[0];
                featuredArtists.push({
                  name: artistName,
                  instrument: instrument || relation.type,
                });
              } else if (relation.type === "producer") {
                producers.push(artistName);
              } else if (
                relation.type === "composer" ||
                relation.type === "writer"
              ) {
                composers.push(artistName);
              }
            }

            // Update metadata with MusicBrainz data
            metadata.featuredArtists = featuredArtists;
            metadata.producers = [...new Set(producers)]; // Remove duplicates
            metadata.composers = [...new Set(composers)]; // Remove duplicates
          }
        }
      } catch (mbError) {
        console.error(
          "MusicBrainz API error:",
          mbError instanceof AxiosError ? mbError.message : mbError
        );
        // Continue with Spotify data only
      }
    }

    return NextResponse.json(metadata);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return NextResponse.json(
        { error: "Track or album not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch metadata" },
      { status: 500 }
    );
  }
}
