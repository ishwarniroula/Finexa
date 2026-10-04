import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const CARD_HEIGHT = 108;

export function AIActionCard({
  icon,
  title,
  subtitle,
  colors,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  colors: [string, string];
  onPress: () => void;
}) {
  const [width, setWidth] = useState(0);
  const diag = width > 0 ? Math.sqrt(width ** 2 + CARD_HEIGHT ** 2) * 1.4 : 0;
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (diag === 0) return;
    translateX.value = 0;
    translateX.value = withRepeat(
      withTiming(-diag, { duration: 3200, easing: Easing.linear }),
      -1,
      false
    );
  }, [diag, translateX]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ flex: 1 }}>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{
          height: CARD_HEIGHT,
          borderRadius: 18,
          overflow: "hidden",
          backgroundColor: colors[0],
        }}
      >
        {diag > 0 && (
          // Oversized and rotated so the -20deg diagonal still fully covers the card.
          <View
            style={{
              position: "absolute",
              width: diag,
              height: diag,
              top: -(diag - CARD_HEIGHT) / 2,
              left: -(diag - width) / 2,
              transform: [{ rotate: "-20deg" }],
            }}
          >
            <Animated.View
              style={[{ width: diag * 2, height: "100%" }, sweepStyle]}
            >
              <LinearGradient
                colors={[colors[0], colors[1], colors[0], colors[1], colors[0]]}
                locations={[0, 0.25, 0.5, 0.75, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ width: "100%", height: "100%" }}
              />
            </Animated.View>
          </View>
        )}

        <View
          style={{
            position: "absolute",
            inset: 0,
            padding: 16,
          }}
        >
          <View className="w-9 h-9 rounded-full bg-white/20 items-center justify-center mb-3">
            <Feather name={icon} size={16} color="#fff" />
          </View>
          <Text className="text-white text-[13px] font-semibold mb-0.5">
            {title}
          </Text>
          <Text className="text-white/70 text-[11px]">{subtitle}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
