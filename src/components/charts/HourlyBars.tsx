import { View } from 'react-native';
import { CartesianChart, Bar } from 'victory-native';

import { PText } from '@/components/ui/PText';

interface HourlyBarsProps {
  /** 24 values indexed by hour (missing hours = 0) */
  values: number[];
  color: string;
  height?: number;
  accessibilitySummary: string;
}

/** Hourly mini bar chart (midnight → midnight). */
export function HourlyBars({ values, color, height = 90, accessibilitySummary }: HourlyBarsProps) {
  const chartData = Array.from({ length: 24 }, (_, h) => ({ x: h, y: values[h] ?? 0 }));

  return (
    <View accessible accessibilityLabel={accessibilitySummary}>
      <View style={{ height }}>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={['y']}
          domain={{ y: [0] }}
          domainPadding={{ left: 4, right: 4, top: 4 }}
        >
          {({ points, chartBounds }) => (
            <Bar
              points={points.y}
              chartBounds={chartBounds}
              color={color}
              innerPadding={0.35}
              roundedCorners={{ topLeft: 2, topRight: 2 }}
            />
          )}
        </CartesianChart>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        {['12am', '6am', '12pm', '6pm', '12am'].map((label, i) => (
          <PText key={`${label}-${i}`} variant="caption" tone="tertiary">
            {label}
          </PText>
        ))}
      </View>
    </View>
  );
}
