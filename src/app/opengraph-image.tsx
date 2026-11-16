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
  // Tudo no centro: o WhatsApp às vezes mostra só um quadrado do meio da
  // imagem, então logo e nome precisam caber nesse quadrado (630 x 630).
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        color: "#faf6ee",
        background:
          "radial-gradient(700px 520px at 50% 42%, #2c4a37 0%, #16271b 55%, #0e1912 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          width: 268,
          height: 268,
          borderRadius: 268,
          border: "4px solid #fed216",
          boxShadow: "0 0 70px rgba(254,210,22,.4)",
          marginBottom: 14,
        }}
      >
        <img
          src={src}
          alt=""
          width={260}
          height={260}
          style={{ borderRadius: 260 }}
        />
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 22,
          letterSpacing: 5,
          color: "#fed216",
          textTransform: "uppercase",
        }}
      >
        Horta · Cozinha · Casa
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 68,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        emKasa Gourmet
      </div>
      <div style={{ display: "flex", fontSize: 31, color: "#cfe3a6" }}>
        Alimentar é uma forma de cuidar.
      </div>
    </div>,
    size,
  );
}
