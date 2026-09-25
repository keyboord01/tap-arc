"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";
import s from "./reel.module.css";

const captions = [
  "You fill a vault with USDC.",
  "You open a tap for each spender.",
  "They spend, and it settles in under a second.",
  "Past the limit, the tap closes.",
  "Next period, it opens again.",
];

const chapters = ["1  Fill", "2  Open", "3  Spend", "4  Limit", "5  Reset"];

const capClass = [s.cap0, s.cap1, s.cap2, s.cap3, s.cap4];
const chapClass = [s.chap0, s.chap1, s.chap2, s.chap3, s.chap4];

const AGENT_PIPE = "M260 410 C 340 410, 360 510, 440 510";

/** The hero's 15-second motion reel: vault, three taps, a spend, the limit, and the reset. */
export function Reel() {
  // SVG ids must be unique per page; useId keeps them from colliding.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const dotsId = `${uid}-dots`;
  const clipId = `${uid}-vaultClip`;

  return (
    <div className={cn(s.reelwrap, "flex w-[740px] flex-col gap-[18px]")}>
      <div className="box-content h-[620px] w-[740px] overflow-hidden rounded-[28px] border border-track bg-panel">
        <svg
          className={s.reel}
          width="740"
          height="620"
          viewBox="-10 0 740 620"
          role="img"
          aria-label="Animation: a vault fills with USDC, three allowances open to Lena, Deniz and a research agent, the agent spends 5 USDC which settles in under a second, a second attempt is blocked at the limit, and the allowance resets for the next period."
        >
          <defs>
            <pattern id={dotsId} width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="#1A4441" />
            </pattern>
            <clipPath id={clipId}>
              <rect x="70" y="170" width="190" height="300" rx="32" />
            </clipPath>
          </defs>
          <rect x="-10" y="0" width="740" height="620" fill={`url(#${dotsId})`} />

          <g className={s.stage}>
            {/* vault */}
            <rect x="135" y="148" width="60" height="26" rx="8" fill="#2C5652" />
            <rect x="70" y="170" width="190" height="300" rx="32" fill="#0B2A2A" stroke="#2C5652" strokeWidth="2" />
            <g clipPath={`url(#${clipId})`}>
              <rect className={s.liquid} x="70" y="170" width="190" height="300" fill="#1E9678" />
              <circle className={s.bub} cx="120" cy="455" r="5" fill="#7FDCC2" style={{ animationDelay: ".3s" }} />
              <circle className={s.bub} cx="175" cy="460" r="3.5" fill="#7FDCC2" style={{ animationDelay: ".7s" }} />
              <circle className={s.bub} cx="215" cy="458" r="4.5" fill="#7FDCC2" style={{ animationDelay: "1.1s" }} />
            </g>
            <g stroke="#F3F7F5" strokeOpacity=".28" strokeWidth="2" strokeLinecap="round">
              <line x1="84" y1="230" x2="98" y2="230" />
              <line x1="84" y1="290" x2="94" y2="290" />
              <line x1="84" y1="350" x2="98" y2="350" />
              <line x1="84" y1="410" x2="94" y2="410" />
            </g>
            <text x="165" y="508" textAnchor="middle" fontSize="15" fill="#A6C4BD">
              Your vault
            </text>
            <text className={s.bal1} x="165" y="548" textAnchor="middle" fontSize="30" fontWeight="700" fill="#F3F7F5">
              1,000 USDC
            </text>
            <text className={s.bal2} x="165" y="548" textAnchor="middle" fontSize="30" fontWeight="700" fill="#F3F7F5">
              995 USDC
            </text>

            {/* pipes */}
            <g fill="none" strokeLinecap="round">
              <path className={s.pipe} d="M260 230 C 350 230, 350 135, 440 135" pathLength="100" stroke="#2C5652" strokeWidth="10" />
              <path
                className={s.pipe}
                d="M260 320 C 320 320, 380 320, 440 320"
                pathLength="100"
                stroke="#2C5652"
                strokeWidth="10"
                style={{ animationDelay: ".25s" }}
              />
              <path className={s.pipe} d={AGENT_PIPE} pathLength="100" stroke="#2C5652" strokeWidth="10" style={{ animationDelay: ".5s" }} />
              <g className={s.fvis}>
                <path className={s.flow} d="M260 230 C 350 230, 350 135, 440 135" pathLength="100" stroke="#7FDCC2" strokeWidth="4" />
              </g>
              <g className={s.fvis}>
                <path className={s.flow} d="M260 320 C 320 320, 380 320, 440 320" pathLength="100" stroke="#7FDCC2" strokeWidth="4" />
              </g>
              <g className={s.fvis3}>
                <path className={s.flow} d={AGENT_PIPE} pathLength="100" stroke="#7FDCC2" strokeWidth="4" />
              </g>
            </g>

            {/* valve on the agent's tap */}
            <g>
              <circle className={s.spark} cx="350" cy="460" r="16" fill="none" stroke="#F2B632" strokeWidth="3" />
              <circle className={s.vring} cx="350" cy="460" r="16" fill="#0B2A2A" stroke="#7FDCC2" strokeWidth="2.5" />
              <rect className={s.vbar} x="340" y="458" width="20" height="4" rx="2" fill="#F3F7F5" />
            </g>
            <circle className={s.drop} cx="0" cy="0" r="7" fill="#F3F7F5" />
            <circle className={s.probe} cx="0" cy="0" r="6" fill="#7FDCC2" />

            {/* spenders */}
            <g className={s.chip}>
              <rect x="440" y="90" width="250" height="90" rx="18" fill="#123C3B" stroke="#2C5652" strokeWidth="1.5" />
              <text x="462" y="123" fontSize="19" fontWeight="600" fill="#F3F7F5">
                Lena
              </text>
              <text x="462" y="145" fontSize="14" fill="#A6C4BD">
                20 USDC every 7 days
              </text>
              <rect x="462" y="158" width="206" height="6" rx="3" fill="#1D4744" />
              <rect className={cn(s.meter, s.m1)} x="462" y="158" width="206" height="6" rx="3" fill="#7FDCC2" />
            </g>
            <g className={s.chip} style={{ animationDelay: ".25s" }}>
              <rect x="440" y="275" width="250" height="90" rx="18" fill="#123C3B" stroke="#2C5652" strokeWidth="1.5" />
              <text x="462" y="308" fontSize="19" fontWeight="600" fill="#F3F7F5">
                Deniz, freelancer
              </text>
              <text x="462" y="330" fontSize="14" fill="#A6C4BD">
                300 USDC every 30 days
              </text>
              <rect x="462" y="343" width="206" height="6" rx="3" fill="#1D4744" />
              <rect className={cn(s.meter, s.m2)} x="462" y="343" width="206" height="6" rx="3" fill="#7FDCC2" />
            </g>
            <g className={s.chip} style={{ animationDelay: ".5s" }}>
              <rect className={s.ring} x="440" y="465" width="250" height="90" rx="18" fill="none" stroke="#7FDCC2" strokeWidth="2" />
              <rect x="440" y="465" width="250" height="90" rx="18" fill="#123C3B" stroke="#2C5652" strokeWidth="1.5" />
              <text x="462" y="498" fontSize="19" fontWeight="600" fill="#F3F7F5">
                Research agent
              </text>
              <text x="462" y="520" fontSize="14" fill="#A6C4BD">
                5 USDC every day
              </text>
              <rect x="462" y="533" width="206" height="6" rx="3" fill="#1D4744" />
              <rect className={cn(s.meter, s.m3)} x="462" y="533" width="206" height="6" rx="3" fill="#7FDCC2" />
              <circle className={s.clockface} cx="662" cy="492" r="10" fill="none" stroke="#5E847C" strokeWidth="2" />
              <line className={s.hand} x1="662" y1="492" x2="662" y2="485" stroke="#F3F7F5" strokeWidth="2" strokeLinecap="round" />
            </g>
            <g className={s.badge}>
              <rect x="578" y="451" width="112" height="27" rx="13.5" fill="#F2B632" />
              <text x="634" y="469" textAnchor="middle" fontSize="13" fontWeight="700" fill="#2B1D00">
                Limit reached
              </text>
            </g>
            <text className={s.resetcap} x="565" y="592" textAnchor="middle" fontSize="14" fill="#A6C4BD">
              New period, fresh 5 USDC
            </text>

            {/* settlement toast */}
            <g className={s.toast}>
              <rect x="170" y="16" width="380" height="68" rx="16" fill="#F3F7F5" />
              <circle cx="206" cy="50" r="15" fill="#177A63" />
              <path
                className={s.tick}
                d="M199 50 L204 55 L213 45"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text x="234" y="45" fontSize="16" fontWeight="700" fill="#0B2A2A">
                Research agent paid 5 USDC
              </text>
              <text x="234" y="66" fontSize="13" fill="#35524D">
                Finalized in under a second
              </text>
              <rect className={s.tbar} x="186" y="76" width="348" height="3" rx="1.5" fill="#7FDCC2" />
            </g>
          </g>
        </svg>
      </div>

      <div className="relative h-[56px] overflow-hidden" aria-hidden="true">
        {captions.map((text, i) => (
          <div
            key={text}
            className={cn(
              s.cap,
              capClass[i],
              "font-display text-[38px] font-semibold tracking-[-0.02em] whitespace-nowrap text-paper tabular-nums",
            )}
          >
            {text}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5" aria-hidden="true">
        <div className="relative h-[3px] overflow-hidden rounded-[2px] bg-track">
          <div className={cn(s.prog, "absolute top-0 left-0 h-[3px] w-full bg-mint")} />
        </div>
        <div className="grid grid-cols-5 gap-2 text-[14px] font-semibold">
          {chapters.map((label, i) => (
            <span key={label} className={cn(s.chap, chapClass[i])}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
