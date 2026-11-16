import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * Imagem que aparece quando o link do site é compartilhado (WhatsApp,
 * Instagram, Google). Gerada no build com o logo e a frase da marca (D-039).
 */
export const alt = "Emkasa Gourmet: alimentar é uma forma de cuidar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public/icons/icon-512.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 52,
        padding: "0 72px",
        color: "#faf6ee",
        background:
          "radial-gradient(900px 600px at 78% 40%, #2c4a37 0%, #16271b 55%, #0e1912 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          width: 300,
          height: 300,
          borderRadius: 300,
          border: "6px solid #fed216",
          boxShadow: "0 0 80px rgba(254,210,22,.35)",
        }}
      >
        <img
          src={src}
          alt=""
          width={288}
          height={288}
          style={{ borderRadius: 288 }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 6,
            color: "#fed216",
            textTransform: "uppercase",
          }}
        >
          Horta · Cozinha · Casa
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          emKasa Gourmet
        </div>
        <div style={{ display: "flex", fontSize: 38, color: "#cfe3a6" }}>
          Alimentar é uma forma de cuidar.
        </div>
      </div>
    </div>,
    size,
  );
}
