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

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const tabs = [
    { label: "Kairos", icon: Clock, route: "/(main)/kairos" },
    { label: "Meditate", icon: BookOpen, route: "/(main)/meditations" },
    { label: "Altar", icon: Flame, route: "/(main)/home", isMain: true },
    { label: "Scribe", icon: PenTool, route: "/(main)/scribe" },
    { label: "Fasting", icon: Droplets, route: "/(main)/fasting" },
  ];

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        width,
        paddingBottom: insets.bottom + 8,
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
                    shadowColor: "#D4AF37",
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
                    borderColor: "#D4AF37",
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
                    <Icon size={scale(28)} color="#D4AF37" strokeWidth={2.5} />
                  </View>
                </View>

                <Text
                  style={{
                    marginTop: scale(46),
                    fontSize: scale(11),
                    color: "#D4AF37",
                    fontWeight: "700",
                    letterSpacing: 1,
                  }}
                >
                  {/* ALTAR */}
                </Text>
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
                color={isActive ? "#D4AF37" : "rgba(255,255,255,0.5)"}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text
                style={{
                  fontSize: 10,
                  color: isActive ? "#D4AF37" : "rgba(255,255,255,0.5)",
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
