/**
 * Programmatic SVG watchfaces. Every face renders live data (time, steps,
 * kcal, bpm) so gallery previews are alive. No bitmaps — SVG only.
 */

import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Polygon,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

export interface FaceData {
  time: Date;
  steps: number;
  kcal: number;
  bpm: number;
}

export interface FaceProps extends FaceData {
  size: number;
}

export type FaceCategory =
  | 'Illustration'
  | 'Chronograph'
  | 'Minimal Analog'
  | 'Abstract'
  | 'Geometry'
  | 'Space'
  | 'Sports'
  | 'Tech'
  | 'Nature'
  | 'Minimal Digital'
  | 'Zodiac'
  | 'Planets & Space'
  | 'Stripes & Dots'
  | 'Olympic';

export interface FaceDef {
  id: string;
  name: string;
  category: FaceCategory;
  rating: number;
  Component: (props: FaceProps) => React.JSX.Element;
}

function two(n: number): string {
  return String(n).padStart(2, '0');
}

function hm(time: Date): { h: string; m: string } {
  return { h: two(time.getHours()), m: two(time.getMinutes()) };
}

function handAngles(time: Date) {
  const m = time.getMinutes() + time.getSeconds() / 60;
  const h = (time.getHours() % 12) + m / 60;
  return { hour: h * 30, minute: m * 6, second: time.getSeconds() * 6 };
}

/* ---------- faces ---------- */

function TetrisFace({ size, time, steps }: FaceProps) {
  const { h, m } = hm(time);
  const blocks = [
    { x: 8, y: 8, w: 22, h: 22, c: '#FF4D4D' },
    { x: 32, y: 8, w: 22, h: 22, c: '#5EA0EF' },
    { x: 8, y: 32, w: 22, h: 22, c: '#F5C518' },
    { x: 70, y: 70, w: 22, h: 22, c: '#8B5CF6' },
    { x: 70, y: 46, w: 22, h: 22, c: '#FF3B7A' },
  ];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#0D0D10" rx="12" />
      {blocks.map((b, i) => (
        <Rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.c} opacity={0.85} rx="3" />
      ))}
      <SvgText x="50" y="52" fontSize="26" fill="#B6FF3C" fontWeight="bold" textAnchor="middle">
        {h}:{m}
      </SvgText>
      <SvgText x="50" y="68" fontSize="9" fill="#B6FF3C" textAnchor="middle" opacity={0.8}>
        {steps.toLocaleString()} steps
      </SvgText>
    </Svg>
  );
}

function ButterflyFace({ size, time, bpm }: FaceProps) {
  const { h, m } = hm(time);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#0A0A14" rx="12" />
      <G opacity={0.9}>
        <Ellipse cx="38" cy="42" rx="16" ry="22" fill="#8B5CF6" opacity={0.5} transform="rotate(-25 38 42)" />
        <Ellipse cx="62" cy="42" rx="16" ry="22" fill="#FF3B7A" opacity={0.5} transform="rotate(25 62 42)" />
        <Ellipse cx="40" cy="60" rx="11" ry="15" fill="#5EA0EF" opacity={0.5} transform="rotate(-40 40 60)" />
        <Ellipse cx="60" cy="60" rx="11" ry="15" fill="#34D26A" opacity={0.5} transform="rotate(40 60 60)" />
        <Line x1="50" y1="30" x2="50" y2="70" stroke="#F5F5F7" strokeWidth="2" />
      </G>
      <SvgText x="50" y="88" fontSize="16" fill="#F5F5F7" fontWeight="bold" textAnchor="middle">
        {h}:{m}
      </SvgText>
      <SvgText x="50" y="22" fontSize="8" fill="#FF3B7A" textAnchor="middle">
        ♥ {bpm} bpm
      </SvgText>
    </Svg>
  );
}

function WalkerFace({ size, time, steps }: FaceProps) {
  const { h, m } = hm(time);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#0F0F12" rx="12" />
      <G stroke="#34D26A" strokeWidth="2.4" strokeLinecap="round" fill="none">
        <Circle cx="46" cy="34" r="6" />
        <Path d="M46 40 L46 56 M46 44 L36 52 M46 44 L56 50 M46 56 L38 72 M46 56 L56 70" />
      </G>
      <Line x1="20" y1="76" x2="80" y2="76" stroke="#23232A" strokeWidth="2" />
      <SvgText x="50" y="92" fontSize="13" fill="#F5F5F7" fontWeight="bold" textAnchor="middle">
        {h}:{m} · {steps.toLocaleString()}
      </SvgText>
    </Svg>
  );
}

function CatFace({ size, time }: FaceProps) {
  const { h, m } = hm(time);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#1A1320" rx="12" />
      <Polygon points="32,34 38,18 46,32" fill="#F7C8DC" />
      <Polygon points="68,34 62,18 54,32" fill="#F7C8DC" />
      <Circle cx="50" cy="46" r="22" fill="#F7C8DC" />
      <Circle cx="42" cy="42" r="2.5" fill="#1A1320" />
      <Circle cx="58" cy="42" r="2.5" fill="#1A1320" />
      <Path d="M44 52 Q50 57 56 52" stroke="#1A1320" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <Line x1="26" y1="46" x2="38" y2="47" stroke="#F7C8DC" strokeWidth="1" />
      <Line x1="74" y1="46" x2="62" y2="47" stroke="#F7C8DC" strokeWidth="1" />
      <SvgText x="50" y="86" fontSize="15" fill="#F7C8DC" fontWeight="bold" textAnchor="middle">
        {h}:{m}
      </SvgText>
    </Svg>
  );
}

function RetroFace({ size, time, kcal }: FaceProps) {
  const { h, m } = hm(time);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#1C0F0A" rx="12" />
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2].map((col) => (
          <Rect
            key={`${row}-${col}`}
            x={6 + col * 14 + (row % 2 ? 7 : 0)}
            y={6 + row * 9}
            width="12"
            height="7"
            fill="#B0413E"
            opacity={0.55}
            rx="1"
          />
        )),
      )}
      <Path d="M62 28 L82 28 L72 44 Z" fill="none" stroke="#F5C518" strokeWidth="2" />
      <Line x1="72" y1="44" x2="72" y2="54" stroke="#F5C518" strokeWidth="2" />
      <Circle cx="78" cy="26" r="2" fill="#34D26A" />
      <SvgText x="50" y="74" fontSize="20" fill="#F5E6C8" fontWeight="bold" textAnchor="middle">
        {h}:{m}
      </SvgText>
      <SvgText x="50" y="88" fontSize="8" fill="#F5C518" textAnchor="middle">
        {kcal} kcal tonight
      </SvgText>
    </Svg>
  );
}

function SpirographFace({ size, time }: FaceProps) {
  const { h, m } = hm(time);
  const petals = 12;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#0A0A0B" rx="12" />
      {Array.from({ length: petals }, (_, i) => (
        <Ellipse
          key={i}
          cx="50"
          cy="44"
          rx="26"
          ry="10"
          fill="none"
          stroke={i % 2 ? '#8B5CF6' : '#4DD0E1'}
          strokeWidth="0.8"
          opacity={0.7}
          transform={`rotate(${(180 / petals) * i} 50 44)`}
        />
      ))}
      <SvgText x="50" y="90" fontSize="15" fill="#F5F5F7" fontWeight="bold" textAnchor="middle">
        {h}:{m}
      </SvgText>
    </Svg>
  );
}

function MinimalAnalogFace({ size, time }: FaceProps) {
  const a = handAngles(time);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#0F0F12" rx="12" />
      <Circle cx="50" cy="50" r="40" fill="none" stroke="#23232A" strokeWidth="1.5" />
      {Array.from({ length: 12 }, (_, i) => (
        <Line
          key={i}
          x1="50"
          y1="13"
          x2="50"
          y2={i % 3 === 0 ? '19' : '16'}
          stroke="#6B6B73"
          strokeWidth={i % 3 === 0 ? 2 : 1}
          transform={`rotate(${i * 30} 50 50)`}
        />
      ))}
      <Line x1="50" y1="50" x2="50" y2="30" stroke="#F5F5F7" strokeWidth="3" strokeLinecap="round" transform={`rotate(${a.hour} 50 50)`} />
      <Line x1="50" y1="50" x2="50" y2="20" stroke="#F5F5F7" strokeWidth="2" strokeLinecap="round" transform={`rotate(${a.minute} 50 50)`} />
      <Line x1="50" y1="54" x2="50" y2="18" stroke="#FF4D4D" strokeWidth="1" strokeLinecap="round" transform={`rotate(${a.second} 50 50)`} />
      <Circle cx="50" cy="50" r="2.5" fill="#FF4D4D" />
    </Svg>
  );
}

function TerminalFace({ size, time, steps, kcal, bpm }: FaceProps) {
  const { h, m } = hm(time);
  const lines = [
    `> pulse --status`,
    `time   ${h}:${m}`,
    `steps  ${steps.toLocaleString()}`,
    `kcal   ${kcal}`,
    `bpm    ${bpm}`,
    `> _`,
  ];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#020A02" rx="12" />
      <Rect x="4" y="4" width="92" height="92" fill="none" stroke="#0E3A0E" strokeWidth="1" rx="8" />
      {lines.map((line, i) => (
        <SvgText key={i} x="10" y={20 + i * 13} fontSize="8" fill="#22D622" fontFamily="Courier">
          {line}
        </SvgText>
      ))}
    </Svg>
  );
}

function GalaxyFace({ size, time }: FaceProps) {
  const { h, m } = hm(time);
  const stars = Array.from({ length: 28 }, (_, i) => ({
    x: ((i * 37) % 92) + 4,
    y: ((i * 53) % 88) + 6,
    r: 0.6 + ((i * 7) % 10) / 10,
  }));
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#05050F" rx="12" />
      <Ellipse cx="50" cy="48" rx="30" ry="11" fill="none" stroke="#8B5CF6" strokeWidth="5" opacity={0.35} transform="rotate(-22 50 48)" />
      <Ellipse cx="50" cy="48" rx="20" ry="7" fill="none" stroke="#4DD0E1" strokeWidth="3" opacity={0.4} transform="rotate(-22 50 48)" />
      <Circle cx="50" cy="48" r="5" fill="#F5F5F7" opacity={0.9} />
      {stars.map((s, i) => (
        <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#F5F5F7" opacity={0.7} />
      ))}
      <SvgText x="50" y="90" fontSize="14" fill="#F5F5F7" fontWeight="bold" textAnchor="middle">
        {h}:{m}
      </SvgText>
    </Svg>
  );
}

function ChronoFace({ size, time, steps, bpm }: FaceProps) {
  const a = handAngles(time);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#101014" rx="12" />
      <Circle cx="50" cy="50" r="42" fill="none" stroke="#2A2A33" strokeWidth="3" />
      {Array.from({ length: 60 }, (_, i) => (
        <Line key={i} x1="50" y1="9" x2="50" y2={i % 5 === 0 ? '14' : '11.5'} stroke="#6B6B73" strokeWidth={i % 5 === 0 ? 1.4 : 0.6} transform={`rotate(${i * 6} 50 50)`} />
      ))}
      <Circle cx="35" cy="50" r="10" fill="none" stroke="#34D26A" strokeWidth="1" />
      <SvgText x="35" y="53" fontSize="6" fill="#34D26A" textAnchor="middle">
        {Math.round(steps / 1000)}k
      </SvgText>
      <Circle cx="65" cy="50" r="10" fill="none" stroke="#FF3B7A" strokeWidth="1" />
      <SvgText x="65" y="53" fontSize="6" fill="#FF3B7A" textAnchor="middle">
        {bpm}
      </SvgText>
      <Line x1="50" y1="50" x2="50" y2="28" stroke="#F5F5F7" strokeWidth="3" strokeLinecap="round" transform={`rotate(${a.hour} 50 50)`} />
      <Line x1="50" y1="50" x2="50" y2="16" stroke="#F5F5F7" strokeWidth="1.6" strokeLinecap="round" transform={`rotate(${a.minute} 50 50)`} />
      <Line x1="50" y1="56" x2="50" y2="14" stroke="#F5C518" strokeWidth="0.9" strokeLinecap="round" transform={`rotate(${a.second} 50 50)`} />
      <Circle cx="50" cy="50" r="2.4" fill="#F5C518" />
    </Svg>
  );
}

function NeonDigitalFace({ size, time, steps }: FaceProps) {
  const { h, m } = hm(time);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#0A0A0B" rx="12" />
      <SvgText x="50" y="48" fontSize="30" fill="#4DD0E1" fontWeight="bold" textAnchor="middle" opacity={0.95}>
        {h}:{m}
      </SvgText>
      <Rect x="22" y="58" width="56" height="3" rx="1.5" fill="#16161C" />
      <Rect x="22" y="58" width={Math.min(56, (steps / 10000) * 56)} height="3" rx="1.5" fill="#34D26A" />
      <SvgText x="50" y="74" fontSize="8" fill="#A1A1AA" textAnchor="middle">
        {steps.toLocaleString()} / 10,000
      </SvgText>
    </Svg>
  );
}

function GeometryFace({ size, time }: FaceProps) {
  const { h, m } = hm(time);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#0E0E13" rx="12" />
      <Polygon points="50,10 88,78 12,78" fill="none" stroke="#F5C518" strokeWidth="1.4" />
      <Polygon points="50,26 74,70 26,70" fill="none" stroke="#FF4D4D" strokeWidth="1.2" />
      <Circle cx="50" cy="58" r="13" fill="none" stroke="#5EA0EF" strokeWidth="1.2" />
      <SvgText x="50" y="62" fontSize="11" fill="#F5F5F7" fontWeight="bold" textAnchor="middle">
        {h}:{m}
      </SvgText>
    </Svg>
  );
}

function ZodiacFace({ size, time }: FaceProps) {
  const { h, m } = hm(time);
  const points = [
    [30, 64], [40, 46], [52, 56], [62, 38], [74, 46],
  ] as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#0A0814" rx="12" />
      {points.map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r="2.2" fill="#E8C46A" />
      ))}
      <Path
        d={`M${points.map((p) => p.join(',')).join(' L')}`}
        stroke="#E8C46A"
        strokeWidth="0.8"
        fill="none"
        opacity={0.8}
      />
      <Circle cx="50" cy="50" r="44" fill="none" stroke="#23232A" strokeWidth="1" />
      <SvgText x="50" y="86" fontSize="14" fill="#F5F5F7" fontWeight="bold" textAnchor="middle">
        {h}:{m}
      </SvgText>
    </Svg>
  );
}

function PlanetsFace({ size, time }: FaceProps) {
  const { h, m } = hm(time);
  const minuteAngle = (time.getMinutes() / 60) * 2 * Math.PI - Math.PI / 2;
  const hourAngle = ((time.getHours() % 12) / 12) * 2 * Math.PI - Math.PI / 2;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#06060C" rx="12" />
      <Circle cx="50" cy="46" r="7" fill="#F5C518" />
      <Circle cx="50" cy="46" r="18" fill="none" stroke="#23232A" strokeWidth="0.8" />
      <Circle cx="50" cy="46" r="30" fill="none" stroke="#23232A" strokeWidth="0.8" />
      <Circle cx={50 + 18 * Math.cos(hourAngle)} cy={46 + 18 * Math.sin(hourAngle)} r="3" fill="#5EA0EF" />
      <Circle cx={50 + 30 * Math.cos(minuteAngle)} cy={46 + 30 * Math.sin(minuteAngle)} r="2.2" fill="#FF4D4D" />
      <SvgText x="50" y="90" fontSize="12" fill="#F5F5F7" fontWeight="bold" textAnchor="middle">
        {h}:{m}
      </SvgText>
    </Svg>
  );
}

function StripesFace({ size, time }: FaceProps) {
  const { h, m } = hm(time);
  const stripeColors = ['#34D26A', '#F5C518', '#FF4D4D', '#8B5CF6', '#5EA0EF'];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#0F0F12" rx="12" />
      {stripeColors.map((c, i) => (
        <Rect key={c} x={10 + i * 17} y="14" width="9" height="44" rx="4.5" fill={c} opacity={0.85} />
      ))}
      {stripeColors.map((c, i) => (
        <Circle key={`${c}-dot`} cx={14.5 + i * 17} cy="68" r="2.4" fill={c} />
      ))}
      <SvgText x="50" y="90" fontSize="16" fill="#F5F5F7" fontWeight="bold" textAnchor="middle">
        {h}:{m}
      </SvgText>
    </Svg>
  );
}

function OlympicFace({ size, time, steps }: FaceProps) {
  const { h, m } = hm(time);
  const rings = [
    { cx: 30, cy: 40, c: '#5EA0EF' },
    { cx: 50, cy: 40, c: '#F5F5F7' },
    { cx: 70, cy: 40, c: '#FF4D4D' },
    { cx: 40, cy: 50, c: '#F5C518' },
    { cx: 60, cy: 50, c: '#34D26A' },
  ];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#0B0B0E" rx="12" />
      {rings.map((r, i) => (
        <Circle key={i} cx={r.cx} cy={r.cy} r="9" fill="none" stroke={r.c} strokeWidth="2.2" />
      ))}
      <SvgText x="50" y="78" fontSize="16" fill="#F5F5F7" fontWeight="bold" textAnchor="middle">
        {h}:{m}
      </SvgText>
      <SvgText x="50" y="90" fontSize="7" fill="#A1A1AA" textAnchor="middle">
        {steps.toLocaleString()} steps today
      </SvgText>
    </Svg>
  );
}

function CircuitFace({ size, time, bpm }: FaceProps) {
  const { h, m } = hm(time);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#040B0B" rx="12" />
      <Path
        d="M10 20 H38 V36 H62 M62 36 V20 H90 M10 80 H30 V60 H50 V80 H90"
        stroke="#0E5A52"
        strokeWidth="1.6"
        fill="none"
      />
      {[
        [38, 36],
        [62, 20],
        [30, 60],
        [50, 80],
      ].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r="2" fill="#2BD9C7" />
      ))}
      <SvgText x="50" y="52" fontSize="22" fill="#2BD9C7" fontWeight="bold" textAnchor="middle">
        {h}:{m}
      </SvgText>
      <SvgText x="50" y="93" fontSize="7" fill="#2BD9C7" textAnchor="middle" opacity={0.8}>
        ♥ {bpm}
      </SvgText>
    </Svg>
  );
}

function LeafFace({ size, time, steps }: FaceProps) {
  const { h, m } = hm(time);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#06110A" rx="12" />
      <Path d="M50 14 C76 26 78 56 50 74 C22 56 24 26 50 14 Z" fill="#0E3B22" stroke="#34D26A" strokeWidth="1.4" />
      <Line x1="50" y1="20" x2="50" y2="70" stroke="#34D26A" strokeWidth="1" opacity={0.8} />
      {[28, 38, 48, 58].map((y, i) => (
        <G key={y}>
          <Line x1="50" y1={y} x2={38 - i * 2} y2={y + 8} stroke="#34D26A" strokeWidth="0.7" opacity={0.7} />
          <Line x1="50" y1={y} x2={62 + i * 2} y2={y + 8} stroke="#34D26A" strokeWidth="0.7" opacity={0.7} />
        </G>
      ))}
      <SvgText x="50" y="90" fontSize="13" fill="#D9F7E5" fontWeight="bold" textAnchor="middle">
        {h}:{m} · {Math.round(steps / 100) / 10}k
      </SvgText>
    </Svg>
  );
}

function SprintFace({ size, time, kcal }: FaceProps) {
  const { h, m } = hm(time);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#120A0A" rx="12" />
      {[0, 1, 2, 3].map((i) => (
        <Path
          key={i}
          d={`M${12 + i * 4} ${30 + i * 12} H${60 - i * 6}`}
          stroke="#FF4D4D"
          strokeWidth="3"
          strokeLinecap="round"
          opacity={0.25 + i * 0.18}
        />
      ))}
      <Polygon points="62,24 86,42 62,60" fill="#FF4D4D" />
      <SvgText x="50" y="82" fontSize="16" fill="#F5F5F7" fontWeight="bold" textAnchor="middle">
        {h}:{m}
      </SvgText>
      <SvgText x="50" y="93" fontSize="7" fill="#FF8A8A" textAnchor="middle">
        {kcal} kcal burned
      </SvgText>
    </Svg>
  );
}

function WaveFace({ size, time }: FaceProps) {
  const { h, m } = hm(time);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#050A12" rx="12" />
      {[0, 1, 2].map((i) => (
        <Path
          key={i}
          d={`M0 ${52 + i * 12} C 18 ${40 + i * 12}, 32 ${64 + i * 12}, 50 ${52 + i * 12} S 82 ${40 + i * 12}, 100 ${52 + i * 12}`}
          stroke={['#4DD0E1', '#5EA0EF', '#8B5CF6'][i]}
          strokeWidth="2"
          fill="none"
          opacity={0.8 - i * 0.2}
        />
      ))}
      <SvgText x="50" y="34" fontSize="20" fill="#F5F5F7" fontWeight="bold" textAnchor="middle">
        {h}:{m}
      </SvgText>
    </Svg>
  );
}

function DotMatrixFace({ size, time }: FaceProps) {
  const { h, m } = hm(time);
  const dots: { x: number; y: number; on: boolean }[] = [];
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      dots.push({ x: 18 + c * 9, y: 12 + r * 9, on: (r * 8 + c * 3) % 7 < 3 });
    }
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#0C0C10" rx="12" />
      {dots.map((d, i) => (
        <Circle key={i} cx={d.x} cy={d.y} r="2.6" fill={d.on ? '#F5C518' : '#1D1D24'} />
      ))}
      <SvgText x="50" y="94" fontSize="14" fill="#F5C518" fontWeight="bold" textAnchor="middle">
        {h}:{m}
      </SvgText>
    </Svg>
  );
}

function AuroraFace({ size, time }: FaceProps) {
  const { h, m } = hm(time);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill="#050810" rx="12" />
      {[
        { d: 'M8 60 C 26 22, 46 50, 64 18', c: '#34D26A' },
        { d: 'M16 70 C 36 36, 56 62, 78 26', c: '#4DD0E1' },
        { d: 'M26 78 C 46 50, 66 72, 90 38', c: '#8B5CF6' },
      ].map((p, i) => (
        <Path key={i} d={p.d} stroke={p.c} strokeWidth="6" strokeLinecap="round" fill="none" opacity={0.35} />
      ))}
      <SvgText x="50" y="92" fontSize="15" fill="#F5F5F7" fontWeight="bold" textAnchor="middle">
        {h}:{m}
      </SvgText>
    </Svg>
  );
}

/* ---------- registry ---------- */

export const FACES: FaceDef[] = [
  { id: 'tetris', name: 'Block Drop', category: 'Tech', rating: 4.6, Component: TetrisFace },
  { id: 'butterfly', name: 'Glow Wing', category: 'Illustration', rating: 4.8, Component: ButterflyFace },
  { id: 'walker', name: 'Line Walker', category: 'Sports', rating: 4.4, Component: WalkerFace },
  { id: 'cat', name: 'Pastel Cat', category: 'Illustration', rating: 4.7, Component: CatFace },
  { id: 'retro', name: 'Brick & Martini', category: 'Abstract', rating: 4.2, Component: RetroFace },
  { id: 'spirograph', name: 'Spirograph', category: 'Geometry', rating: 4.5, Component: SpirographFace },
  { id: 'minimal-analog', name: 'Bauhaus', category: 'Minimal Analog', rating: 4.9, Component: MinimalAnalogFace },
  { id: 'terminal', name: 'Green Terminal', category: 'Tech', rating: 4.7, Component: TerminalFace },
  { id: 'galaxy', name: 'Spiral Galaxy', category: 'Space', rating: 4.8, Component: GalaxyFace },
  { id: 'chrono', name: 'Regatta Chrono', category: 'Chronograph', rating: 4.6, Component: ChronoFace },
  { id: 'neon-digital', name: 'Neon Digits', category: 'Minimal Digital', rating: 4.5, Component: NeonDigitalFace },
  { id: 'geometry', name: 'Triangulate', category: 'Geometry', rating: 4.1, Component: GeometryFace },
  { id: 'zodiac', name: 'Cassiopeia', category: 'Zodiac', rating: 4.3, Component: ZodiacFace },
  { id: 'planets', name: 'Orrery', category: 'Planets & Space', rating: 4.7, Component: PlanetsFace },
  { id: 'stripes', name: 'Candy Bars', category: 'Stripes & Dots', rating: 4.0, Component: StripesFace },
  { id: 'olympic', name: 'Five Rings', category: 'Olympic', rating: 4.4, Component: OlympicFace },
  { id: 'circuit', name: 'Motherboard', category: 'Tech', rating: 4.5, Component: CircuitFace },
  { id: 'leaf', name: 'Fern', category: 'Nature', rating: 4.6, Component: LeafFace },
  { id: 'sprint', name: 'Sprint', category: 'Sports', rating: 4.3, Component: SprintFace },
  { id: 'wave', name: 'Swell', category: 'Abstract', rating: 4.5, Component: WaveFace },
  { id: 'dotmatrix', name: 'Dot Matrix', category: 'Stripes & Dots', rating: 4.2, Component: DotMatrixFace },
  { id: 'aurora', name: 'Aurora', category: 'Nature', rating: 4.9, Component: AuroraFace },
];

export const FACE_CATEGORIES = [
  'All',
  'Illustration',
  'Chronograph',
  'Minimal Analog',
  'Abstract',
  'Geometry',
  'Space',
  'Sports',
  'Tech',
  'Nature',
  'Minimal Digital',
  'Zodiac',
  'Planets & Space',
  'Stripes & Dots',
  'Olympic',
] as const;

export interface FacePack {
  id: string;
  name: string;
  tagline: string;
  tint: string;
  faceIds: string[];
}

export const FACE_PACKS: FacePack[] = [
  { id: 'space-pack', name: 'Deep Space', tagline: 'Galaxies, orreries and constellations', tint: '#8B5CF6', faceIds: ['galaxy', 'planets', 'zodiac'] },
  { id: 'motion-pack', name: 'In Motion', tagline: 'Faces built for training days', tint: '#FF4D4D', faceIds: ['sprint', 'walker', 'olympic'] },
  { id: 'calm-pack', name: 'Calm', tagline: 'Nature and minimal faces', tint: '#34D26A', faceIds: ['leaf', 'aurora', 'minimal-analog'] },
  { id: 'retro-pack', name: 'Retro Tech', tagline: 'Terminals, dots and blocks', tint: '#F5C518', faceIds: ['terminal', 'tetris', 'dotmatrix'] },
];
