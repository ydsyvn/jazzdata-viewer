import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  console.log("SPOTIFY_CLIENT_ID:", process.env.SPOTIFY_CLIENT_ID);
  console.log("SPOTIFY_CLIENT_SECRET:", !!process.env.SPOTIFY_CLIENT_SECRET);

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Spotify credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error("Failed to get Spotify token");
    }

    const data = await response.json();
    return NextResponse.json({ access_token: data.access_token });
  } catch (error) {
    console.error("Error getting Spotify token:", error);
    return NextResponse.json(
      { error: "Failed to authenticate with Spotify" },
      { status: 500 }
    );
  }
}
