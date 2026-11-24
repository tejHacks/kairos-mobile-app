import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  Bold,
  BookOpen,
  FileDown,
  Feather,
  Italic,
  Plus,
  Search,
  Underline,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scaleFont, scaleSize, verticalScale } from "../../hooks/useResponsive";
import Navbar from "@/components/Navbar";

import { c } from "@/constants/theme";
import { reportError } from "@/lib/crashlytics";

// ─── Types ────────────────────────────────────────────────────────────────

type EntryTag =
  | "prayer"
  | "instruction"
  | "insight"
  | "song"
  | "dream"
  | "testimony"
  | "burden"
  | "prayerpoint"
  | "wisdom"
  | "word"
  | "temptation"
  | "meditation";

interface JournalEntry {
  id: string;
  title: string;
  content: string; // HTML from the rich text editor, not markdown
  tag: EntryTag;
  scriptureRef?: string;
  timestamp: Date;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "@kairos/scribe_entries";

// Warm, earthy tag colours that sit well beside the gold accent.
const tagColors: Record<EntryTag, string> = {
  prayer: "#B8862B",
  instruction: "#A8642A",
  insight: "#3E7CB1",
  song: "#B5577A",
  dream: "#3F8DA0",
  testimony: "#4C8F62",
  burden: "#A6483A",
  prayerpoint: "#C7742A",
  wisdom: "#71903A",
  word: "#8C6D25",
  temptation: "#9A3B3B",
  meditation: "#3D8A80",
};

const tagLabels: Record<EntryTag, string> = {
  prayer: "Prayer",
  instruction: "Instruction",
  insight: "Scripture Insight",
  song: "Song / Poem",
  dream: "Dream",
  testimony: "Testimony",
  burden: "Burden",
  prayerpoint: "Prayer Point",
  wisdom: "Word of Wisdom",
  word: "Word",
  temptation: "Temptation",
  meditation: "Meditation",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const htmlToPlainText = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isEmptyContent = (html: string) => htmlToPlainText(html).length === 0;

const formatTimestamp = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0)
    return `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
};

// ─── PDF export ─────────────────────────────────────────────────────────────

const buildPdfHtml = (entry: JournalEntry) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#FDF3E1; font-family: Georgia, serif; color:#1C0F05; padding:64px 72px; }
  .tag { display:inline-block; font-size:10px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase;
    color:#fff; background:${tagColors[entry.tag]}; padding:4px 10px; border-radius:8px; margin-bottom:14px; }
  .scripture { font-size:12px; color:#8B5A2B; font-style:italic; margin-bottom:8px; }
  h1 { font-size:26px; margin-bottom:6px; line-height:1.3; }
  .meta { font-size:11px; color:rgba(44,24,16,0.45); margin-bottom:24px; font-style:italic; }
  .divider { border:none; border-top:1px solid rgba(139,90,43,0.2); margin:16px 0 24px; }
  .body { font-size:16px; line-height:32px; }
  .body b, .body strong { font-weight:700; }
  .footer { margin-top:48px; font-size:10px; color:rgba(44,24,16,0.3); font-style:italic; }
</style></head>
<body>
  ${entry.scriptureRef ? `<div class="scripture">${entry.scriptureRef}</div>` : ""}
  <div class="tag">${tagLabels[entry.tag]}</div>
  <h1>${entry.title}</h1>
  <div class="meta">${formatTimestamp(entry.timestamp)}</div>
  <hr class="divider"/>
  <div class="body">${entry.content}</div>
  <div class="footer">Scribe · Kairos</div>
</body></html>
`;

const exportEntryToPdf = async (entry: JournalEntry) => {
  try {
    const html = buildPdfHtml(entry);
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `${entry.title} — Scribe`,
        UTI: "com.adobe.pdf",
      });
    } else {
      Alert.alert("Saved", `PDF saved to:\n${uri}`);
    }
  } catch (e) {
    Alert.alert("Export Failed", "Could not generate PDF. Please try again.");
    console.error("[Scribe] PDF export error:", e);
      reportError(e, "[Scribe] PDF export error:");
  }
};

// ─── Rich text editor (WebView contenteditable) ────────────────────────────
// A plain TextInput can't hold more than one style at once, so real
// "press B, it's bold now, keep typing, stays bold" behavior needs a real
// contenteditable surface. Mirrors the pattern used in ExpoForge's CodeEditor
// — a small bundled HTML page rendered in a WebView.

const editorHtml = (p: { text: string; muted: string; caret: string; strong: string }) => `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>
  * { -webkit-tap-highlight-color: transparent; }
  html, body { margin:0; padding:0; background: transparent; }
  #editor {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 17px;
    line-height: 30px;
    color: ${p.text};
    padding: 4px 4px 40px 4px;
    min-height: 100vh;
    outline: none;
    caret-color: ${p.caret};
  }
  #editor:empty:before {
    content: attr(data-placeholder);
    color: ${p.muted};
  }
  #editor b, #editor strong { font-weight: 700; color: ${p.strong}; }
  #editor i, #editor em { font-style: italic; }
</style></head>
<body>
<div id="editor" contenteditable="true" data-placeholder="Write what the Lord has spoken..."></div>
<script>
  const editor = document.getElementById('editor');
  let debounceTimer;

  function postMsg(payload) {
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(payload));
  }

  function reportState() {
    postMsg({
      type: 'STATE',
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    });
  }

  editor.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      postMsg({ type: 'CONTENT_CHANGED', content: editor.innerHTML });
    }, 250);
    reportState();
  });

  document.addEventListener('selectionchange', reportState);

  document.addEventListener('message', handleMessage);
  window.addEventListener('message', handleMessage);

  function handleMessage(event) {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'SET_CONTENT') {
        editor.innerHTML = msg.content || '';
      } else if (msg.type === 'FORMAT') {
        editor.focus();
        document.execCommand(msg.command, false, null);
        postMsg({ type: 'CONTENT_CHANGED', content: editor.innerHTML });
        reportState();
      } else if (msg.type === 'FOCUS') {
        editor.focus();
      }
    } catch (e) {}
  }

  postMsg({ type: 'READY' });
</script>
</body></html>`;

type FormatState = { bold: boolean; italic: boolean; underline: boolean };

function RichTextEditor({
  content,
  onChange,
  onStateChange,
  webviewRef,
}: {
  content: string;
  onChange: (html: string) => void;
  onStateChange: (state: FormatState) => void;
  webviewRef: React.RefObject<WebView>;
}) {
  const isReady = useRef(false);
  const lastPushed = useRef(content);

  useEffect(() => {
    if (isReady.current && content !== lastPushed.current) {
      webviewRef.current?.postMessage(JSON.stringify({ type: "SET_CONTENT", content }));
      lastPushed.current = content;
    }
  }, [content]);

  return (
    <EditorWebView
      ref={webviewRef}
      originWhitelist={["*"]}
      source={{ html: editorHtml({ text: c.text, muted: c.ink(0.3), caret: c.goldFill, strong: c.text }) }}
      style={{ flex: 1, backgroundColor: "transparent" }}
      containerStyle={{ backgroundColor: "transparent" }}
      scrollEnabled
      onMessage={(event) => {
        try {
          const msg = JSON.parse(event.nativeEvent.data);
          if (msg.type === "READY") {
            isReady.current = true;
            webviewRef.current?.postMessage(JSON.stringify({ type: "SET_CONTENT", content }));
            lastPushed.current = content;
          } else if (msg.type === "CONTENT_CHANGED") {
            lastPushed.current = msg.content;
            onChange(msg.content);
          } else if (msg.type === "STATE") {
            onStateChange({ bold: msg.bold, italic: msg.italic, underline: msg.underline });
          }
        } catch (e) {}
      }}
    />
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────

// react-native-webview\'s class types do not match the React 19.3 types yet.
const EditorWebView = WebView as unknown as React.ComponentType<React.ComponentProps<typeof WebView> & { ref?: React.Ref<WebView> }>;

export default function ScribeScreen() {
  const insets = useSafeAreaInsets();
  const headerAnim = useRef(new Animated.Value(0)).current;

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<EntryTag | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [scriptureRef, setScriptureRef] = useState("");
  const [selectedTag, setSelectedTag] = useState<EntryTag>("prayer");
  const [formatState, setFormatState] = useState<FormatState>({ bold: false, italic: false, underline: false });

  const webviewRef = useRef<WebView>(null!);

  const usedTags = useMemo(
    () => (Object.keys(tagLabels) as EntryTag[]).filter((t) => entries.some((e) => e.tag === t)),
    [entries],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...entries]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .filter((e) => !filter || e.tag === filter)
      .filter(
        (e) =>
          !q ||
          e.title.toLowerCase().includes(q) ||
          (e.scriptureRef ?? "").toLowerCase().includes(q) ||
          htmlToPlainText(e.content).toLowerCase().includes(q),
      );
  }, [entries, query, filter]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setEntries(parsed.map((e: any) => ({ ...e, timestamp: new Date(e.timestamp) })));
        }
      } catch (e) {
        console.error("[Scribe] Failed to load entries:", e);
      reportError(e, "[Scribe] Failed to load entries:");
      } finally {
        setLoading(false);
        Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      }
    })();
  }, []);

  const persist = useCallback(async (list: JournalEntry[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("[Scribe] Failed to save entries:", e);
      reportError(e, "[Scribe] Failed to save entries:");
    }
  }, []);

  const openNew = () => {
    setCurrentEntry(null);
    setTitle("");
    setContent("");
    setScriptureRef("");
    setSelectedTag("prayer");
    setShowEditor(true);
  };

  const openEdit = (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setScriptureRef(entry.scriptureRef || "");
    setSelectedTag(entry.tag);
    setShowEditor(true);
  };

  const save = () => {
    if (isEmptyContent(content)) {
      Alert.alert("Empty Entry", "Write something before saving.");
      return;
    }
    const entry: JournalEntry = {
      id: currentEntry?.id || Date.now().toString(),
      title: title.trim() || "Untitled",
      content,
      tag: selectedTag,
      scriptureRef: scriptureRef.trim() || undefined,
      timestamp: currentEntry?.timestamp || new Date(),
    };
    const updated = currentEntry
      ? entries.map((e) => (e.id === entry.id ? entry : e))
      : [entry, ...entries];
    setEntries(updated);
    persist(updated);
    setShowEditor(false);
  };

  const remove = (id: string) => {
    Alert.alert("Delete Entry", "Delete this journal entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updated = entries.filter((e) => e.id !== id);
          setEntries(updated);
          persist(updated);
        },
      },
    ]);
  };

  const toggleFormat = (command: "bold" | "italic" | "underline") => {
    webviewRef.current?.postMessage(JSON.stringify({ type: "FORMAT", command }));
  };

  // ── EDITOR VIEW ────────────────────────────────────────────────────────
  if (showEditor) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <StatusBar barStyle={c.scheme === "dark" ? "light-content" : "dark-content"} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {/* Top bar */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingTop: insets.top + scaleSize(10),
              paddingHorizontal: scaleSize(14),
              paddingBottom: scaleSize(12),
              backgroundColor: c.bg,
              borderBottomWidth: 1,
              borderBottomColor: c.goldA(0.12),
              gap: scaleSize(8),
            }}
          >
            <TouchableOpacity
              onPress={() => setShowEditor(false)}
              style={{
                width: scaleSize(34),
                height: scaleSize(34),
                borderRadius: scaleSize(17),
                backgroundColor: c.wash(0.06),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={scaleSize(16)} color={c.text} strokeWidth={2} />
            </TouchableOpacity>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              {(Object.keys(tagLabels) as EntryTag[]).map((tag) => {
                const selected = selectedTag === tag;
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => setSelectedTag(tag)}
                    style={{
                      paddingHorizontal: scaleSize(12),
                      paddingVertical: scaleSize(7),
                      borderRadius: scaleSize(14),
                      backgroundColor: selected ? tagColors[tag] : c.ink(0.06),
                      marginRight: scaleSize(6),
                    }}
                  >
                    <Text
                      style={{
                        fontSize: scaleFont(12),
                        fontWeight: "600",
                        color: selected ? "#FFFFFF" : c.ink(0.4),
                      }}
                    >
                      {tagLabels[tag]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={save}
              style={{
                backgroundColor: c.goldFill,
                paddingHorizontal: scaleSize(16),
                paddingVertical: scaleSize(9),
                borderRadius: scaleSize(14),
              }}
            >
              <Text style={{ color: c.onGoldFill, fontWeight: "800", fontSize: scaleFont(13) }}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Fields */}
          <View style={{ paddingHorizontal: scaleSize(18), paddingTop: scaleSize(16) }}>
            <TextInput
              style={{ fontSize: scaleFont(12), color: c.gold, fontStyle: "italic", marginBottom: scaleSize(6) }}
              placeholder="Scripture reference · e.g. John 3:16"
              placeholderTextColor={c.goldA(0.4)}
              value={scriptureRef}
              onChangeText={setScriptureRef}
              returnKeyType="next"
            />
            <TextInput
              style={{
                fontSize: scaleFont(22),
                fontWeight: "700",
                color: c.text,
                marginBottom: scaleSize(10),
              }}
              placeholder="Title"
              placeholderTextColor={c.ink(0.25)}
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
            />
          </View>

          {/* Rich text body */}
          <View style={{ flex: 1, paddingHorizontal: scaleSize(14) }}>
            <RichTextEditor
              webviewRef={webviewRef}
              content={content}
              onChange={setContent}
              onStateChange={setFormatState}
            />
          </View>

          {/* Formatting toolbar */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: c.bg,
              borderTopWidth: 1,
              borderTopColor: c.goldA(0.12),
              paddingHorizontal: scaleSize(12),
              paddingVertical: scaleSize(8),
              paddingBottom: scaleSize(8) + insets.bottom,
              gap: scaleSize(6),
            }}
          >
            <FormatButton active={formatState.bold} onPress={() => toggleFormat("bold")} icon={Bold} />
            <FormatButton active={formatState.italic} onPress={() => toggleFormat("italic")} icon={Italic} />
            <FormatButton active={formatState.underline} onPress={() => toggleFormat("underline")} icon={Underline} />
            <View
              style={{
                width: 1,
                height: scaleSize(24),
                backgroundColor: c.wash(0.1),
                marginHorizontal: scaleSize(4),
              }}
            />
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={() => {
                if (isEmptyContent(content)) {
                  Alert.alert("Nothing to export", "Write something first.");
                  return;
                }
                exportEntryToPdf({
                  id: currentEntry?.id || Date.now().toString(),
                  title: title.trim() || "Untitled",
                  content,
                  tag: selectedTag,
                  scriptureRef: scriptureRef.trim() || undefined,
                  timestamp: currentEntry?.timestamp || new Date(),
                });
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: scaleSize(6),
                paddingHorizontal: scaleSize(12),
                paddingVertical: scaleSize(9),
                borderRadius: scaleSize(12),
                backgroundColor: c.goldA(0.1),
              }}
            >
              <FileDown size={scaleSize(14)} color={c.gold} strokeWidth={2} />
              <Text style={{ color: c.gold, fontSize: scaleFont(12), fontWeight: "700" }}>PDF</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────────
  const latest = visible[0];
  const rest = visible.slice(1);
  const groups = groupByMonth(rest);

  const entryMenu = (entry: JournalEntry) =>
    Alert.alert(entry.title, "What do you want to do?", [
      { text: "Export PDF", onPress: () => exportEntryToPdf(entry) },
      { text: "Delete", style: "destructive", onPress: () => remove(entry.id) },
      { text: "Cancel", style: "cancel" },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar barStyle={c.scheme === "dark" ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + scaleSize(14),
          paddingBottom: verticalScale(150) + insets.bottom + scaleSize(24),
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View
          style={{
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
            paddingHorizontal: scaleSize(20),
          }}
        >
          <Text style={{ fontSize: scaleFont(11), color: c.gold, letterSpacing: 2, fontWeight: "800" }}>
            {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: scaleSize(4) }}>
            <View>
              <Text style={{ fontSize: scaleFont(34), fontWeight: "800", color: c.text, fontFamily: SERIF }}>Scribe</Text>
              <Text style={{ fontSize: scaleFont(13), color: c.textMuted, marginTop: 2 }}>
                {entries.length === 0
                  ? "Write the vision; make it plain."
                  : `${entries.length} ${entries.length === 1 ? "entry" : "entries"} · ${streakLabel(entries)}`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={openNew}
              activeOpacity={0.85}
              accessibilityLabel="New entry"
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: scaleSize(6),
                backgroundColor: c.goldFill,
                paddingHorizontal: scaleSize(16),
                paddingVertical: scaleSize(11),
                borderRadius: scaleSize(22),
                shadowColor: c.goldFill,
                shadowOpacity: 0.4,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 5,
              }}
            >
              <Plus size={scaleSize(16)} color={c.onGoldFill} strokeWidth={3} />
              <Text style={{ color: c.onGoldFill, fontWeight: "800", fontSize: scaleFont(14) }}>New</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {entries.length > 0 && (
          <>
            {/* Search */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: scaleSize(8),
                marginHorizontal: scaleSize(20),
                marginTop: scaleSize(18),
                backgroundColor: c.surface,
                borderRadius: scaleSize(14),
                borderWidth: 1,
                borderColor: c.ink(0.06),
                paddingHorizontal: scaleSize(14),
              }}
            >
              <Search size={scaleSize(16)} color={c.textMuted} strokeWidth={2} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search your journal"
                placeholderTextColor={c.ink(0.35)}
                style={{ flex: 1, color: c.text, fontSize: scaleFont(14), paddingVertical: scaleSize(12) }}
                returnKeyType="search"
              />
              {!!query && (
                <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={scaleSize(15)} color={c.textMuted} strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>

            {/* Tag filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: scaleSize(8), paddingHorizontal: scaleSize(20), paddingVertical: scaleSize(14) }}
            >
              {([null, ...usedTags] as (EntryTag | null)[]).map((tag) => {
                const on = filter === tag;
                return (
                  <TouchableOpacity
                    key={tag ?? "all"}
                    onPress={() => setFilter(tag)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: scaleSize(6),
                      paddingHorizontal: scaleSize(12),
                      paddingVertical: scaleSize(7),
                      borderRadius: scaleSize(16),
                      backgroundColor: on ? c.text : c.surface,
                      borderWidth: 1,
                      borderColor: on ? c.text : c.ink(0.08),
                    }}
                  >
                    {tag && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: tagColors[tag] }} />}
                    <Text style={{ fontSize: scaleFont(12), fontWeight: "700", color: on ? c.bg : c.textSecondary }}>
                      {tag ? tagLabels[tag] : "All"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {loading ? null : entries.length === 0 ? (
          <EmptyJournal onStart={openNew} />
        ) : visible.length === 0 ? (
          <Text style={{ color: c.textMuted, textAlign: "center", marginTop: scaleSize(40), fontSize: scaleFont(14) }}>
            Nothing matches that yet.
          </Text>
        ) : (
          <View style={{ paddingHorizontal: scaleSize(20) }}>
            {/* Latest entry, featured */}
            {latest && (
              <TouchableOpacity
                onPress={() => openEdit(latest)}
                onLongPress={() => entryMenu(latest)}
                activeOpacity={0.85}
                style={{
                  backgroundColor: c.surface,
                  borderRadius: scaleSize(22),
                  padding: scaleSize(20),
                  borderWidth: 1,
                  borderColor: c.goldA(0.25),
                  marginBottom: scaleSize(22),
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: scaleFont(10), color: c.gold, letterSpacing: 2, fontWeight: "800" }}>LATEST</Text>
                  <TagPill tag={latest.tag} />
                </View>
                <Text
                  style={{ fontSize: scaleFont(22), fontWeight: "700", color: c.text, marginTop: scaleSize(12), fontFamily: SERIF }}
                  numberOfLines={2}
                >
                  {latest.title}
                </Text>
                {latest.scriptureRef && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: scaleSize(6) }}>
                    <BookOpen size={scaleSize(12)} color={c.gold} strokeWidth={2} />
                    <Text style={{ fontSize: scaleFont(12), color: c.gold, fontWeight: "700" }}>{latest.scriptureRef}</Text>
                  </View>
                )}
                <Text
                  style={{ fontSize: scaleFont(15), color: c.textSecondary, lineHeight: scaleFont(24), marginTop: scaleSize(10), fontFamily: SERIF }}
                  numberOfLines={4}
                >
                  {htmlToPlainText(latest.content)}
                </Text>
                <Text style={{ fontSize: scaleFont(11), color: c.textMuted, marginTop: scaleSize(12) }}>
                  {formatTimestamp(latest.timestamp)}
                </Text>
              </TouchableOpacity>
            )}

            {/* Timeline by month */}
            {groups.map(([month, list]) => (
              <View key={month} style={{ marginBottom: scaleSize(8) }}>
                <Text style={{ fontSize: scaleFont(11), color: c.textMuted, letterSpacing: 2, fontWeight: "800", marginBottom: scaleSize(12) }}>
                  {month}
                </Text>
                {list.map((entry, i) => (
                  <View key={entry.id} style={{ flexDirection: "row" }}>
                    {/* date rail */}
                    <View style={{ width: scaleSize(44), alignItems: "center" }}>
                      <Text style={{ fontSize: scaleFont(20), fontWeight: "300", color: c.text }}>{entry.timestamp.getDate()}</Text>
                      <Text style={{ fontSize: scaleFont(9), fontWeight: "800", color: c.textMuted, letterSpacing: 1 }}>
                        {entry.timestamp.toLocaleDateString([], { weekday: "short" }).toUpperCase()}
                      </Text>
                      {i < list.length - 1 && (
                        <View style={{ flex: 1, width: 1, backgroundColor: c.goldA(0.25), marginTop: scaleSize(6), marginBottom: -scaleSize(4) }} />
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => openEdit(entry)}
                      onLongPress={() => entryMenu(entry)}
                      activeOpacity={0.8}
                      style={{
                        flex: 1,
                        marginLeft: scaleSize(10),
                        marginBottom: scaleSize(12),
                        backgroundColor: c.surface,
                        borderRadius: scaleSize(16),
                        padding: scaleSize(14),
                        borderWidth: 1,
                        borderColor: c.ink(0.06),
                        borderLeftWidth: 3,
                        borderLeftColor: tagColors[entry.tag],
                      }}
                    >
                      <Text style={{ fontSize: scaleFont(10), fontWeight: "800", color: tagColors[entry.tag], letterSpacing: 1 }}>
                        {tagLabels[entry.tag].toUpperCase()}
                        {entry.scriptureRef ? <Text style={{ color: c.gold }}>{`  ·  ${entry.scriptureRef}`}</Text> : null}
                      </Text>
                      <Text style={{ fontSize: scaleFont(16), fontWeight: "700", color: c.text, marginTop: scaleSize(4) }} numberOfLines={1}>
                        {entry.title}
                      </Text>
                      <Text style={{ fontSize: scaleFont(13), color: c.textMuted, lineHeight: scaleFont(19), marginTop: 2 }} numberOfLines={2}>
                        {htmlToPlainText(entry.content)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}

            <Text style={{ fontSize: scaleFont(11), color: c.textMuted, textAlign: "center", marginTop: scaleSize(8) }}>
              Long-press an entry to export or delete it.
            </Text>
          </View>
        )}
      </ScrollView>

      <Navbar />
    </View>
  );
}

// ─── List helpers ───────────────────────────────────────────────────────────

const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

function groupByMonth(list: JournalEntry[]): [string, JournalEntry[]][] {
  const map = new Map<string, JournalEntry[]>();
  for (const e of list) {
    const key = e.timestamp.toLocaleDateString([], { month: "long", year: "numeric" }).toUpperCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return [...map.entries()];
}

/** "3-day streak" when you've written on consecutive days up to today/yesterday. */
function streakLabel(list: JournalEntry[]) {
  const days = new Set(list.map((e) => e.timestamp.toDateString()));
  const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(d.toDateString())) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n >= 2 ? `${n}-day streak` : "keep writing";
}

function TagPill({ tag }: { tag: EntryTag }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: scaleSize(10),
        paddingVertical: scaleSize(4),
        borderRadius: scaleSize(12),
        backgroundColor: c.ink(0.05),
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: tagColors[tag] }} />
      <Text style={{ fontSize: scaleFont(11), fontWeight: "700", color: c.textSecondary }}>{tagLabels[tag]}</Text>
    </View>
  );
}

function EmptyJournal({ onStart }: { onStart: () => void }) {
  return (
    <View style={{ alignItems: "center", marginTop: verticalScale(50), paddingHorizontal: scaleSize(36) }}>
      <View
        style={{
          width: scaleSize(72),
          height: scaleSize(72),
          borderRadius: scaleSize(36),
          backgroundColor: c.goldA(0.12),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather size={scaleSize(30)} color={c.gold} strokeWidth={1.6} />
      </View>
      <Text style={{ fontSize: scaleFont(22), fontWeight: "700", color: c.text, marginTop: scaleSize(18), fontFamily: SERIF }}>
        Your journal awaits
      </Text>
      <Text style={{ fontSize: scaleFont(14), color: c.textMuted, textAlign: "center", lineHeight: scaleFont(21), marginTop: scaleSize(8) }}>
        Capture instructions, prayers, dreams and testimonies. Come back later and see how faithful He has been.
      </Text>
      <Text style={{ fontSize: scaleFont(13), color: c.gold, fontStyle: "italic", textAlign: "center", marginTop: scaleSize(14) }}>
        &quot;Write the vision, and make it plain upon tables, that he may run that readeth it.&quot; Habakkuk 2:2
      </Text>
      <TouchableOpacity
        onPress={onStart}
        activeOpacity={0.85}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: scaleSize(8),
          backgroundColor: c.goldFill,
          paddingHorizontal: scaleSize(22),
          paddingVertical: scaleSize(14),
          borderRadius: scaleSize(16),
          marginTop: scaleSize(22),
        }}
      >
        <Plus size={scaleSize(16)} color={c.onGoldFill} strokeWidth={3} />
        <Text style={{ color: c.onGoldFill, fontWeight: "800", fontSize: scaleFont(15) }}>Write your first entry</Text>
      </TouchableOpacity>
    </View>
  );
}

function FormatButton({
  active,
  onPress,
  icon: Icon,
}: {
  active: boolean;
  onPress: () => void;
  icon: React.FC<any>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: scaleSize(38),
        height: scaleSize(38),
        borderRadius: scaleSize(10),
        backgroundColor: active ? c.goldFill : c.ink(0.06),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={scaleSize(16)} color={active ? c.onGoldFill : c.ink(0.6)} strokeWidth={2.2} />
    </TouchableOpacity>
  );
}
