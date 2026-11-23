import React from "react";
import { Animated, Text, View } from "react-native";
import { FONTS } from "../constants/appConstants";

import { c } from "@/constants/theme";

interface SacredHourDisplayProps {
  currentSacredHour:
    | { hour: number; name: string; subtitle: string }
    | undefined;
  pulseAnim: Animated.Value;
}

export const SacredHourDisplay: React.FC<SacredHourDisplayProps> = ({
  currentSacredHour,
  pulseAnim,
}) => {
  if (!currentSacredHour) return null;

  return (
    <>
      {/* Sacred Hour Badge */}
      <Animated.View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: c.goldA(0.15),
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 20,
            marginTop: 10,
            borderWidth: 1,
            borderColor: c.gold,
          },
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: c.gold,
            marginRight: 8,
          }}
        />
        <Text
          style={{
            color: c.gold,
            fontSize: 12,
            fontWeight: "700",
            letterSpacing: 1.5,
          }}
        >
          ACTIVE HOUR
        </Text>
      </Animated.View>

      {/* Hour Name and Subtitle */}
      <View style={{ alignItems: "center", marginTop: 20, marginBottom: 10 }}>
        <Text
          style={{
            fontSize: 24,
            fontFamily: FONTS.regular,
            color: c.text,
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          {currentSacredHour.name}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: c.gold,
            letterSpacing: 2,
            fontWeight: "600",
          }}
        >
          {currentSacredHour.subtitle}
        </Text>
      </View>
    </>
  );
};
