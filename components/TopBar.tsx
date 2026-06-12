import { useRouter } from "expo-router";
import { BookOpen, Settings2 } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scaleFont, scaleSize } from "../hooks/useResponsive";

interface TopBarProps {
    title: string;
    subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <View
            style={{
                paddingTop: insets.top + scaleSize(10),
                paddingHorizontal: scaleSize(20),
                paddingBottom: scaleSize(16),
                backgroundColor: "#1a0f2e",
                borderBottomWidth: 1,
                borderBottomColor: "rgba(212,175,55,0.12)",
            }}
        >
            {/* Top row — icons */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: scaleSize(4),
                }}
            >
                {/* Left — About */}
                <TouchableOpacity
                    onPress={() => router.push("/(main)/about" as any)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ flexDirection: "row", alignItems: "center", gap: scaleSize(6) }}
                >
                    <BookOpen
                        size={scaleSize(13)}
                        color="rgba(255,255,255,0.35)"
                        strokeWidth={1.8}
                    />
                    <Text
                        style={{
                            fontSize: scaleFont(10),
                            color: "rgba(255,255,255,0.35)",
                            letterSpacing: 1.5,
                            textTransform: "uppercase",
                            fontWeight: "600",
                        }}
                    >
                        About
                    </Text>
                </TouchableOpacity>

                {/* KAIROS wordmark — center */}
                <Text
                    style={{
                        fontSize: scaleFont(10),
                        color: "#D4AF37",
                        letterSpacing: 4,
                        fontWeight: "700",
                        textTransform: "uppercase",
                    }}
                >
                    KAIROS
                </Text>

                {/* Right — Settings */}
                <TouchableOpacity
                    onPress={() => router.push("/(main)/settings" as any)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Settings2
                        size={scaleSize(18)}
                        color="rgba(255,255,255,0.35)"
                        strokeWidth={1.8}
                    />
                </TouchableOpacity>
            </View>

            {/* Title */}
            <Text
                style={{
                    fontSize: scaleFont(26),
                    fontWeight: "700",
                    color: "#fff",
                    letterSpacing: 0.4,
                    marginTop: scaleSize(2),
                }}
            >
                {title}
            </Text>

            {/* Subtitle */}
            {subtitle ? (
                <Text
                    style={{
                        fontSize: scaleFont(11),
                        color: "rgba(255,255,255,0.3)",
                        letterSpacing: 2,
                        marginTop: 2,
                        textTransform: "uppercase",
                    }}
                >
                    {subtitle}
                </Text>
            ) : null}
        </View>
    );
}