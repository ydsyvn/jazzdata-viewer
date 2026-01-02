import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";
import { Metadata, FeaturedArtist } from "../../../types/metadata";

// --- Spotify Interfaces ---

interface SpotifyExternalUrls {
  spotify: string;
}

interface SpotifyArtist {
  name: string;
  id: string;
  external_urls: SpotifyExternalUrls;
}

interface SpotifyImage {
  url: string;
}

interface SpotifyTrackAlbum {
  name: string;
  release_date: string;
  images: SpotifyImage[];
  external_urls: SpotifyExternalUrls;
}

interface SpotifyTrack {
  name: string;
  album: SpotifyTrackAlbum;
  artists: SpotifyArtist[];
  external_ids: {
    isrc?: string;
  };
  href?: string;
  external_urls: SpotifyExternalUrls;
}

interface SpotifyAlbum {
  name: string;
  release_date: string;
  images: SpotifyImage[];
  external_urls: SpotifyExternalUrls;
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

    // Populate metadata from Spotify initially
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
      
      // Spotify URLs
      metadata.mainArtistUrl = track.artists[0]?.external_urls?.spotify;
      metadata.albumUrl = track.album.external_urls?.spotify;

      // Populate featured artists with Spotify URLs
      // This serves as the fallback if MusicBrainz fails
      metadata.featuredArtists = track.artists.slice(1).map((a) => ({
        name: a.name,
        spotifyUrl: a.external_urls?.spotify,
      }));
    } else if (album) {
      metadata.artwork = album.images[0]?.url || null;
      metadata.albumName = album.name;
      metadata.releaseYear = album.release_date.split("-")[0];
      metadata.mainArtist = album.artists[0]?.name || "Unknown";
      metadata.otherArtists = album.artists
        .slice(1)
        .map((a: SpotifyArtist) => a.name);
      metadata.label = album.label;
      
      // Spotify URLs
      metadata.mainArtistUrl = album.artists[0]?.external_urls?.spotify;
      metadata.albumUrl = album.external_urls?.spotify;

      // Populate featured artists with Spotify URLs
      metadata.featuredArtists = album.artists.slice(1).map((a) => ({
        name: a.name,
        spotifyUrl: a.external_urls?.spotify,
      }));

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

    // Fetch from MusicBrainz
    let mbid: string | null = null;

    // Try to get MBID using ISRC first
    if (metadata.isrc) {
      try {
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
          mbid = mbSearchData.recordings[0].id;
        }
      } catch (mbError) {
        console.error(
          "MusicBrainz ISRC search error:",
          mbError instanceof AxiosError ? mbError.message : mbError
        );
      }
    }

    // Fallback: Search by title and artist if ISRC search failed
    if (!mbid && metadata.trackName && metadata.mainArtist) {
      try {
        const encodedTitle = encodeURIComponent(metadata.trackName);
        const encodedArtist = encodeURIComponent(metadata.mainArtist);

        const mbSearchResponse = await axios.get<MusicBrainzResponse>(
          `https://musicbrainz.org/ws/2/recording?query=title:"${encodedTitle}" AND artist:"${encodedArtist}"&fmt=json`,
          {
            headers: {
              "User-Agent": "JazzMetadataViewer/1.0.0 (Personal Use)",
            },
          }
        );

        const mbSearchData = mbSearchResponse.data;

        if (mbSearchData.recordings && mbSearchData.recordings.length > 0) {
          mbid = mbSearchData.recordings[0].id;
        }
      } catch (mbError) {
        console.error(
          "MusicBrainz title/artist search error:",
          mbError instanceof AxiosError ? mbError.message : mbError
        );
      }
    }

    // If we have an MBID (from either search method), get detailed info
    if (mbid) {
      try {
        // Step 2: Get detailed recording info using MBID
        const mbDetailResponse = await axios.get<MusicBrainzDetailedRecording>(
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
          // Use Maps to consolidate artists with multiple instruments
          const featuredArtistsMap = new Map<string, Set<string>>();
          const composers: string[] = [];
          const producers: string[] = [];

          for (const relation of recording.relations) {
            const artistName = relation.artist?.name;

            // Skip if no artist name
            if (!artistName) {
              continue;
            }
            
            // Check if it's the main artist to get their instrument
            if (artistName.toLowerCase() === metadata.mainArtist.toLowerCase()) {
              if (relation.type === "instrument" || relation.type === "vocal") {
                 const instrument = relation.attributes?.[0] || relation.type;
                 // Set or append main artist instrument
                 if (metadata.mainArtistInstrument) {
                   if (!metadata.mainArtistInstrument.includes(instrument)) {
                     metadata.mainArtistInstrument += `, ${instrument}`;
                   }
                 } else {
                   metadata.mainArtistInstrument = instrument;
                 }
              }
              continue; // Don't add main artist to featured list
            }

            if (relation.type === "instrument" || relation.type === "vocal") {
              const instrument = relation.attributes?.[0] || relation.type;

              // Get or create the set of instruments for this artist
              if (!featuredArtistsMap.has(artistName)) {
                featuredArtistsMap.set(artistName, new Set());
              }
              featuredArtistsMap.get(artistName)!.add(instrument);
            } else if (relation.type === "producer") {
              if (!producers.includes(artistName)) {
                producers.push(artistName);
              }
            } else if (
              relation.type === "composer" ||
              relation.type === "writer"
            ) {
              if (!composers.includes(artistName)) {
                composers.push(artistName);
              }
            }
          }

          // Convert Map to FeaturedArtist array with consolidated instruments
          // Merge with existing Featured Artists (from Spotify) to keep URLs if names match
          const mbFeaturedArtists = Array.from(
            featuredArtistsMap.entries()
          ).map(([name, instruments]) => {
             // Helper to normalize names for comparison
             const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
             const nName = normalize(name);

             // Search in ALL Spotify artists (including main) to find a match
             const spotifyArtists = track ? track.artists : (album ? album.artists : []);
             
             const match = spotifyArtists.find(sa => {
                const nSaName = normalize(sa.name);
                return nName === nSaName || nName.includes(nSaName) || nSaName.includes(nName);
             });

             return {
              name,
              instrument: Array.from(instruments).join(", "),
              spotifyUrl: match?.external_urls?.spotify
             };
          });

          // Fallback: For artists without a Spotify URL from the track metadata, 
          // perform a search against Spotify API
          const missingUrlArtists = mbFeaturedArtists.filter(a => !a.spotifyUrl);
          
          if (missingUrlArtists.length > 0) {
            console.log(`Searching Spotify for ${missingUrlArtists.length} missing artists...`);
            await Promise.allSettled(missingUrlArtists.map(async (artist) => {
              try {
                const searchRes = await axios.get(
                  `https://api.spotify.com/v1/search?q=${encodeURIComponent(artist.name)}&type=artist&limit=1`,
                  {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                    },
                  }
                );
                
                const items = searchRes.data?.artists?.items;
                if (items && items.length > 0) {
                  // Use the URL from the first search result
                  artist.spotifyUrl = items[0].external_urls?.spotify;
                }
              } catch (err) {
                console.error(`Failed to search Spotify for ${artist.name}`, err);
              }
            }));
          }
          
          if (mbFeaturedArtists.length > 0) {
            metadata.featuredArtists = mbFeaturedArtists;
          }
          
          metadata.producers = producers;
          metadata.composers = composers;
        }
      } catch (mbError) {
        console.error(
          "MusicBrainz detail fetch error:",
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
