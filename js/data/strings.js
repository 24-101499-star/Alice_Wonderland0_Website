/**
 * All interface copy. Every visible UI string lives here so that the
 * language switch only swaps text, never structure or playback state.
 */
export const STRINGS = {
  en: {
    dir: 'ltr',
    eyebrow: 'An interactive film',
    heroLine1: 'ALICE',
    heroMid: 'IN',
    heroLine2: 'WONDERLAND',
    subtitle: 'TOO LATE TO SAVE WONDERLAND',
    caption: 'Too late to save Wonderland',
    begin: 'Begin with sound',
    cue: 'Scroll to enter',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    soundAria: 'Toggle soundtrack',
    langAria: 'Choose language',
    chapterWord: 'Chapter',
    progressAria: 'Story progress',
    railAria: 'Chapters',
    loading: 'Lighting the lamps',
    loadError: 'The film could not be loaded. The story text is still available below.',
    replay: 'Return to the beginning',
    navTo: 'Go to chapter',
    ratio: '',
  },
  ar: {
    dir: 'rtl',
    eyebrow: 'فيلمٌ تفاعلي',
    heroLine1: 'أليس في',
    heroMid: '',
    heroLine2: 'بلاد العجائب',
    subtitle: 'لقد فات الأوان لإنقاذ بلاد العجائب',
    caption: 'لقد فات الأوان لإنقاذ بلاد العجائب',
    begin: 'ابدأ مع الموسيقى',
    cue: 'مرّر للدخول',
    soundOn: 'الصوت: مفعّل',
    soundOff: 'الصوت: متوقف',
    soundAria: 'تشغيل أو إيقاف الموسيقى',
    langAria: 'اختيار اللغة',
    chapterWord: 'الفصل',
    progressAria: 'تقدّم القصة',
    railAria: 'الفصول',
    loading: 'نُشعل المصابيح',
    loadError: 'تعذّر تحميل الفيلم، لكن نص القصة ما زال متاحًا أدناه.',
    replay: 'العودة إلى البداية',
    navTo: 'الانتقال إلى الفصل',
    ratio: '',
  },
};

/** Arabic-Indic numerals for chapter numbers in Arabic. */
export function formatNumber(n, lang) {
  const s = String(n).padStart(2, '0');
  if (lang !== 'ar') return s;
  return s.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
}
