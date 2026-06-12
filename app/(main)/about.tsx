// app/(main)/about.tsx
import { LinearGradient } from "expo-linear-gradient";
import {
  Bug,
  Clock,
  Flame,
  Globe,
  Heart,
  Mail,
  MessageCircle,
  Mic2,
  Music,
  Shield,
  Smartphone,
  Star,
  Users,
  Zap,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Dimensions,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Navbar from "../../components/Navbar";
import TopBar from "../../components/TopBar";
import { scaleFont, scaleSize } from "../../hooks/useResponsive";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

const EMAIL = "olateju202@gmail.com";
const WHATSAPP_1 = "+2348148325438";
const WHATSAPP_2 = "+2348086976247";

const openLink = (url: string) => Linking.openURL(url);
const sendEmail = (subject: string) =>
  Linking.openURL(`mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`);
const openWhatsApp = (number: string) =>
  Linking.openURL(`https://wa.me/${number.replace("+", "")}`);

const COMING_SOON = [
  {
    icon: <Flame size={20} color="#D4AF37" strokeWidth={2} />,
    title: "Guided Prayer Series",
    desc: "Step-by-step prayer journeys for every season of your walk with God.",
  },
  {
    icon: <Shield size={20} color="#D4AF37" strokeWidth={2} />,
    title: "Warfare Guides",
    desc: "Scripture-backed warfare prayers — standing firm against every principality.",
  },
  {
    icon: <Clock size={20} color="#D4AF37" strokeWidth={2} />,
    title: "Fasting Plans",
    desc: "Structured fasting tracks with devotional support and prayer anchors.",
  },
  {
    icon: <Zap size={20} color="#D4AF37" strokeWidth={2} />,
    title: "Longer Prayer Plans",
    desc: "30, 60, and 90-minute deep-prayer frameworks for extended communion.",
  },
  {
    icon: <Users size={20} color="#D4AF37" strokeWidth={2} />,
    title: "Pray With Others",
    desc: "Join live prayer rooms and intercede together in real time.",
  },
  {
    icon: <Globe size={20} color="#D4AF37" strokeWidth={2} />,
    title: "Prayer Wall",
    desc: "Post your prayer requests. Let the Kairos community stand with you.",
  },
  {
    icon: <Music size={20} color="#D4AF37" strokeWidth={2} />,
    title: "Sacred Chants",
    desc: "Worship chants from your favourite ministers and artists — pray with sound.",
  },
  {
    icon: <Mic2 size={20} color="#D4AF37" strokeWidth={2} />,
    title: "Prophetic Prayer Prompts",
    desc: "AI-assisted, Scripture-rooted prompts to break through when words fail.",
  },
  {
    icon: <Star size={20} color="#D4AF37" strokeWidth={2} />,
    title: "Prayer Streaks & Milestones",
    desc: "Track your faithfulness. Celebrate every altar you've built.",
  },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const [contactVisible, setContactVisible] = useState(false);

  return (
    <LinearGradient
      colors={["#0a0312", "#17071e", "#2d1b4e"]}
      style={{ flex: 1 }}
    >
      <TopBar title="About" subtitle="Why Kairos exists" />

      <ScrollView
        contentContainerStyle={{
          paddingTop: scaleSize(24),
          paddingBottom: insets.bottom + scaleSize(120),
          paddingHorizontal: isTablet ? 40 : 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO ── */}
        <View style={styles.heroCard}>
          <Heart size={32} color="#D4AF37" strokeWidth={1.5} />
          <Text style={styles.heroTitle}>Built for one reason.</Text>
          <Text style={styles.heroText}>
            To make you pray.{"\n"}Not to impress. Not to perform.{"\n"}To
            bring you back to the place where God listens and speaks.
          </Text>
          <View style={styles.divider} />
          <Text style={styles.heroQuote}>
            &quot;Men ought always to pray, and not to faint.&quot;{"\n"}
            <Text style={styles.heroRef}>— Luke 18:1</Text>
          </Text>
        </View>

        {/* ── WHY ── */}
        <SectionTitle label="Why Kairos Exists" />
        <View style={styles.card}>
          <Text style={styles.paragraph}>
            We live in a world engineered for distraction. Prayer — the most
            powerful act available to a human being — gets pushed to last.
          </Text>
          <Text style={styles.paragraph}>
            Kairos was built to fight that. To give you structure, rhythm, and
            a sacred space where meeting with God becomes the most natural thing
            in your day. Not guilt. Not obligation. Intimacy.
          </Text>
          <Text style={styles.paragraph}>
            The name <Text style={styles.gold}>Kairos</Text> is Greek for{" "}
            <Text style={styles.italic}>appointed time</Text> — the moment
            heaven and earth intersect. That is what prayer is. That is what
            this app was built to protect.
          </Text>
        </View>

        {/* ── WHAT IT IS NOT ── */}
        <SectionTitle label="What Kairos Is Not" />
        <View style={styles.card}>
          <Text style={styles.paragraph}>
            Kairos does not replace your Bible. It does not replace your
            church, your pastor, or your personal study.
          </Text>
          <Text style={styles.paragraph}>
            It is a quiet companion — a digital altar — designed to make your
            prayer life more consistent, more intentional, and more alive.
          </Text>
        </View>

        {/* ── COMING SOON ── */}
        <SectionTitle label="What's Coming" />
        <Text style={styles.comingSoonNote}>
          Version 1.0 is just the foundation. Here&apos;s what God willing drops
          before the end of the year:
        </Text>

        {COMING_SOON.map((item, i) => (
          <View key={i} style={styles.featureCard}>
            <View style={styles.featureIconBox}>{item.icon}</View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{item.title}</Text>
              <Text style={styles.featureDesc}>{item.desc}</Text>
            </View>
            <View style={styles.soonBadge}>
              <Text style={styles.soonText}>SOON</Text>
            </View>
          </View>
        ))}

        {/* ── SUPPORT ── */}
        <SectionTitle label="Support the Mission" />
        <View style={styles.card}>
          <Text style={styles.paragraph}>
            Kairos is independently built — no team, no VC funding, just
            faith and code. If this app has helped you pray, please consider
            supporting its development.
          </Text>

          <View style={styles.supportBox}>
            <Smartphone size={18} color="#D4AF37" strokeWidth={2} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.supportLabel}>OPay Transfer</Text>
              <Text style={styles.supportValue}>08086976247</Text>
              <Text style={styles.supportName}>Olateju Olamide Emmanuel</Text>
            </View>
          </View>

          <View style={styles.supportBox}>
            <Smartphone size={18} color="#D4AF37" strokeWidth={2} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.supportLabel}>BANK SUPPORT</Text>
              <Text style={styles.supportValue}>1960476133: ACCESS BANK</Text>
              <Text style={styles.supportName}>Olateju Olamide Emmanuel</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openLink("https://ko-fi.com/olatejuolamide")}
          >
            <Heart size={16} color="#1a0f2e" strokeWidth={2.5} />
            <Text style={styles.actionBtnText}>Support via Ko-fi</Text>
          </TouchableOpacity>
        </View>

        {/* ── CONNECT ── */}
        <SectionTitle label="Get In Touch" />
        <View style={styles.card}>
          <ContactRow
            icon={<Mail size={18} color="#D4AF37" strokeWidth={2} />}
            label="Send an Email"
            onPress={() => sendEmail("Kairos App")}
          />
          <ContactRow
            icon={<MessageCircle size={18} color="#D4AF37" strokeWidth={2} />}
            label="WhatsApp · +2348148325438"
            onPress={() => openWhatsApp(WHATSAPP_1)}
          />
          <ContactRow
            icon={<MessageCircle size={18} color="#D4AF37" strokeWidth={2} />}
            label="WhatsApp · +2348086976247"
            onPress={() => openWhatsApp(WHATSAPP_2)}
          />
          <ContactRow
            icon={<Bug size={18} color="#D4AF37" strokeWidth={2} />}
            label="Report a Bug"
            onPress={() => sendEmail("Kairos App — Bug Report")}
          />
          <ContactRow
            icon={<Zap size={18} color="#D4AF37" strokeWidth={2} />}
            label="Suggest a Feature"
            onPress={() => sendEmail("Kairos App — Feature Suggestion")}
          />
        </View>

        {/* ── FOOTER ── */}
        <Text style={styles.footer}>
          &quot;Teach us to number our days, that we may apply our hearts unto
          wisdom.&quot;{"\n"}— Psalm 90:12{"\n\n"}
          Kairos v1.0 · Launching July 2025{"\n"}
          Built in faith. Offered in service.
        </Text>
      </ScrollView>

      <Navbar />

      {/* CONTACT MODAL — kept for backwards compat */}
      <Modal visible={contactVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Contact Developer</Text>
            <Text style={styles.modalText}>
              <Text style={styles.gold}>Email{"\n"}</Text>
              olateju202@gmail.com
            </Text>
            <Text style={styles.modalText}>
              <Text style={styles.gold}>WhatsApp{"\n"}</Text>
              +2348148325438{"\n"}+2348086976247
            </Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setContactVisible(false)}
            >
              <Text style={styles.actionBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return <Text style={styles.sectionTitle}>{label}</Text>;
}

function ContactRow({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.contactRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.contactIcon}>{icon}</View>
      <Text style={styles.contactLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: "rgba(76,20,123,0.28)",
    borderRadius: scaleSize(24),
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
    padding: scaleSize(28),
    alignItems: "center",
    marginBottom: scaleSize(8),
  },
  heroTitle: {
    fontSize: scaleFont(22),
    fontWeight: "700",
    color: "#fff",
    marginTop: scaleSize(14),
    marginBottom: scaleSize(10),
    textAlign: "center",
    letterSpacing: 0.3,
  },
  heroText: {
    fontSize: scaleFont(17),
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: scaleFont(28),
    marginBottom: scaleSize(16),
  },
  divider: {
    width: scaleSize(40),
    height: 1,
    backgroundColor: "rgba(212,175,55,0.4)",
    marginBottom: scaleSize(16),
  },
  heroQuote: {
    fontSize: scaleFont(15),
    color: "rgba(255,255,255,0.6)",
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: scaleFont(24),
  },
  heroRef: {
    color: "#D4AF37",
    fontStyle: "normal",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: scaleFont(13),
    fontWeight: "700",
    color: "#D4AF37",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginTop: scaleSize(28),
    marginBottom: scaleSize(12),
  },
  card: {
    backgroundColor: "rgba(76,20,123,0.22)",
    borderRadius: scaleSize(20),
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.15)",
    padding: scaleSize(22),
    marginBottom: scaleSize(4),
  },
  paragraph: {
    fontSize: scaleFont(16),
    color: "rgba(255,255,255,0.82)",
    lineHeight: scaleFont(27),
    marginBottom: scaleSize(12),
  },
  gold: {
    color: "#D4AF37",
    fontWeight: "700",
  },
  italic: {
    fontStyle: "italic",
    color: "rgba(255,255,255,0.82)",
  },
  comingSoonNote: {
    fontSize: scaleFont(14),
    color: "rgba(255,255,255,0.45)",
    marginBottom: scaleSize(12),
    lineHeight: scaleFont(22),
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76,20,123,0.18)",
    borderRadius: scaleSize(16),
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.12)",
    padding: scaleSize(14),
    marginBottom: scaleSize(10),
    gap: scaleSize(12),
  },
  featureIconBox: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: scaleSize(12),
    backgroundColor: "rgba(212,175,55,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  featureTitle: {
    fontSize: scaleFont(14),
    fontWeight: "700",
    color: "#fff",
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  featureDesc: {
    fontSize: scaleFont(12),
    color: "rgba(255,255,255,0.5)",
    lineHeight: scaleFont(18),
  },
  soonBadge: {
    backgroundColor: "rgba(212,175,55,0.12)",
    borderRadius: scaleSize(20),
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(3),
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
  },
  soonText: {
    fontSize: scaleFont(8),
    color: "#D4AF37",
    fontWeight: "700",
    letterSpacing: 1,
  },
  supportBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212,175,55,0.07)",
    borderRadius: scaleSize(14),
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.2)",
    padding: scaleSize(14),
    marginBottom: scaleSize(16),
  },
  supportLabel: {
    fontSize: scaleFont(10),
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  supportValue: {
    fontSize: scaleFont(18),
    fontWeight: "700",
    color: "#D4AF37",
    letterSpacing: 1,
  },
  supportName: {
    fontSize: scaleFont(11),
    color: "rgba(255,255,255,0.45)",
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: "#D4AF37",
    borderRadius: scaleSize(14),
    paddingVertical: scaleSize(14),
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: scaleSize(8),
  },
  actionBtnText: {
    color: "#1a0f2e",
    fontWeight: "700",
    fontSize: scaleFont(15),
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scaleSize(12),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    gap: scaleSize(12),
  },
  contactIcon: {
    width: scaleSize(36),
    height: scaleSize(36),
    borderRadius: scaleSize(10),
    backgroundColor: "rgba(212,175,55,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  contactLabel: {
    fontSize: scaleFont(14),
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
  },
  footer: {
    marginTop: scaleSize(40),
    marginBottom: scaleSize(20),
    fontSize: scaleFont(13),
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    lineHeight: scaleFont(22),
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10,3,18,0.95)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#1a0f2e",
    borderRadius: scaleSize(24),
    padding: scaleSize(26),
    width: "90%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    gap: scaleSize(12),
  },
  modalTitle: {
    fontSize: scaleFont(20),
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: scaleSize(4),
  },
  modalText: {
    fontSize: scaleFont(15),
    color: "rgba(255,255,255,0.7)",
    lineHeight: scaleFont(24),
    textAlign: "center",
  },
});