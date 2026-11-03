import { usePathname, useRouter } from "expo-router";
import { BookOpen, Clock, Droplets, Flame, PenTool } from "lucide-react-native";
import React from "react";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const isSmallDevice = width < 375;
const isTablet = width >= 768;

const scale = (size: number) => {
  if (isTablet) return size * 1.2;
  if (isSmallDevice) return size * 0.9;
  return size;
};

const GOLD = "#D4AF37";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const tabs = [
    { label: "Plan", icon: Clock, route: "/(main)/plan" },
    { label: "Meditate", icon: BookOpen, route: "/(main)/meditations" },
    { label: "Altar", icon: Flame, route: "/(main)/home", isMain: true },
    { label: "Scribe", icon: PenTool, route: "/(main)/scribe" },
    { label: "Fasting", icon: Droplets, route: "/(main)/fasting" },
  ];

  // Guarantees at least ~12px of breathing room below the bar's
  // content even on phones that report insets.bottom === 0
  // (older Android 3-button nav sometimes does this).
  const bottomPadding = Math.max(insets.bottom, scale(12));

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        width,
        paddingBottom: bottomPadding,
        backgroundColor: "#1a0f2e",
        borderTopWidth: 1,
        borderTopColor: "rgba(212, 175, 55, 0.2)",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: scale(14),
          height: scale(70),
        }}
      >
        {tabs.map(({ label, icon: Icon, route, isMain }) => {
          const isActive = pathname === route;

          // ALTAR — CENTER, RAISED, GLOWING GOLD
          if (isMain) {
            return (
              <TouchableOpacity
                key={label}
                onPress={() => router.replace(route as any)}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  alignItems: "center",
                  marginTop: scale(-34),
                }}
              >
                {/* OUTER GLOW */}
                <View
                  style={{
                    width: scale(80),
                    height: scale(80),
                    borderRadius: scale(40),
                    backgroundColor: "rgba(212, 175, 55, 0.3)",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "absolute",
                    shadowColor: GOLD,
                    shadowOpacity: 0.8,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: 15,
                  }}
                />

                {/* GOLD RING */}
                <View
                  style={{
                    width: scale(70),
                    height: scale(70),
                    borderRadius: scale(35),
                    backgroundColor: "#1a0f2e",
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 3,
                    borderColor: GOLD,
                  }}
                >
                  {/* PURPLE INNER CORE */}
                  <View
                    style={{
                      width: scale(58),
                      height: scale(58),
                      borderRadius: scale(29),
                      backgroundColor: "#4C1D95",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Icon size={scale(28)} color={GOLD} strokeWidth={2.5} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }

          // OTHER TABS
          return (
            <TouchableOpacity
              key={label}
              onPress={() => router.replace(route as any)}
              style={{ flex: 1, alignItems: "center", gap: 4 }}
              activeOpacity={0.7}
            >
              <Icon
                size={22}
                color={isActive ? GOLD : "rgba(255,255,255,0.5)"}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text
                style={{
                  fontSize: 10,
                  color: isActive ? GOLD : "rgba(255,255,255,0.5)",
                  fontWeight: isActive ? "700" : "400",
                  letterSpacing: 0.5,
                }}
              >
                {label.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}