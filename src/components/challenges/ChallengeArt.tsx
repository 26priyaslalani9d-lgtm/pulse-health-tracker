import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';

export type ArtKind = 'mountain' | 'city' | 'track' | 'flame' | 'wave' | 'forest';

interface ChallengeArtProps {
  kind: ArtKind;
  tint: string;
}

/** Hero art for challenge cards — programmatic SVG, no stock images. */
export function ChallengeArt({ kind, tint }: ChallengeArtProps) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 320 110" preserveAspectRatio="xMidYMid slice">
      <Rect width="320" height="110" fill="#13131A" />
      {kind === 'mountain' ? (
        <>
          <Polygon points="0,110 90,28 180,110" fill={tint} opacity={0.35} />
          <Polygon points="110,110 210,14 320,110" fill={tint} opacity={0.55} />
          <Polygon points="196,42 210,14 226,42 218,38 210,46" fill="#F5F5F7" opacity={0.8} />
          <Circle cx="48" cy="26" r="10" fill="#F5F5F7" opacity={0.25} />
        </>
      ) : null}
      {kind === 'city' ? (
        <>
          {[
            [16, 50, 30],
            [56, 30, 38],
            [104, 58, 24],
            [138, 22, 44],
            [192, 44, 32],
            [234, 34, 40],
            [284, 54, 26],
          ].map(([x, y, w], i) => (
            <Rect key={i} x={x} y={y} width={w} height={110 - (y as number)} fill={tint} opacity={0.3 + (i % 3) * 0.15} />
          ))}
          <Circle cx="296" cy="22" r="9" fill={tint} opacity={0.7} />
        </>
      ) : null}
      {kind === 'track' ? (
        <>
          {[0, 1, 2, 3].map((i) => (
            <Path
              key={i}
              d={`M-10 ${28 + i * 22} C 90 ${8 + i * 22}, 230 ${48 + i * 22}, 330 ${28 + i * 22}`}
              stroke={tint}
              strokeWidth={6}
              opacity={0.25 + i * 0.16}
              fill="none"
            />
          ))}
          <Circle cx="248" cy="44" r="7" fill="#F5F5F7" opacity={0.9} />
        </>
      ) : null}
      {kind === 'flame' ? (
        <>
          <Path
            d="M160 16 C 196 44, 204 64, 188 84 C 180 94, 166 100, 160 100 C 154 100, 140 94, 132 84 C 116 64, 124 44, 160 16 Z"
            fill={tint}
            opacity={0.55}
          />
          <Path
            d="M160 44 C 178 60, 182 72, 172 84 C 167 90, 162 92, 160 92 C 158 92, 153 90, 148 84 C 138 72, 142 60, 160 44 Z"
            fill="#F5C518"
            opacity={0.7}
          />
        </>
      ) : null}
      {kind === 'wave' ? (
        <>
          {[0, 1, 2].map((i) => (
            <Path
              key={i}
              d={`M-10 ${52 + i * 18} C 50 ${30 + i * 18}, 110 ${74 + i * 18}, 170 ${52 + i * 18} S 290 ${30 + i * 18}, 330 ${52 + i * 18}`}
              stroke={tint}
              strokeWidth={5}
              fill="none"
              opacity={0.7 - i * 0.2}
            />
          ))}
        </>
      ) : null}
      {kind === 'forest' ? (
        <>
          {[30, 86, 144, 204, 262].map((x, i) => (
            <Polygon
              key={x}
              points={`${x},${100} ${x + 22},${30 + (i % 2) * 14} ${x + 44},${100}`}
              fill={tint}
              opacity={0.3 + (i % 3) * 0.18}
            />
          ))}
          <Circle cx="292" cy="20" r="8" fill="#F5F5F7" opacity={0.3} />
        </>
      ) : null}
    </Svg>
  );
}
