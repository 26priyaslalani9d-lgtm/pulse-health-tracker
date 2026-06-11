import Svg, { Path } from 'react-native-svg';

interface SparklineProps {
  data: number[];
  width: number;
  height: number;
  color: string;
  strokeWidth?: number;
}

/** Tiny inline trend line (pure SVG, no chart lib). */
export function Sparkline({ data, width, height, color, strokeWidth = 2 }: SparklineProps) {
  if (data.length < 2) return <Svg width={width} height={height} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => ({
    x: i * stepX,
    y: height - ((v - min) / span) * (height - strokeWidth * 2) - strokeWidth,
  }));
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  return (
    <Svg width={width} height={height}>
      <Path d={d} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
