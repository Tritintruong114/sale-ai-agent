import type { NextRequest } from "next/server";
import { buildShopContext, buildBusinessContext } from "@/lib/shopContext";
import { AGENT_FILES } from "@/data/agentFiles";
import type { BusinessProfile } from "@/data/config";

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
    shopType?: ("online" | "store")[];
    shopAddress?: string;
    shopPhone?: string;
    bannedWords?: string[];
    // Hồ sơ nghiệp vụ (giờ, giao hàng, chính sách, FAQ…) để agent tư vấn khách chính xác.
    businessProfile?: BusinessProfile;
    // "manager" = copilot hỗ trợ chủ shop; "assistant" = tư vấn viên chat với khách (đọc hồ sơ định nghĩa).
    persona?: "manager" | "assistant";
  };
};

// Gom phần nhận diện shop từ request để truyền vào buildBusinessContext.
function shopBasics(agent: RequestBody["agent"]) {
  return {
    shopName: agent?.shopName,
    shopType: agent?.shopType,
    shopAddress: agent?.shopAddress,
    shopPhone: agent?.shopPhone,
  };
}

// Câu chỉ dẫn cho agent ưu tiên trả lời các câu hỏi nghiệp vụ theo hồ sơ shop.
const BUSINESS_RULE = `Khi khách hỏi về giờ mở cửa, phí/khu vực/thời gian giao hàng, cách thanh toán, đổi trả, bảo hành hay khuyến mãi → trả lời theo THÔNG TIN NGHIỆP VỤ CỬA HÀNG bên dưới. Nếu thông tin chưa có trong đó thì nói rõ là chưa có và xin phép chuyển cho chủ shop, KHÔNG bịa.`;

const MODEL = "gpt-5.4-mini";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Hồ sơ định nghĩa agent (SOUL/GOALS/IDENTITY/VIBE-TONE/SKILLS/TOOLS/FLOW/RULES/CORPUS)
// gộp thành một khối text để nạp vào system prompt cho persona tư vấn viên.
function buildAgentDefinition(): string {
  return AGENT_FILES.map((f) => `### ${f.title} (${f.file})\n${f.content}`).join("\n\n");
}

const FORMAT_RULE = `Định dạng: KHÔNG dùng tiêu đề (#), không kẻ ngang (---), không bảng. Chỉ dùng **đậm** cho từ khoá quan trọng và gạch đầu dòng "- " khi liệt kê. Câu ngắn, xuống dòng hợp lý.`;

// Khi khách/chủ shop xin ảnh sản phẩm: agent gửi ảnh bằng cú pháp markdown ảnh, lấy ĐÚNG URL "ảnh:" trong dữ liệu.
const IMAGE_RULE = `Khi được hỏi/xin ảnh hoặc hình mẫu sản phẩm, GỬI ẢNH bằng cú pháp ![Tên](URL) với URL lấy đúng từ trường "ảnh:" của sản phẩm trong dữ liệu. Với MỖI sản phẩm, LUÔN viết tên và giá thành chữ hiển thị trước (vd: "**Sầu riêng Musanking** — 120.000đ"), RỒI xuống dòng mới đặt ảnh. TUYỆT ĐỐI không đặt ảnh ngay sau dấu "-" mà bỏ trống tên (tên nằm trong ![...] không hiển thị cho khách). Không bịa URL; sản phẩm không có "ảnh:" thì nói chưa có ảnh.`;

// Tách câu trả lời dài thành nhiều tin nhắn ngắn liên tiếp (gửi tự nhiên như nhắn tay).
const SPLIT_RULE = `Nếu nội dung dài hoặc gồm nhiều ý, hãy CHIA thành 2-3 tin nhắn ngắn liên tiếp, mỗi tin ngăn cách bằng một dòng chỉ chứa [NEXT]. Mỗi tin chỉ 1-3 dòng, đừng dồn tất cả vào một tin dài.`;

// Phong cách bán hàng tự nhiên cho tư vấn viên — không "xổ" cả catalog một lần.
const SALES_STYLE_RULE = `Nhắn như người bán thật, từ tốn. Khi khách hỏi chung chung ("có gì", "có trái cây gì", "cho xem mẫu"), TUYỆT ĐỐI không liệt kê hết danh mục: chỉ gợi ý 2-3 món/mẫu tiêu biểu rồi HỎI nhu cầu (dịp dùng, ngân sách, khẩu vị) để tư vấn tiếp. Chỉ gửi ảnh khi khách quan tâm món cụ thể hoặc xin ảnh; mỗi lần 1-2 ảnh thôi, không gửi hàng loạt.`;

// Persona Manager Agent — copilot hỗ trợ chủ shop vận hành.
function buildManagerPrompt(agent: RequestBody["agent"]): string {
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
    FORMAT_RULE,
    IMAGE_RULE,
    SPLIT_RULE,
    banned.length ? `Tuyệt đối không dùng các từ/cụm sau: ${banned.join(", ")}.` : "",
    ``,
    // Dữ liệu thật của shop — chỉ trả lời dựa trên đây, không bịa sản phẩm/số liệu.
    `Khi anh/chị hỏi về sản phẩm, đơn hàng, doanh thu hay việc cần làm, CHỈ dựa vào dữ liệu dưới đây. Nếu không có trong dữ liệu thì nói rõ là chưa có thông tin, tuyệt đối không bịa.`,
    BUSINESS_RULE,
    ``,
    buildShopContext(),
    buildBusinessContext(agent?.businessProfile, shopBasics(agent)),
  ]
    .filter(Boolean)
    .join("\n");
}

// Persona tư vấn viên — agent của shop đang chat trực tiếp với KHÁCH HÀNG, hành xử theo hồ sơ định nghĩa.
function buildAssistantPrompt(agent: RequestBody["agent"]): string {
  const name = agent?.name || "Trợ lý cửa hàng";
  const pronoun = agent?.pronoun || "em";
  const tone = agent?.tone || "thân thiện, chuyên nghiệp";
  const shopName = agent?.shopName || "cửa hàng";
  const banned = (agent?.bannedWords ?? []).filter(Boolean);

  return [
    `Bạn là "${name}", tư vấn viên bán hàng của cửa hàng "${shopName}". Bạn đang trực tiếp nhắn tin với KHÁCH HÀNG trên fanpage — KHÔNG phải nói chuyện với chủ shop.`,
    `Xưng "${pronoun}" và gọi khách là "anh/chị". Giọng điệu: ${tone}.`,
    `Hành xử ĐÚNG theo hồ sơ định nghĩa bên dưới (tính cách, mục tiêu, kỹ năng, luồng tư vấn, nguyên tắc). Hiểu nhu cầu của khách trước khi gợi ý, tư vấn tận tâm, dẫn dắt tới chốt đơn khi khách đã sẵn sàng.`,
    `Trả lời ngắn gọn như tin nhắn chat, tiếng Việt.`,
    SALES_STYLE_RULE,
    FORMAT_RULE,
    IMAGE_RULE,
    SPLIT_RULE,
    banned.length ? `Tuyệt đối không dùng các từ/cụm sau: ${banned.join(", ")}.` : "",
    `Khi gặp tình huống vượt nguyên tắc (giảm giá quá mức, khách phàn nàn, hỏi ngoài phạm vi) → lịch sự xin phép chuyển cho chủ shop, KHÔNG tự quyết.`,
    BUSINESS_RULE,
    ``,
    `## HỒ SƠ ĐỊNH NGHĨA AGENT (tuân thủ nghiêm ngặt)`,
    buildAgentDefinition(),
    ``,
    `## DỮ LIỆU SẢN PHẨM & SHOP (chỉ tư vấn dựa trên đây, không bịa giá/sản phẩm)`,
    buildShopContext(),
    buildBusinessContext(agent?.businessProfile, shopBasics(agent)),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSystemPrompt(agent: RequestBody["agent"]): string {
  return agent?.persona === "assistant" ? buildAssistantPrompt(agent) : buildManagerPrompt(agent);
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
