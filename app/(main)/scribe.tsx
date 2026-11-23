import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  Bold,
  FileDown,
  Italic,
  LayoutGrid,
  List as ListIcon,
  PenLine,
  Plus,
  Quote,
  Trash2,
  Underline,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

// ─── Types ────────────────────────────────────────────────────────────────

type ViewMode = "stack" | "grid";

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

const tagColors: Record<EntryTag, string> = {
  prayer: "#3B82F6",
  instruction: c.violet,
  insight: "#F59E0B",
  song: "#EC4899",
  dream: "#06B6D4",
  testimony: "#10B981",
  burden: c.danger,
  prayerpoint: "#F97316",
  wisdom: "#84CC16",
  word: c.violet,
  temptation: c.danger,
  meditation: "#14B8A6",
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
  }
};

// ─── Rich text editor (WebView contenteditable) ────────────────────────────
// A plain TextInput can't hold more than one style at once, so real
// "press B, it's bold now, keep typing, stays bold" behavior needs a real
// contenteditable surface. Mirrors the pattern used in ExpoForge's CodeEditor
// — a small bundled HTML page rendered in a WebView.

const EDITOR_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>
  * { -webkit-tap-highlight-color: transparent; }
  html, body { margin:0; padding:0; background: transparent; }
  #editor {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 17px;
    line-height: 30px;
    color: #EDE7F6;
    padding: 4px 4px 40px 4px;
    min-height: 100vh;
    outline: none;
    caret-color: #D4AF37;
  }
  #editor:empty:before {
    content: attr(data-placeholder);
    color: rgba(237,231,246,0.28);
  }
  #editor b, #editor strong { font-weight: 700; color: #FFFFFF; }
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
    <WebView
      ref={webviewRef}
      originWhitelist={["*"]}
      source={{ html: EDITOR_HTML }}
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

export default function ScribeScreen() {
  const insets = useSafeAreaInsets();
  const headerAnim = useRef(new Animated.Value(0)).current;

  const [viewMode, setViewMode] = useState<ViewMode>("stack");
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
        <StatusBar barStyle="light-content" backgroundColor={c.bg} />
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
                        color: selected ? c.text : c.ink(0.4),
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
                backgroundColor: c.violet,
                paddingHorizontal: scaleSize(16),
                paddingVertical: scaleSize(9),
                borderRadius: scaleSize(14),
              }}
            >
              <Text style={{ color: c.text, fontWeight: "700", fontSize: scaleFont(13) }}>Save</Text>
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
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={c.bg} />

      <Animated.View
        style={{
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
          paddingTop: insets.top + scaleSize(10),
          paddingHorizontal: scaleSize(20),
          paddingBottom: scaleSize(16),
          backgroundColor: c.bg,
          borderBottomWidth: 1,
          borderBottomColor: c.goldA(0.12),
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: scaleSize(8), marginBottom: scaleSize(6) }}>
              <PenLine size={scaleSize(14)} color={c.gold} strokeWidth={2} />
              <Text
                style={{
                  fontSize: scaleFont(11),
                  color: c.gold,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontWeight: "600",
                }}
              >
                Sacred Record
              </Text>
            </View>
            <Text style={{ fontSize: scaleFont(28), fontWeight: "700", color: c.text, letterSpacing: 0.5 }}>
              Scribe
            </Text>
            <Text style={{ fontSize: scaleFont(12), color: c.ink(0.35), letterSpacing: 2, marginTop: 2 }}>
              CAPTURE · REMEMBER · RETURN
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: scaleSize(10) }}>
            <TouchableOpacity
              onPress={() => setViewMode(viewMode === "grid" ? "stack" : "grid")}
              style={{
                width: scaleSize(40),
                height: scaleSize(40),
                borderRadius: scaleSize(20),
                backgroundColor: c.wash(0.06),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {viewMode === "grid" ? (
                <ListIcon size={scaleSize(17)} color={c.ink(0.7)} strokeWidth={2} />
              ) : (
                <LayoutGrid size={scaleSize(17)} color={c.ink(0.7)} strokeWidth={2} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={openNew}
              style={{
                width: scaleSize(40),
                height: scaleSize(40),
                borderRadius: scaleSize(20),
                backgroundColor: c.violet,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={scaleSize(20)} color={c.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {entries.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: scaleSize(6),
              backgroundColor: c.goldA(0.12),
              paddingHorizontal: scaleSize(12),
              paddingVertical: scaleSize(6),
              borderRadius: scaleSize(20),
              borderWidth: 1,
              borderColor: c.goldA(0.25),
              alignSelf: "flex-start",
              marginTop: scaleSize(14),
            }}
          >
            <View style={{ width: scaleSize(6), height: scaleSize(6), borderRadius: scaleSize(3), backgroundColor: c.gold }} />
            <Text style={{ fontSize: scaleFont(11), color: c.gold, fontWeight: "600" }}>
              {entries.length} {entries.length === 1 ? "entry" : "entries"} written
            </Text>
          </View>
        )}
      </Animated.View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: scaleSize(16),
          paddingTop: scaleSize(16),
          paddingBottom: verticalScale(150) + insets.bottom + scaleSize(24),
          flexDirection: viewMode === "grid" ? "row" : "column",
          flexWrap: viewMode === "grid" ? "wrap" : "nowrap",
          justifyContent: viewMode === "grid" ? "space-between" : undefined,
        }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? null : entries.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: verticalScale(80), paddingHorizontal: scaleSize(40), width: "100%" }}>
            <Quote size={scaleSize(30)} color={c.goldA(0.3)} strokeWidth={1.5} />
            <Text
              style={{
                fontSize: scaleFont(22),
                fontWeight: "700",
                color: c.text,
                marginTop: scaleSize(14),
                marginBottom: scaleSize(10),
                textAlign: "center",
              }}
            >
              Your Journal Awaits
            </Text>
            <Text style={{ fontSize: scaleFont(14), color: c.ink(0.4), textAlign: "center", lineHeight: scaleFont(21) }}>
              Capture instructions, prayers, dreams, and testimonies. Tap + to begin.
            </Text>
          </View>
        ) : (
          entries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              onPress={() => openEdit(entry)}
              onLongPress={() =>
                Alert.alert(entry.title, "What do you want to do?", [
                  { text: "Export PDF", onPress: () => exportEntryToPdf(entry) },
                  { text: "Delete", style: "destructive", onPress: () => remove(entry.id) },
                  { text: "Cancel", style: "cancel" },
                ])
              }
              activeOpacity={0.8}
              style={{
                width: viewMode === "grid" ? "48%" : "100%",
                backgroundColor: c.bg,
                borderRadius: scaleSize(16),
                padding: scaleSize(16),
                marginBottom: scaleSize(12),
                borderWidth: 1,
                borderColor: c.ink(0.05),
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: scaleSize(8), flexWrap: "wrap", gap: 6 }}>
                <View
                  style={{
                    backgroundColor: tagColors[entry.tag],
                    paddingHorizontal: scaleSize(10),
                    paddingVertical: scaleSize(4),
                    borderRadius: scaleSize(8),
                  }}
                >
                  <Text style={{ fontSize: scaleFont(10), fontWeight: "700", color: c.text, letterSpacing: 0.4 }}>
                    {tagLabels[entry.tag]}
                  </Text>
                </View>
                <Text style={{ fontSize: scaleFont(11), color: c.ink(0.35) }}>
                  {formatTimestamp(entry.timestamp)}
                </Text>
              </View>
              {entry.scriptureRef && (
                <Text style={{ fontSize: scaleFont(12), color: c.gold, fontWeight: "600", marginBottom: scaleSize(6) }}>
                  {entry.scriptureRef}
                </Text>
              )}
              <Text style={{ fontSize: scaleFont(17), fontWeight: "700", color: c.text, marginBottom: scaleSize(6) }} numberOfLines={2}>
                {entry.title}
              </Text>
              <Text style={{ fontSize: scaleFont(14), color: c.ink(0.5), lineHeight: scaleFont(20) }} numberOfLines={viewMode === "grid" ? 4 : 2}>
                {htmlToPlainText(entry.content)}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Navbar />
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
        backgroundColor: active ? c.gold : c.ink(0.06),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={scaleSize(16)} color={active ? c.bg : c.ink(0.6)} strokeWidth={2.2} />
    </TouchableOpacity>
  );
}
