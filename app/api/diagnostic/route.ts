
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = "https://wp.dev-hillhere.de/wp-json/";

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      destination: "WordPress REST API",
      message: response.ok
        ? "Render can connect to Hetzner"
        : "Hetzner returned an HTTP error",
    });
  } catch (error) {
    const err = error as Error & { cause?: { code?: string } };

    return NextResponse.json({
      success: false,
      error: err.message,
      code: err.cause?.code ?? "UNKNOWN",
    }, { status: 502 });
  }
}
