import * as React from "react";
import { View, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import type { RecoveryTrendData } from "@/lib/db/queries/whoop";

// Victory Native module references (loaded dynamically on native)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let VictoryNativeModule: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SkiaModule: any = null;

interface RecoveryTrendChartProps {
  data: RecoveryTrendData | null;
  isLoading: boolean;
}

interface ChartData {
  day: string;
  value: number;
}

function getRecoveryColor(score: number): string {
  if (score <= 33) return "#ef4444"; // red-500
  if (score <= 66) return "#eab308"; // yellow-500
  return "#22c55e"; // green-500
}

export function RecoveryTrendChart({ data, isLoading }: RecoveryTrendChartProps) {
  const [chartModulesLoaded, setChartModulesLoaded] = React.useState(false);
  const [pressState, setPressState] = React.useState<{ state: unknown; isActive: boolean } | null>(
    null,
  );

  // Load Victory Native modules dynamically (only on native)
  React.useEffect(() => {
    if (Platform.OS === "web") {
      setChartModulesLoaded(true);
      return;
    }

    async function loadModules() {
      try {
        const [victoryNative, skia] = await Promise.all([
          import("victory-native"),
          import("@shopify/react-native-skia"),
        ]);

        VictoryNativeModule = victoryNative;
        SkiaModule = skia;

        setChartModulesLoaded(true);
      } catch (error) {
        console.error("Failed to load chart modules:", error);
        setChartModulesLoaded(true);
      }
    }
    loadModules();
  }, []);

  // Transform data for chart
  const chartData: ChartData[] = React.useMemo(() => {
    if (!data?.points?.length) return [];
    return data.points.map((point) => ({
      day: point.dayLabel,
      value: point.value,
    }));
  }, [data]);

  // Calculate Y-axis domain (0-100 for recovery percentage)
  const yDomain: [number, number] = React.useMemo(() => {
    return [0, 100];
  }, []);

  // Get selected point info when chart is pressed
  const selectedPoint = React.useMemo(() => {
    if (!pressState?.isActive || !chartData.length) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = pressState.state as any;
    if (!state?.x?.value?.value) return null;
    const xValue = state.x.value.value;
    const found = chartData.find((d) => d.day === xValue);
    return found || null;
  }, [pressState, chartData]);

  const hasEnoughData = chartData.length >= 3;

  return (
    <Card testID="whoop-recovery-trend-chart">
      <CardHeader className="flex-row items-center gap-3 pb-2">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
          <Ionicons name="trending-up-outline" size={20} color="#22c55e" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-medium text-muted-foreground">Recovery Trend</Text>
          <Text className="text-xs text-muted-foreground">Last 7 days</Text>
        </View>
        <View className="rounded-full bg-primary/10 px-2 py-0.5">
          <Text className="text-xs font-medium text-primary">Whoop</Text>
        </View>
        {selectedPoint && (
          <View className="items-end">
            <Text
              className="text-lg font-bold"
              style={{ color: getRecoveryColor(selectedPoint.value) }}
            >
              {selectedPoint.value}%
            </Text>
            <Text className="text-xs text-muted-foreground">{selectedPoint.day}</Text>
          </View>
        )}
      </CardHeader>
      <CardContent>
        {isLoading || !chartModulesLoaded ? (
          <View testID="recovery-trend-loading" className="h-48 justify-end gap-2 pb-4">
            <View className="flex-row items-end justify-around">
              <Skeleton width={24} height={60} />
              <Skeleton width={24} height={100} />
              <Skeleton width={24} height={80} />
              <Skeleton width={24} height={120} />
              <Skeleton width={24} height={90} />
              <Skeleton width={24} height={70} />
              <Skeleton width={24} height={110} />
            </View>
            <Skeleton width="100%" height={14} className="mt-2" />
          </View>
        ) : !hasEnoughData ? (
          <View testID="recovery-trend-empty" className="h-48 items-center justify-center">
            <Ionicons name="battery-charging-outline" size={40} color="#d1d5db" />
            <Text className="mt-3 text-muted-foreground">Not enough data</Text>
            <Text className="text-sm text-muted-foreground">Need at least 3 days of data</Text>
          </View>
        ) : Platform.OS === "web" ? (
          <View testID="recovery-trend-web" className="h-48 items-center justify-center">
            <Text className="text-muted-foreground">Chart available on iOS</Text>
          </View>
        ) : (
          <ChartContent
            chartData={chartData}
            yDomain={yDomain}
            onPressStateChange={setPressState}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Separate component to use hooks after modules are loaded
function ChartContent({
  chartData,
  yDomain,
  onPressStateChange,
}: {
  chartData: ChartData[];
  yDomain: [number, number];
  onPressStateChange: (state: { state: unknown; isActive: boolean } | null) => void;
}) {
  // Get components from modules
  const CartesianChart = VictoryNativeModule?.CartesianChart;
  const Line = VictoryNativeModule?.Line;
  const useChartPressState = VictoryNativeModule?.useChartPressState;
  const useFont = SkiaModule?.useFont;
  const Circle = SkiaModule?.Circle;

  // Use system font as fallback (null font will use default)
  const font = useFont ? useFont(null, 12) : null;

  // Create press state for interactivity
  const chartPressState = useChartPressState
    ? useChartPressState({ x: "", y: { value: 0 } })
    : null;

  // Report press state to parent once on mount
  const hasReportedRef = React.useRef(false);
  React.useEffect(() => {
    if (chartPressState && !hasReportedRef.current) {
      hasReportedRef.current = true;
      onPressStateChange(chartPressState);
    }
  }, [chartPressState, onPressStateChange]);

  if (!CartesianChart || !Line) {
    return null;
  }

  return (
    <View className="h-48">
      <CartesianChart
        data={chartData}
        xKey="day"
        yKeys={["value"]}
        xAxis={{
          font,
          tickCount: chartData.length,
          formatXLabel: (value: string) => value,
        }}
        yAxis={[
          {
            font,
            domain: yDomain,
          },
        ]}
        chartPressState={chartPressState?.state}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {({ points }: any) => (
          <>
            <Line points={points.value} color="#22c55e" strokeWidth={2} />
            {/* Render data point indicators with color based on value */}
            {Circle &&
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              points.value.map((point: any, index: number) => {
                const dataPoint = chartData[index];
                const color = dataPoint ? getRecoveryColor(dataPoint.value) : "#22c55e";
                return <Circle key={index} cx={point.x} cy={point.y} r={4} color={color} />;
              })}
          </>
        )}
      </CartesianChart>
    </View>
  );
}
