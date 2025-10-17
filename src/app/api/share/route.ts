import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const url = formData.get("url") as string;
    const text = formData.get("text") as string;

    // Extract Spotify URL from either url or text field
    let spotifyUrl = "";

    if (url && url.includes("spotify.com")) {
      spotifyUrl = url;
    } else if (text && text.includes("spotify.com")) {
      // Extract URL from text (in case the share includes text with URL)
      const urlMatch = text.match(
        /(https?:\/\/open\.spotify\.com\/(?:track|album)\/[a-zA-Z0-9]+)/
      );
      if (urlMatch) {
        spotifyUrl = urlMatch[1];
      }
    }

    // Redirect to home page with the URL as a query parameter
    if (spotifyUrl) {
      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("url", spotifyUrl);
      return NextResponse.redirect(redirectUrl, 303);
    }

    // If no valid URL found, redirect to home
    return NextResponse.redirect(new URL("/", request.url), 303);
  } catch (error) {
    console.error("Error processing share:", error);
    return NextResponse.redirect(new URL("/", request.url), 303);
  }
}
