import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Keyboard } from 'react-native';
import { ActionButton, Card, StatusPill } from '@/components/Primitives';
import { indianLanguages } from '@/constants/data';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const translations: Record<string, string> = { Hindi: 'सुरक्षित रहें और स्थानीय प्रशासन के निर्देशों का पालन करें।', Bengali: 'নিরাপদ থাকুন এবং স্থানীয় প্রশাসনের নির্দেশ অনুসরণ করুন।', Tamil: 'பாதுகாப்பாக இருங்கள் மற்றும் உள்ளூர் நிர்வாகத்தின் அறிவுறுத்தல்களைப் பின்பற்றவும்.', Telugu: 'సురక్షితంగా ఉండండి మరియు స్థానిక అధికారుల సూచనలను పాటించండి.', Marathi: 'सुरक्षित रहा आणि स्थानिक प्रशासनाच्या सूचनांचे पालन करा.', Gujarati: 'સુરક્ષિત રહો અને સ્થાનિક વહીવટની સૂચનાઓનું પાલન કરો.', Kannada: 'ಸುರಕ್ಷಿತವಾಗಿರಿ ಮತ್ತು ಸ್ಥಳೀಯ ಆಡಳಿತದ ಸೂಚನೆಗಳನ್ನು ಪಾಲಿಸಿ.', Malayalam: 'സുരക്ഷിതരായിരിക്കുക, പ്രാദേശിക ഭരണകൂടത്തിന്റെ നിർദ്ദേശങ്ങൾ പാലിക്കുക.', Punjabi: 'ਸੁਰੱਖਿਅਤ ਰਹੋ ਅਤੇ ਸਥਾਨਕ ਪ੍ਰਸ਼ਾਸਨ ਦੀਆਂ ਹਦਾਇਤਾਂ ਦੀ ਪਾਲਣਾ ਕਰੋ.', Odia: 'ସୁରକ୍ଷିତ ରୁହନ୍ତୁ ଏବଂ ସ୍ଥାନୀୟ ପ୍ରଶାସନର ନିର୍ଦ୍ଦେଶ ପାଳନ କରନ୍ତୁ।', Urdu: 'محفوظ رہیں اور مقامی انتظامیہ کی ہدایات پر عمل کریں۔', Assamese: 'নিৰাপদে থাকক আৰু স্থানীয় প্ৰশাসনৰ নিৰ্দেশনা মানি চলক।' };

export default function TranslatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [source, setSource] = useState('English');
  const [target, setTarget] = useState('Hindi');
  const [input, setInput] = useState('Stay indoors and keep your emergency kit ready.');
  const [result, setResult] = useState('');
  const [picker, setPicker] = useState<'source' | 'target' | null>(null);
  const translate = () => { if (!input.trim()) return; setResult(target === 'English' ? input : translations[target] || 'अनुवाद उपलब्ध है।'); };
  return <View style={[styles.screen, { backgroundColor: colors.background }]}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: 118 }}><View style={styles.header}><View><Text style={[styles.kicker, { color: colors.sageLight }]}>LANGUAGE BRIDGE</Text><Text style={[styles.title, { color: colors.foreground }]}>Translate clearly</Text></View><StatusPill label="13 languages" icon="globe" /></View><Text style={[styles.intro, { color: colors.mutedForeground }]}>Make urgent information understood, even when the network is unavailable.</Text><Card style={styles.translationCard}><View style={styles.languageRow}><LanguageButton label={source} onPress={() => { Keyboard.dismiss(); setPicker('source'); }} colors={colors} /><Pressable onPress={() => { Keyboard.dismiss(); const next = source; setSource(target); setTarget(next); }} style={[styles.swap, { backgroundColor: colors.muted }]}><Feather name="refresh-cw" size={15} color={colors.sageLight} /></Pressable><LanguageButton label={target} onPress={() => { Keyboard.dismiss(); setPicker('target'); }} colors={colors} /></View><Text style={[styles.label, { color: colors.mutedForeground }]}>Your message</Text><TextInput value={input} onChangeText={setInput} multiline placeholder="Type an alert or instruction" placeholderTextColor={colors.mutedForeground} style={[styles.editor, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} /><ActionButton label="Translate message" icon="globe" onPress={() => { Keyboard.dismiss(); translate(); }} /><Text style={[styles.label, { color: colors.mutedForeground }]}>Translated result</Text><View style={[styles.result, { backgroundColor: colors.sage + '18', borderColor: colors.sage + '55' }]}>{result ? <Text style={[styles.resultText, { color: colors.foreground }]}>{result}</Text> : <View style={styles.emptyResult}><Feather name="message-square" size={18} color={colors.mutedForeground} /><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Your translation will appear here</Text></View>}</View></Card><View style={styles.trustRow}><Feather name="wifi-off" size={15} color={colors.sageLight} /><View style={styles.trustCopy}><Text style={[styles.trustTitle, { color: colors.foreground }]}>Offline language pack</Text><Text style={[styles.trustBody, { color: colors.mutedForeground }]}>Common disaster phrases are available without data.</Text></View></View></ScrollView><Modal visible={picker !== null} transparent animationType="slide" onRequestClose={() => setPicker(null)}><Pressable style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]} onPress={() => setPicker(null)}><View style={[styles.sheet, { backgroundColor: colors.card }]}><View style={styles.sheetHandle} /><Text style={[styles.sheetTitle, { color: colors.foreground }]}>Choose language</Text><ScrollView contentContainerStyle={styles.languageList}>{indianLanguages.map((language) => <Pressable key={language} onPress={() => { if (picker === 'source') setSource(language); else setTarget(language); setPicker(null); }} style={[styles.languageChoice, { borderBottomColor: colors.border }]}><Text style={[styles.languageText, { color: colors.foreground }]}>{language}</Text>{(picker === 'source' ? source : target) === language ? <Feather name="check" size={17} color={colors.sageLight} /> : null}</Pressable>)}</ScrollView></View></Pressable></Modal></View>;

}

function LanguageButton({ label, onPress, colors }: { label: string; onPress: () => void; colors: ReturnType<typeof useColors> }) { return <Pressable onPress={onPress} style={[styles.languageButton, { backgroundColor: colors.input, borderColor: colors.border }]}><Text style={[styles.languageButtonText, { color: colors.foreground }]}>{label}</Text><Feather name="chevron-down" size={15} color={colors.mutedForeground} /></Pressable>; }

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
  trustRow: { flexDirection: 'row', marginHorizontal: 22, marginTop: 19, alignItems: 'center', gap: 10 },
  trustCopy: { flex: 1 },
  trustTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  trustBody: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 3, lineHeight: 16 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingTop: 10, paddingBottom: 25, maxHeight: '75%' },
  sheetHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(170,184,200,0.5)', marginBottom: 15 },
  sheetTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', paddingHorizontal: 20, marginBottom: 6 },
  languageList: { paddingHorizontal: 20 },
  languageChoice: { minHeight: 46, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  languageText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
