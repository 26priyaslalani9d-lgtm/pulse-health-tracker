import { View } from 'react-native';
import { Rect } from '@shopify/react-native-skia';
import { CartesianChart, Line } from 'victory-native';

import { PText } from '@/components/ui/PText';

export interface ZoneBand {
  from: number;
  to: number;
  color: string;
  label: string;
}

interface TrendLineProps {
  /** x is any monotonically increasing number (ms epoch, index, …) */
  data: { x: number; y: number }[];
  color: string;
  height?: number;
  zones?: ZoneBand[];
  xLabels?: string[];
  accessibilitySummary: string;
}

/** Smooth line chart with optional horizontal zone bands (HR zones etc.). */
export function TrendLine({
  data,
  color,
  height = 180,
  zones = [],
  xLabels = [],
  accessibilitySummary,
}: TrendLineProps) {
  return (
    <View accessible accessibilityLabel={accessibilitySummary}>
      <View style={{ height }}>
        <CartesianChart data={data} xKey="x" yKeys={['y']} domainPadding={{ top: 12, bottom: 12 }}>
          {({ points, chartBounds, yScale }) => (
            <>
              {zones.map((zone) => {
                const top = yScale(zone.to);
                const bottom = yScale(zone.from);
                return (
                  <Rect
                    key={zone.label}
                    x={chartBounds.left}
                    y={top}
                    width={chartBounds.right - chartBounds.left}
                    height={Math.max(0, bottom - top)}
                    color={zone.color}
                    opacity={0.08}
                  />
                );
              })}
              <Line
                points={points.y}
                color={color}
                strokeWidth={2.5}
                curveType="natural"
                animate={{ type: 'timing', duration: 600 }}
              />
            </>
          )}
        </CartesianChart>
      </View>
      {xLabels.length > 0 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          {xLabels.map((label, i) => (
            <PText key={`${label}-${i}`} variant="caption" tone="tertiary">
              {label}
            </PText>
          ))}
        </View>
      ) : null}
    </View>
  );
}
