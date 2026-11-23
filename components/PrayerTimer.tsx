import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { DIMENSIONS } from "../constants/appConstants";

import { c } from "@/constants/theme";

interface PrayerTimerProps {
  minutes: number;
  seconds: number;
  canFinishPrayer: boolean;
  onBack: () => void;
  onFinish: () => void;
}

const scale = (size: number) => {
  if (DIMENSIONS.tabletWidth >= 768) return size * DIMENSIONS.scaleTablet;
  if (DIMENSIONS.smallDeviceWidth < 375) return size * DIMENSIONS.scaleSmall;
  return size;
};

export const PrayerTimer: React.FC<PrayerTimerProps> = ({
  minutes,
  seconds,
  canFinishPrayer,
  onBack,
  onFinish,
}) => {
  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          marginVertical: 50,
        }}
      >
        <Text
          style={{
            fontSize: scale(72),
            fontWeight: "300",
            color: c.text,
            letterSpacing: 2,
          }}
        >
          {minutes}
        </Text>
        <Text
          style={{
            fontSize: scale(36),
            color: c.gold,
            marginBottom: 12,
            marginLeft: 8,
            fontWeight: "300",
          }}
        >
          :{seconds.toString().padStart(2, "0")}
        </Text>
      </View>

      <TouchableOpacity onPress={onBack} style={{ marginVertical: 20 }}>
        <Text
          style={{
            color: c.gold,
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          ← Go Back
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          {
            backgroundColor: "transparent",
            paddingVertical: 16,
            paddingHorizontal: 60,
            borderRadius: 40,
            marginTop: 30,
            minWidth: 260,
            borderWidth: 2,
            borderColor: c.gold,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          },
          !canFinishPrayer && { borderColor: c.ink(0.22), opacity: 0.5 },
        ]}
        disabled={!canFinishPrayer}
        onPress={onFinish}
      >
        <Text
          style={[
            {
              color: c.gold,
              fontWeight: "700",
              fontSize: 16,
              letterSpacing: 2,
              textAlign: "center",
            },
            !canFinishPrayer && { color: c.textMuted },
          ]}
        >
          I HAVE PRAYED
        </Text>
      </TouchableOpacity>
    </>
  );
};
