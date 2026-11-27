exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { id } = JSON.parse(event.body || "{}");
    if (!id) return { statusCode: 400, body: "ID missing" };

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const dbRes = await fetch(`${supabaseUrl}/rest/v1/requests?id=eq.${id}&select=*`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    const rows = await dbRes.json();
    const req = rows && rows[0];
    if (!req) return { statusCode: 404, body: "Request not found" };

    const text = [
      "📩 *MICEDAY — Yangi buyurtma!*",
      "",
      `👤 *Mijoz:* ${req.name}`,
      req.company ? `🏢 *Tashkilot:* ${req.company}` : null,
      `📞 *Aloqa:* ${req.contact}`,
      `🎯 *Tadbir:* ${req.type}`,
      `📅 *Sana:* ${req.event_date}`,
      `👥 *Ishtirokchilar:* ${req.guests} kishi`,
      req.budget ? `💰 *Byudjet:* $${req.budget}` : null,
      req.venue ? `📍 *Joy:* ${req.venue}` : null,
      req.details ? `📝 *Izoh:* ${req.details}` : null,
    ].filter(Boolean).join("\n");

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      }),
    });

    if (!tgRes.ok) throw new Error("Telegram API error");

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};