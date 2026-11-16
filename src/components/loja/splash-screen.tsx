import Image from "next/image";

/**
 * Tela de carregamento (D-036): aparece ao entrar ou atualizar a página, com o
 * logo no centro e os arcos nas cores da marca girando em volta.
 * Vem pronta no HTML e some por um script mínimo, sem esperar o React. Se o
 * JavaScript falhar, o CSS a esconde sozinho depois de alguns segundos.
 * O mesmo script leva a página ao topo quando a pessoa atualiza (F5): o
 * navegador decide se restaura a rolagem pelo valor deixado ao sair da página,
 * por isso ele é marcado como "manual" na saída e volta a "auto" durante o uso.
 */
const BOOT = `(function(){try{history.scrollRestoration="manual";scrollTo(0,0)}catch(e){}
var s=document.getElementById("splash"),t=Date.now();
function done(){setTimeout(function(){if(s)s.classList.add("splash-done");try{scrollTo(0,0);history.scrollRestoration="auto"}catch(e){}},Math.max(0,1200-(Date.now()-t)))}
addEventListener("pagehide",function(){try{history.scrollRestoration="manual"}catch(e){}});
if(document.readyState==="complete")done();else addEventListener("load",done)})();`;

const ARCS = [
  { r: 92, color: "#8fd14f", dash: "150 428", dur: "2.6s", dir: "normal" },
  { r: 78, color: "#fed216", dash: "110 380", dur: "3.4s", dir: "reverse" },
  { r: 64, color: "#f9630e", dash: "70 332", dur: "2.1s", dir: "normal" },
] as const;

export function SplashScreen() {
  return (
    <div
      id="splash"
      role="status"
      aria-label="Carregando a Emkasa Gourmet"
      suppressHydrationWarning
      className="splash"
    >
      <div className="splash-card">
        <div className="splash-ring">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r="92" className="splash-track" />
            {ARCS.map((a) => (
              <circle
                key={a.r}
                cx="100"
                cy="100"
                r={a.r}
                className="splash-arc"
                stroke={a.color}
                strokeDasharray={a.dash}
                style={{
                  animationDuration: a.dur,
                  animationDirection: a.dir,
                  filter: `drop-shadow(0 0 6px ${a.color})`,
                }}
              />
            ))}
          </svg>
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={96}
            height={96}
            priority
            className="splash-logo"
          />
        </div>
        <p className="splash-name">
          emKasa <span>Gourmet</span>
        </p>
        <p className="splash-tag">Alimentar é uma forma de cuidar</p>
        <div className="splash-bar" aria-hidden="true">
          <i />
        </div>
        <p className="splash-wait">Carregando</p>
      </div>
      <script dangerouslySetInnerHTML={{ __html: BOOT }} />
    </div>
  );
}
