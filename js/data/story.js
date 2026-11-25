/**
 * SINGLE SOURCE OF TRUTH for the story.
 *
 * Timestamps were verified against the source footage (frame-level checks):
 *  - Chapter boundaries: scene-cut detection + boundary contact sheets.
 *  - Final out-point: the Cheshire grin holds cleanly until 185.583s; the
 *    promotional book wipe begins at ~185.625s. The web cut is 185.61s.
 *
 * English and Arabic share IDENTICAL timestamps. Only text changes.
 */

export const VIDEO_END = 185.61;

export const CHAPTERS = [
  {
    id: 'c1',
    start: 0,
    end: 18.46,
    mood: 'mystery',
    focusX: 50,
    notePlacement: 'top',
    focus: '50% 40%',
    title: {
      en: 'The Fall into Wonderland',
      ar: 'السقوط إلى بلاد العجائب',
    },
    short: { en: 'The Fall', ar: 'السقوط' },
    intro: {
      en: 'A pale-haired girl falls through a swirling vortex of cards, teacups, keys and clocks.',
      ar: 'فتاةٌ شاحبة الشعر تهوي عبر دوامةٍ من أوراق اللعب والفناجين والمفاتيح والساعات.',
    },
    checkpoints: [
      {
        t: 13.0,
        en: 'She falls through a wound in the dark. Cards, teacups, keys and clocks had swirled around her like pieces of a world that has forgotten its order. Far below, the spires wait in silence. Wonderland is not opening its doors to her. It is pulling her in.',
        ar: 'تهوي عبر شقٍّ في العتمة، ودارت حولها أوراق اللعب والفناجين والمفاتيح والساعات، شظايا عالمٍ اختلّ نظامه. وفي الأسفل تنتظر الأبراج في صمت. لم تفتح بلاد العجائب أبوابها لها… بل ابتلعتها.',
      },
    ],
  },
  {
    id: 'c2',
    start: 18.46,
    end: 45.08,
    mood: 'uncanny',
    focusX: 50,
    notePlacement: 'bottom',
    focus: '50% 45%',
    title: {
      en: 'Memories in Crimson',
      ar: 'ذكريات بالقرمزي',
    },
    short: { en: 'Memories', ar: 'ذكريات' },
    intro: {
      en: 'A red-lit darkroom. Old photographs hang on lines, and Alice stands among them.',
      ar: 'غرفةٌ حمراء تتدلّى فيها صورٌ قديمة من الحبال، وأليس تقف بينها.',
    },
    checkpoints: [
      {
        t: 24.0,
        en: 'In a room washed in crimson, photographs hang in the dark like evidence of a life Alice cannot quite remember. Figures and moments stay trapped behind their frames.',
        ar: 'في غرفةٍ غمرها الضوء القاني، تتدلّى الصور كأنها أدلّة على حياةٍ لا تتذكّرها أليس كاملة. شخوصٌ ولحظاتٌ حُبست خلف الإطارات.',
      },
      {
        t: 40.8,
        en: 'Then one message rises from the red: MERRY UN-BIRTHDAY. A greeting that carries the chill of a warning.',
        ar: 'ثم تبرز العبارة من قلب الحمرة: MERRY UN-BIRTHDAY. تهنئةٌ يسري فيها برد الإنذار.',
      },
    ],
  },
  {
    id: 'c3',
    start: 45.08,
    end: 83.0,
    mood: 'grief',
    focusX: 32,
    notePlacement: 'bottom',
    focus: '50% 50%',
    title: {
      en: 'Wonderland in Ruins',
      ar: 'بلاد العجائب في الخراب',
    },
    short: { en: 'Ruins', ar: 'الخراب' },
    intro: {
      en: 'A dark bridge crosses a silent city.',
      ar: 'جسرٌ معتم يعبر مدينةً صامتة.',
    },
    checkpoints: [
      {
        t: 62.0,
        en: 'Past the bridge, the path gives way to dark water and a shore strewn with fragments. A lone figure crosses the water. Wonderland reveals the cost of its silence.',
        ar: 'بعد الجسر، ينفتح الطريق على ماءٍ معتم وشاطئٍ تناثرت عليه الأنقاض. تعبره شخصيةٌ وحيدة، وكأن بلاد العجائب تكشف ثمن صمتها.',
      },
      {
        t: 81.0,
        en: 'Earlier, pale figures stood beneath the trees. Now a still body rests in a flower-lined coffin, and a dark figure stands beside it. Even grief has learned to keep quiet here.',
        ar: 'قبل قليل، وقفت كائناتٌ شاحبة تحت الأشجار. والآن يرقد جسدٌ ساكن في تابوتٍ تحفّه الورود، وإلى جواره ظلٌّ يقف في صمت. حتى الحزن هنا تعلّم ألّا يرفع صوته.',
      },
    ],
  },
  {
    id: 'c4',
    start: 83.0,
    end: 141.79,
    mood: 'chaos',
    focusX: 58,
    notePlacement: 'bottom',
    focus: '50% 50%',
    title: {
      en: 'The War for Time',
      ar: 'الحرب على الزمن',
    },
    short: { en: 'Time', ar: 'الزمن' },
    intro: {
      en: 'Giant clock faces turn above winding stairways, inside a red swirl of time.',
      ar: 'ساعاتٌ عملاقة تدور فوق سلالمَ ملتوية، داخل دوامةٍ قرمزية من الزمن.',
    },
    checkpoints: [
      {
        t: 96.0,
        en: 'Time no longer keeps a straight road. Enormous clock faces have turned above winding stairways. Now a pale-haired figure stands before a crowd gathering in the red light.',
        ar: 'لم يعد الزمن يسير في طريقٍ مستقيم؛ دارت فوق السلالم الملتوية ساعاتٌ عملاقة. والآن تقف شخصيةٌ شاحبة الشعر أمام حشدٍ يتجمّع في الضوء القاني.',
      },
      {
        t: 133.0,
        en: 'A queen-like presence rises above the court, and rows of card-shaped guards close in. The kingdom is no longer simply lost. It is being contested, piece by piece.',
        ar: 'تعلو هيئةٌ ملكية فوق البلاط، وتنتظم أوراق اللعب في صفوفٍ كأنها حرسٌ يضيّق الخناق. لم تعد المملكة ضائعةً فحسب، بل صار ما تبقّى منها موضع صراع.',
      },
    ],
  },
  {
    id: 'c5',
    start: 141.79,
    end: 161.62,
    mood: 'urgent',
    focusX: 30,
    notePlacement: 'top',
    focus: '50% 50%',
    title: {
      en: 'Running Out of Time',
      ar: 'الوقت ينفد',
    },
    short: { en: 'Chase', ar: 'المطاردة' },
    intro: {
      en: 'A white rabbit runs up impossible stairs, and Alice follows.',
      ar: 'أرنبٌ أبيض يصعد سلالمَ مستحيلة، وأليس تلحق به.',
    },
    checkpoints: [
      {
        t: 147.0,
        en: 'Then the white rabbit breaks away across impossible stairs. Alice follows as lightning cuts through the chase. Every step takes her farther into the maze, and closer to whatever waits at its end.',
        ar: 'ثم ينطلق الأرنب الأبيض عبر سلالمَ لا تستقرّ، وتلاحقه أليس وسط ومضات البرق. وكل خطوةٍ تأخذها أبعد في المتاهة، وأقرب إلى ما ينتظرها في نهايتها.',
      },
    ],
  },
  {
    id: 'c6',
    start: 161.62,
    end: VIDEO_END,
    mood: 'unease',
    focusX: 50,
    notePlacement: 'top',
    focus: '50% 50%',
    title: {
      en: 'The Last Reflection',
      ar: 'الانعكاس الأخير',
    },
    short: { en: 'Reflection', ar: 'الانعكاس' },
    intro: {
      en: 'The chase ends in a red haze.',
      ar: 'تنتهي المطاردة في ضبابٍ قرمزي.',
    },
    checkpoints: [
      {
        t: 172.0,
        en: 'The chase ends before a towering court, and a gallery of framed images opens beyond it. Each picture holds a fragment that refuses to explain itself.',
        ar: 'تنتهي المطاردة أمام قاعةٍ شاهقة، ويمتد خلفها معرضٌ من الإطارات، وكل إطارٍ يحمل شظيةً ترفض أن تفسّر نفسها.',
      },
      {
        t: 183.4,
        en: 'In the mirror room, a hand reaches toward a reflection that no longer keeps its shape. The glass fractures, and the world falls away.',
        ar: 'في غرفة المرآة، تمتدّ يدٌ نحو انعكاسٍ لم يعد يحتفظ بملامحه. يتشقق الزجاج، ويتلاشى العالم.',
      },
      {
        // Final hold: the grin. No parchment; the ending card takes over.
        t: VIDEO_END,
        final: true,
        en: '',
        ar: '',
      },
    ],
  },
];

export const ENDING = {
  en: 'To be continued…',
  ar: 'يتبع…',
};
