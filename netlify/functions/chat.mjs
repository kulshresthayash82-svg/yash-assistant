export default async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "POST requests only" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const { message } = await req.json();

    if (typeof message !== "string" || !message.trim()) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const apiKey = Netlify.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI key is not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          instructions: "You are Y.A.S.H., a helpful, friendly AI assistant. Reply clearly and concisely.",
          input: message.trim().slice(0, 4000),
          max_output_tokens: 500
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "AI service request failed" }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const answer = data.output
      ?.flatMap(item => item.content || [])
      .find(item => item.type === "output_text")
      ?.text;

    return new Response(
      JSON.stringify({
        reply: answer || "Sorry, I could not generate a reply."
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request or server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
