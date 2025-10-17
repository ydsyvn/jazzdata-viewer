import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const res = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });
  const data = await res.json();

  return Response.json(data);
}
