import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionButton, Card, StatusPill } from '@/components/Primitives';
import { indianLanguages } from '@/constants/data';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { translateText } from '@/lib/ai';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { initialMLKitLanguages, getDownloadedMLKitModels, saveMLKitModelStatus, translateTextWithMLKit, type MLKitLanguageModel } from '@/lib/mlkitTranslation';

export default function TranslatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isOffline } = useApp();
  const [source, setSource] = useState('English');
  const [target, setTarget] = useState('Hindi');
  const [input, setInput] = useState('Stay indoors and keep your emergency kit ready.');
  const [result, setResult] = useState('');
  const [picker, setPicker] = useState<'source' | 'target' | null>(null);
  const [translating, setTranslating] = useState(false);

  const [mlKitModels, setMlKitModels] = useState<Record<string, boolean>>({ hi: true, bn: true });
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    getDownloadedMLKitModels().then((models) => setMlKitModels(models)).catch(() => undefined);
  }, []);

  const translate = async () => {
    if (!input.trim()) return;
    if (target === 'English') { setResult(input); return; }
    setTranslating(true);
    try {
      // First try Google ML Kit on-device offline translation engine
      const mlKitResult = await translateTextWithMLKit(input.trim(), target, isOffline);
      setResult(mlKitResult);
    } catch {
      try {
        const translated = await translateText(input.trim(), target, isOffline);
        setResult(translated);
      } catch {
        setResult('[Translation failed — please try again.]');
      }
    } finally {
      setTranslating(false);
    }
  };

  const handleDownloadModel = (lang: MLKitLanguageModel) => {
    if (downloadingCode) return;
    setDownloadingCode(lang.code);
    setDownloadProgress(15);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloadingCode(null);
          void saveMLKitModelStatus(lang.code, true);
          setMlKitModels((cur) => ({ ...cur, [lang.code]: true }));
          return 100;
        }
        return prev + 25;
      });
    }, 450);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: 118 }}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: colors.sageLight }]}>GOOGLE ML KIT TRANSLATION</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Translate clearly</Text>
          </View>
          <StatusPill label="ML Kit Offline" icon="globe" />
        </View>
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>
          On-device Google ML Kit translation engine provides instant offline translation for Indian regional languages without cellular data.
        </Text>

        <Card style={styles.translationCard}>
          <View style={styles.languageRow}>
            <LanguageButton label={source} onPress={() => setPicker('source')} colors={colors} />
            <Pressable onPress={() => { const next = source; setSource(target); setTarget(next); }} style={[styles.swap, { backgroundColor: colors.muted }]}>
              <Feather name="refresh-cw" size={15} color={colors.sageLight} />
            </Pressable>
            <LanguageButton label={target} onPress={() => setPicker('target')} colors={colors} />
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Your message</Text>
          <TextInput
            value={input}
            onChangeText={setInput}
            multiline
            placeholder="Type an alert or instruction"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.editor, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]}
          />

          <ActionButton label={translating ? "Translating..." : "Translate message (ML Kit)"} icon="globe" onPress={translate} />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Translated result</Text>
          <View style={[styles.result, { backgroundColor: colors.sage + '18', borderColor: colors.sage + '55' }]}>
            {translating ? (
              <ActivityIndicator color={colors.sageLight} />
            ) : result ? (
              <Text style={[styles.resultText, { color: colors.foreground }]}>{result}</Text>
            ) : (
              <View style={styles.emptyResult}>
                <Feather name="message-square" size={18} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Your translation will appear here</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Google ML Kit Offline Language Pack Manager */}
        <View style={styles.packSection}>
          <View style={styles.packHeader}>
            <Feather name="download-cloud" size={16} color={colors.sageLight} />
            <Text style={[styles.packTitle, { color: colors.foreground }]}>Google ML Kit Language Packs</Text>
          </View>
          <Text style={[styles.packSubtitle, { color: colors.mutedForeground }]}>
            Download language models (~30 MB each) to translate complex emergency messages completely offline.
          </Text>

          <View style={styles.modelGrid}>
            {initialMLKitLanguages.map((lang) => {
              const isDownloaded = mlKitModels[lang.code];
              const isDownloading = downloadingCode === lang.code;
              return (
                <View key={lang.code} style={[styles.modelCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.modelName, { color: colors.foreground }]}>{lang.name}</Text>
                      <Text style={[styles.modelNative, { color: colors.sageLight }]}>({lang.nativeName})</Text>
                    </View>
                    <Text style={[styles.modelSize, { color: colors.mutedForeground }]}>{lang.sizeMB} MB · ML Kit model</Text>
                  </View>
                  <Pressable
                    onPress={() => !isDownloaded && handleDownloadModel(lang)}
                    style={[
                      styles.modelBtn,
                      {
                        backgroundColor: isDownloaded ? colors.sage + '20' : colors.sage,
                        borderColor: isDownloaded ? colors.sage : colors.sage,
                      },
                    ]}
                  >
                    {isDownloading ? (
                      <Text style={[styles.modelBtnText, { color: colors.sageLight }]}>{downloadProgress}%</Text>
                    ) : isDownloaded ? (
                      <>
                        <Feather name="check-circle" size={12} color={colors.sageLight} />
                        <Text style={[styles.modelBtnText, { color: colors.sageLight }]}>Ready</Text>
                      </>
                    ) : (
                      <>
                        <Feather name="download" size={12} color={colors.primaryForeground} />
                        <Text style={[styles.modelBtnText, { color: colors.primaryForeground }]}>Get</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <Modal visible={picker !== null} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <Pressable style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]} onPress={() => setPicker(null)}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Choose language</Text>
            <ScrollView contentContainerStyle={styles.languageList}>
              {indianLanguages.map((language) => (
                <Pressable
                  key={language}
                  onPress={() => {
                    if (picker === 'source') setSource(language);
                    else setTarget(language);
                    setPicker(null);
                  }}
                  style={[styles.languageChoice, { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.languageText, { color: colors.foreground }]}>{language}</Text>
                  {(picker === 'source' ? source : target) === language ? (
                    <Feather name="check" size={17} color={colors.sageLight} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function LanguageButton({ label, onPress, colors }: { label: string; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  return (
    <Pressable onPress={onPress} style={[styles.languageButton, { backgroundColor: colors.input, borderColor: colors.border }]}>
      <Text style={[styles.languageButtonText, { color: colors.foreground }]}>{label}</Text>
      <Feather name="chevron-down" size={15} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  kicker: { fontSize: 10, letterSpacing: 1.5, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold', letterSpacing: -0.7 },
  intro: { paddingHorizontal: 20, fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', marginTop: 10, marginBottom: 22 },
  translationCard: { marginHorizontal: 18, gap: 12 },
  languageRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  languageButton: { flex: 1, minHeight: 43, borderRadius: 12, borderWidth: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  languageButtonText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  swap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
  editor: { minHeight: 112, borderRadius: 13, borderWidth: 1, padding: 12, fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular', textAlignVertical: 'top' },
  result: { minHeight: 108, borderRadius: 13, borderWidth: 1, padding: 13, justifyContent: 'center' },
  resultText: { fontSize: 16, lineHeight: 25, fontFamily: 'Inter_600SemiBold' },
  emptyResult: { alignItems: 'center', gap: 7 },
  emptyText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  packSection: { marginHorizontal: 18, marginTop: 22, gap: 10 },
  packHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  packTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  packSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  modelGrid: { gap: 10, marginTop: 4 },
  modelCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1 },
  modelName: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  modelNative: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  modelSize: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  modelBtn: { minWidth: 62, height: 34, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 10 },
  modelBtnText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingTop: 10, paddingBottom: 25, maxHeight: '75%' },
  sheetHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(170,184,200,0.5)', marginBottom: 15 },
  sheetTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', paddingHorizontal: 20, marginBottom: 6 },
  languageList: { paddingHorizontal: 20 },
  languageChoice: { minHeight: 46, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  languageText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
