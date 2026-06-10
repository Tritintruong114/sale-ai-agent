import type { NextRequest } from "next/server";
import { buildShopContext } from "@/lib/shopContext";

// Route Handler — proxy gọi OpenAI từ server để API key không lộ ra client.
// Env: OPEN_API_KEY (đặt trong .env). Xem node_modules/next/dist/docs/.../15-route-handlers.md.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Role = "system" | "user" | "assistant";
type ChatTurn = { role: Role; content: string };

type RequestBody = {
  messages: ChatTurn[];
  // Ngữ cảnh danh tính agent để dựng system prompt — gửi từ client (mock store).
  agent?: {
    name?: string;
    pronoun?: string;
    tone?: string;
    shopName?: string;
    bannedWords?: string[];
  };
};

const MODEL = "gpt-5.4-mini";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

function buildSystemPrompt(agent: RequestBody["agent"]): string {
  const name = agent?.name || "Trợ lý cửa hàng";
  const pronoun = agent?.pronoun || "em";
  const tone = agent?.tone || "thân thiện, chuyên nghiệp";
  const shopName = agent?.shopName || "cửa hàng";
  const banned = (agent?.bannedWords ?? []).filter(Boolean);

  return [
    `Bạn là "${name}", một trợ lý AI (copilot) hỗ trợ chủ cửa hàng "${shopName}" vận hành việc bán hàng trên fanpage.`,
    `Xưng "${pronoun}" và gọi người dùng là "anh/chị". Giọng điệu: ${tone}.`,
    `Bạn giúp chủ shop: tổng hợp tình hình kinh doanh, soạn tin nhắn chốt đơn, gợi ý xử lý hội thoại, nhắc các việc cần duyệt.`,
    `Trả lời ngắn gọn, đi thẳng vào việc, bằng tiếng Việt, văn phong như tin nhắn chat.`,
    `Định dạng: KHÔNG dùng tiêu đề (#), không kẻ ngang (---), không bảng. Chỉ dùng **đậm** cho từ khoá quan trọng và gạch đầu dòng "- " khi liệt kê. Câu ngắn, xuống dòng hợp lý.`,
    banned.length ? `Tuyệt đối không dùng các từ/cụm sau: ${banned.join(", ")}.` : "",
    ``,
    // Dữ liệu thật của shop — chỉ trả lời dựa trên đây, không bịa sản phẩm/số liệu.
    `Khi anh/chị hỏi về sản phẩm, đơn hàng, doanh thu hay việc cần làm, CHỈ dựa vào dữ liệu dưới đây. Nếu không có trong dữ liệu thì nói rõ là chưa có thông tin, tuyệt đối không bịa.`,
    ``,
    buildShopContext(),
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPEN_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Chưa cấu hình OPEN_API_KEY trong .env" },
      { status: 500 },
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return Response.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "Thiếu messages" }, { status: 400 });
  }

  const messages: ChatTurn[] = [
    { role: "system", content: buildSystemPrompt(body.agent) },
    ...body.messages,
  ];

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.7 }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return Response.json(
        { error: "OpenAI trả lỗi", status: res.status, detail },
        { status: 502 },
      );
    }

    const data = await res.json();
    const reply: string = data?.choices?.[0]?.message?.content?.trim() ?? "";
    return Response.json({ reply });
  } catch (err) {
    return Response.json(
      { error: "Không gọi được OpenAI", detail: String(err) },
      { status: 502 },
    );
  }
}
