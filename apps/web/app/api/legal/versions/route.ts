import messages from "@nowly/locales/messages/web/en-US.json";

export const GET = () =>
  Response.json(
    {
      tos: messages["tos-page"]["last-updated"],
      privacy: messages["privacy-page"]["last-updated"]
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, must-revalidate",
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff"
      }
    }
  );