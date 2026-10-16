// Claude AI 연구 조교. SDK는 AI 기능을 처음 쓸 때만 불러오므로
// 인터넷/API 키가 없어도 기본 가상 실험실은 그대로 동작한다.
const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.129.0/+esm';
const MODEL = 'claude-opus-5-5';
const KEY_STORAGE = 'chemlab.apiKey';

const SYSTEM_PROMPT = `너는 "나만의 AI 화학실험실" 앱의 화학 선생님 조교야. 사용자는 주로 중·고등학생이고, 진짜 시약 대신 가상 실험실에서 안전하게 실험해.

원칙:
- 한국어로, 학생 눈높이에 맞게 짧고 명확하게 설명해. 화학 반응식은 가능하면 함께 보여 줘.
- 이 앱은 시뮬레이션이야. 학생이 현실에서 따라 하도록 시약 농도·양·구입처·장비 같은 실행 절차를 안내하지 마. 꼭 해 보고 싶다면 선생님이나 보호자의 지도 아래 학교 실험실에서 하라고 권해.
- 위험한 조합(예: 락스+암모니아, 락스+산)을 물어보면 왜 위험한지, 어떤 증상이 생기는지, 사고가 났을 때 어떻게 대처하는지 알려 줘. 이것은 중요한 안전 교육이야.
- 폭발물, 화학 무기, 유독 기체를 일부러 만드는 방법, 마약 합성처럼 사람을 해칠 수 있는 정보는 제공하지 말고, 대신 관련된 원리나 안전 지식으로 대화를 돌려.`;

let clientPromise = null;

export function getApiKey() {
  try { return localStorage.getItem(KEY_STORAGE) || ''; } catch { return ''; }
}

export function setApiKey(key) {
  clientPromise = null;
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key);
    else localStorage.removeItem(KEY_STORAGE);
  } catch { /* 저장 불가 환경 — 이번 세션만 사용 */ }
  sessionKey = key;
}

let sessionKey = getApiKey();

export function hasApiKey() {
  return Boolean(sessionKey);
}

// claude.ai 아티팩트로 열렸을 때는 보는 사람의 Claude 계정으로 AI를 쓴다(API 키 불필요).
// 그 밖의 곳에서는 null이 되어 API 키 방식으로 돌아간다.
const samplePromise = window.claude?.use
  ? window.claude.use('sample').catch(() => null)
  : Promise.resolve(null);

// 'claude' | 'api' | null — 지금 쓸 수 있는 AI 연결 방식
export async function mode() {
  if (await samplePromise) return 'claude';
  return sessionKey ? 'api' : null;
}

const SAMPLE_ERRORS = {
  not_granted: 'Claude 사용을 허용하지 않아서 AI 기능을 쓸 수 없어요.',
  sampling_disabled: '이 계정에서는 Claude를 쓸 수 없어요.',
  rate_limited: '요청이 너무 많아요. 잠시 후 다시 시도하세요.',
  session_expired: 'Claude에 다시 로그인해 주세요.',
  invalid_json: 'AI가 결과를 형식에 맞게 만들지 못했어요. 다시 시도하세요.',
  empty_completion: 'AI가 답을 만들지 못했어요. 질문을 바꿔 보세요.',
};
const sampleError = (e) => SAMPLE_ERRORS[e?.code] || 'AI 연결에 문제가 생겼어요. 잠시 후 다시 시도하세요.';

async function getClient() {
  if (!sessionKey) throw new Error('API 키가 설정되지 않았습니다. 오른쪽 위 ⚙️ 설정에서 입력하세요.');
  if (!clientPromise) {
    clientPromise = import(SDK_URL).then(({ default: Anthropic }) =>
      // 학습용 개인 앱이라 사용자의 키로 브라우저에서 직접 호출한다.
      new Anthropic({ apiKey: sessionKey, dangerouslyAllowBrowser: true }));
    clientPromise.catch(() => { clientPromise = null; });
  }
  return clientPromise;
}

function friendlyError(err) {
  const status = err?.status;
  if (status === 401) return 'API 키가 올바르지 않습니다. 설정에서 다시 확인하세요.';
  if (status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도하세요.';
  if (status >= 500) return 'AI 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도하세요.';
  if (err?.message?.includes('Failed to fetch') || err?.message?.includes('import')) {
    return '인터넷 연결을 확인하세요.';
  }
  return err?.message || '알 수 없는 오류가 발생했습니다.';
}

const REFUSAL_TEXT = '이 질문은 안전상의 이유로 답할 수 없어요. 반응의 원리나 안전 수칙에 대해 물어봐 주세요.';

// 대화형 질문. onText로 답변이 실시간으로 흘러 들어온다.
export async function chat(history, onText) {
  const sample = await samplePromise;
  if (sample) {
    try {
      let seen = '';
      const { text } = await sample([{ role: 'user', content: SYSTEM_PROMPT }, ...history], {
        cache: false,
        onText: ({ text: whole }) => { onText(whole.slice(seen.length)); seen = whole; },
      });
      return { text };
    } catch (e) {
      if (e?.code === 'refused') return { refused: true, text: REFUSAL_TEXT };
      return { error: sampleError(e) };
    }
  }
  try {
    const client = await getClient();
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: SYSTEM_PROMPT,
      messages: history,
    });
    stream.on('text', onText);
    const message = await stream.finalMessage();
    if (message.stop_reason === 'refusal') return { refused: true, text: REFUSAL_TEXT };
    const text = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    return { text };
  } catch (err) {
    return { error: friendlyError(err) };
  }
}

const PREDICTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['reaction_occurs', 'title', 'equation', 'explanation', 'safety_note',
    'solution_color', 'gas', 'gas_name', 'toxic_gas', 'precipitate_color', 'temperature', 'danger_level',
    'products', 'reaction_type', 'learning_point'],
  properties: {
    reaction_occurs: { type: 'boolean' },
    title: { type: 'string', description: '한 줄 요약 (예: "A + B → 흰색 앙금")' },
    equation: { type: 'string', description: '화학 반응식. 반응이 없으면 빈 문자열' },
    explanation: { type: 'string', description: '학생용 원리 설명 2~4문장' },
    safety_note: { type: 'string', description: '현실에서 주의할 점. 실행 절차나 양은 쓰지 말 것' },
    solution_color: { type: 'string', description: '반응 후 용액 색, #rrggbb 형식' },
    gas: { type: 'boolean' },
    gas_name: { type: 'string', description: '발생 기체 이름, 없으면 빈 문자열' },
    toxic_gas: { type: 'boolean' },
    precipitate_color: { type: 'string', description: '앙금 색 #rrggbb, 앙금이 없으면 빈 문자열' },
    temperature: { type: 'string', enum: ['cool', 'same', 'warm', 'hot'] },
    danger_level: { type: 'string', enum: ['safe', 'caution', 'danger'] },
    products: {
      type: 'array',
      description: '생성물 목록. 반응이 없으면 빈 배열',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['formula', 'name', 'state'],
        properties: {
          formula: { type: 'string', description: '화학식 (아래첨자는 ₂ 같은 유니코드)' },
          name: { type: 'string', description: '한국어 이름' },
          state: { type: 'string', enum: ['기체', '앙금', '고체', '수용액', '액체'] },
        },
      },
    },
    reaction_type: {
      type: 'string',
      enum: ['acidCarbonate', 'neutralization', 'metalAcid', 'displacement', 'precipitation', 'complex', 'redox', 'decomposition', 'danger', 'none'],
    },
    learning_point: { type: 'string', description: '이 실험으로 알 수 있는 핵심 개념 한 문장' },
  },
};

const HEX = /^#[0-9a-fA-F]{6}$/;

// 데이터베이스에 없는 조합을 AI가 예측. 결과는 reactions.js와 같은 모양으로 바꿔 돌려준다.
function predictionPrompt(chemicals) {
  const list = chemicals.map((c) => `- ${c.name} (${c.formula})`).join('\n');
  return `가상 비커에 다음 시약(교육용 묽은 용액)을 차례로 넣었어. 실제 화학에 근거해서 무슨 일이 일어나는지 예측해 줘. 반응이 거의 없다면 reaction_occurs를 false로 하고 그냥 섞인 용액 색을 알려 줘.\n${list}`;
}

function toReaction(p) {
  return {
    ai: true,
    none: !p.reaction_occurs,
    title: String(p.title || ''),
    equation: String(p.equation || ''),
    explanation: String(p.explanation || ''),
    safety: String(p.safety_note || ''),
    type: p.reaction_type === 'none' ? undefined : p.reaction_type,
    learn: String(p.learning_point || ''),
    products: (Array.isArray(p.products) ? p.products : [])
      .filter((x) => x && x.formula)
      .slice(0, 8)
      .map((x) => ({ formula: String(x.formula), name: String(x.name || ''), state: String(x.state || '수용액') })),
    effect: {
      color: HEX.test(p.solution_color) ? p.solution_color : null,
      gas: p.gas ? (p.toxic_gas ? 'toxic' : true) : false,
      gasName: String(p.gas_name || ''),
      precipitate: HEX.test(p.precipitate_color) ? p.precipitate_color : null,
      temp: ['cool', 'same', 'warm', 'hot'].includes(p.temperature) ? p.temperature : 'same',
      danger: ['safe', 'caution', 'danger'].includes(p.danger_level) ? p.danger_level : 'caution',
    },
  };
}

// 데이터베이스에 없는 조합을 AI가 예측. 결과는 reactions.js와 같은 모양으로 바꿔 돌려준다.
export async function predictReaction(chemicals) {
  const sample = await samplePromise;
  if (sample) {
    try {
      const fields = Object.entries(PREDICTION_SCHEMA.properties)
        .map(([k, v]) => `- ${k}: ${v.enum ? v.enum.join(' | ') : v.type === 'array' ? '[{formula, name, state: 기체|앙금|고체|수용액|액체}]' : v.type}${v.description ? ` (${v.description})` : ''}`)
        .join('\n');
      const p = await sample.json(`${SYSTEM_PROMPT}\n\n${predictionPrompt(chemicals)}\n\n다음 필드를 모두 가진 JSON 객체 하나로만 답해:\n${fields}`);
      if (!p || typeof p !== 'object') return { error: SAMPLE_ERRORS.invalid_json };
      return { reaction: toReaction(p) };
    } catch (e) {
      if (e?.code === 'refused') return { error: REFUSAL_TEXT };
      return { error: sampleError(e) };
    }
  }
  try {
    const client = await getClient();
    const message = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: 'medium',
        format: { type: 'json_schema', schema: PREDICTION_SCHEMA },
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: predictionPrompt(chemicals) }],
    });
    if (message.stop_reason === 'refusal') return { error: REFUSAL_TEXT };
    const text = message.content.find((b) => b.type === 'text')?.text;
    if (!text) return { error: 'AI가 결과를 만들지 못했습니다. 다시 시도하세요.' };
    return { reaction: toReaction(JSON.parse(text)) };
  } catch (err) {
    return { error: friendlyError(err) };
  }
}
