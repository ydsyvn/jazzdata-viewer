import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

interface SpotifyTrack {
  name: string;
  album: {
    name: string;
    release_date: string;
    images: { url: string }[];
  };
  artists: { name: string }[];
  external_ids: {
    isrc?: string;
  };
}

interface SpotifyAlbum {
  name: string;
  release_date: string;
  images: { url: string }[];
  artists: { name: string }[];
  label: string;
  tracks: {
    items: Array<{
      external_ids?: {
        isrc?: string;
      };
    }>;
  };
}

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

    const [, type, id] = urlMatch;

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

    // Extract common data
    let metadata: any = {
      type,
      artwork: null,
      albumName: "",
      releaseYear: "",
      mainArtist: "",
      otherArtists: [],
      composers: [],
      producers: [],
      label: "",
      isrc: null,
    };

    if (type === "track") {
      const track = spotifyData as SpotifyTrack;
      metadata.artwork = track.album.images[0]?.url || null;
      metadata.albumName = track.album.name;
      metadata.releaseYear = track.album.release_date.split("-")[0];
      metadata.mainArtist = track.artists[0]?.name || "Unknown";
      metadata.otherArtists = track.artists.slice(1).map((a: any) => a.name);
      metadata.isrc = track.external_ids?.isrc;
      metadata.trackName = track.name;
    } else {
      const album = spotifyData as SpotifyAlbum;
      metadata.artwork = album.images[0]?.url || null;
      metadata.albumName = album.name;
      metadata.releaseYear = album.release_date.split("-")[0];
      metadata.mainArtist = album.artists[0]?.name || "Unknown";
      metadata.otherArtists = album.artists.slice(1).map((a: any) => a.name);
      metadata.label = album.label;
      // For albums, get ISRC from first track
      metadata.isrc = album.tracks?.items[0]?.external_ids?.isrc;
    }

    console.log(spotifyResponse);

    console.log(
      `https://musicbrainz.org/ws/2/recording?query=isrc:${metadata.isrc}&fmt=json`
    );

    // Fetch from MusicBrainz if ISRC is available
    if (metadata.isrc) {
      try {
        const mbResponse = await axios.get(
          `https://musicbrainz.org/ws/2/recording?query=isrc:${metadata.isrc}&fmt=json`,
          {
            headers: {
              "User-Agent": "JazzMetadataViewer/1.0.0 (Personal Use)",
            },
          }
        );

        if (
          mbResponse.data.recordings &&
          mbResponse.data.recordings.length > 0
        ) {
          const recording = mbResponse.data.recordings[0];

          console.log(recording);

          // Extract composers
          if (recording.relations) {
            const composerRelations = recording.relations.filter(
              (r: any) => r.type === "composer" || r.type === "writer"
            );
            metadata.composers = composerRelations
              .map((r: any) => r.artist?.name)
              .filter(Boolean);

            const producerRelations = recording.relations.filter(
              (r: any) => r.type === "producer"
            );
            metadata.producers = producerRelations
              .map((r: any) => r.artist?.name)
              .filter(Boolean);
          }

          // Get additional artist credits
          if (recording["artist-credit"]) {
            const mbArtists = recording["artist-credit"]
              .filter((ac: any) => ac.artist?.name !== metadata.mainArtist)
              .map((ac: any) => ac.artist?.name)
              .filter(Boolean);

            metadata.otherArtists = [
              ...new Set([...metadata.otherArtists, ...mbArtists]),
            ];
          }
        }
      } catch (mbError) {
        console.error("MusicBrainz API error:", mbError);
        // Continue with Spotify data only
      }
    }

    return NextResponse.json(metadata);
  } catch (error: any) {
    console.error("Error fetching metadata:", error);

    if (error.response?.status === 404) {
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
