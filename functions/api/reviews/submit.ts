// Anti-abuse & moderation validator for reviews
const BLOCKED_PATTERNS = [
  /https?:\/\/[^\s]+/i, // URLs
  /www\.[^\s]+/i,
  /\b03\d{2}[-.\s]?\d{7}\b/, // Pakistani mobile phone numbers
  /\+92[-.\s]?\d{3}[-.\s]?\d{7}/,
  /\b(scam|fraud|hack|cheat|telegram|whatsapp|wa\.me)\b/i,
];

export async function onRequestPost(context: any) {
  try {
    const { request } = context;
    const body: any = await request.json().catch(() => ({}));

    const {
      uid,
      rating,
      text,
      title = "",
      exam = "Entry test aspirant",
      city = "",
      nameDisplayChoice = "first_initial",
      authorName = "Student",
    } = body;

    if (!uid) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return new Response(
        JSON.stringify({ error: "Rating must be between 1 and 5 stars" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const trimmedText = String(text || "").trim();
    if (trimmedText.length < 20 || trimmedText.length > 500) {
      return new Response(
        JSON.stringify({
          error: "Review text must be between 20 and 500 characters",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check anti-spam & link blocking
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(trimmedText) || pattern.test(String(title))) {
        return new Response(
          JSON.stringify({
            error:
              "Reviews cannot contain links, phone numbers, or promotional text.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Derive formatted display name
    let formattedName = "Student";
    if (nameDisplayChoice === "first_only") {
      formattedName = authorName.trim().split(" ")[0] || "Student";
    } else if (nameDisplayChoice === "first_initial") {
      const parts = authorName.trim().split(" ");
      formattedName =
        parts.length > 1
          ? `${parts[0]} ${parts[1][0]}.`
          : parts[0] || "Student";
    } else {
      formattedName = "Anonymous Student";
    }

    return new Response(
      JSON.stringify({
        success: true,
        sanitized: {
          uid,
          rating: numRating,
          title: String(title).slice(0, 60),
          text: trimmedText,
          exam: String(exam).slice(0, 50),
          city: String(city).slice(0, 50),
          name: formattedName,
          nameDisplayChoice,
          status: "pending",
          isVerifiedStudent: true,
          createdAt: new Date().toISOString(),
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
