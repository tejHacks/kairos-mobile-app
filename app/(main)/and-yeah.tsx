import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../components/Navbar";
import { COLORS } from "../../constants/appConstants";

export default function AndYeahScreen() {
    return (
        <LinearGradient
            colors={["#0c0514", "#150926", "#271b4a"]}
            style={{ flex: 1 }}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    <Text style={styles.title}>And Yeah</Text>
                    <Text style={styles.subtitle}>
                        This is your new sample screen. Use it as a place to add new
                        functionality, content, or navigation flows.
                    </Text>
                </View>
            </SafeAreaView>
            <Navbar />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        paddingHorizontal: 24,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 14,
    },
    title: {
        color: COLORS.primary,
        fontSize: 36,
        fontWeight: "700",
        textAlign: "center",
    },
    subtitle: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 16,
        textAlign: "center",
        lineHeight: 24,
        maxWidth: 320,
    },
});
