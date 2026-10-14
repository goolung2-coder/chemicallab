// 시약 두 개 사이의 알려진 반응. 키는 정렬된 id 쌍("a+b").
// effect 필드:
//   color       반응 후 용액 색 (없으면 그대로)
//   gas         기체 발생 여부 — 'toxic'이면 유독 기체
//   gasName     발생 기체 이름
//   precipitate 앙금 색
//   coat        금속 표면에 석출되는 물질 색
//   temp        'cool' | 'same' | 'warm' | 'hot'
//   danger      'safe' | 'caution' | 'danger'
const R = {};
const add = (a, b, r) => { R[[a, b].sort().join('+')] = r; };

// ── 산 + 탄산염 ─────────────────────────────
add('vinegar', 'bakingsoda', {
  title: '식초 + 베이킹소다 → 이산화탄소 발생',
  equation: 'CH₃COOH + NaHCO₃ → CH₃COONa + H₂O + CO₂↑',
  explanation: '산(H⁺)이 탄산수소 이온과 만나 탄산이 되고, 탄산은 곧바로 물과 이산화탄소로 분해된다. 그래서 거품이 부글부글 올라온다.',
  effect: { gas: true, gasName: 'CO₂', temp: 'cool', danger: 'safe' },
});
add('hcl', 'bakingsoda', {
  title: '염산 + 베이킹소다 → 이산화탄소 발생',
  equation: 'HCl + NaHCO₃ → NaCl + H₂O + CO₂↑',
  explanation: '강한 산이라 식초보다 더 빠르게 이산화탄소가 나온다. 남는 용액은 소금물이다.',
  effect: { gas: true, gasName: 'CO₂', temp: 'same', danger: 'caution' },
});

// ── 중화 반응 ─────────────────────────────
add('hcl', 'naoh', {
  title: '염산 + 수산화나트륨 → 중화 반응',
  equation: 'HCl + NaOH → NaCl + H₂O',
  explanation: 'H⁺와 OH⁻가 만나 물이 되는 중화 반응. 열이 나는 발열 반응이며, 정확히 같은 양이면 중성 소금물이 된다. 지시약을 넣으면 변화를 눈으로 볼 수 있다.',
  effect: { temp: 'warm', danger: 'caution' },
});
add('vinegar', 'naoh', {
  title: '아세트산 + 수산화나트륨 → 중화 반응',
  equation: 'CH₃COOH + NaOH → CH₃COONa + H₂O',
  explanation: '약산과 강염기의 중화. 아세트산나트륨과 물이 생긴다.',
  effect: { temp: 'warm', danger: 'caution' },
});
add('hcl', 'nh3', {
  title: '염산 + 암모니아 → 염화암모늄',
  equation: 'HCl + NH₃ → NH₄Cl',
  explanation: '산과 염기의 중화. 두 용액의 증기가 공기 중에서 만나면 하얀 연기(염화암모늄 고체)가 생기기도 한다.',
  effect: { temp: 'warm', danger: 'caution' },
});

// ── 금속 + 산 ─────────────────────────────
add('zn', 'hcl', {
  title: '아연 + 염산 → 수소 기체 발생',
  equation: 'Zn + 2HCl → ZnCl₂ + H₂↑',
  explanation: '아연이 수소보다 반응성이 커서 산의 H⁺에게 전자를 주고, 수소 기체가 생긴다. 수소는 불이 붙으면 "퍽" 소리를 내며 탄다.',
  effect: { gas: true, gasName: 'H₂', temp: 'warm', danger: 'caution' },
});
add('mg', 'hcl', {
  title: '마그네슘 + 염산 → 격렬한 수소 발생',
  equation: 'Mg + 2HCl → MgCl₂ + H₂↑',
  explanation: '마그네슘은 아연보다 반응성이 커서 훨씬 빠르고 뜨겁게 반응한다. 금속 리본이 점점 녹아 없어진다.',
  effect: { gas: true, gasName: 'H₂', temp: 'hot', danger: 'caution' },
});
add('mg', 'vinegar', {
  title: '마그네슘 + 식초 → 수소 발생',
  equation: 'Mg + 2CH₃COOH → Mg(CH₃COO)₂ + H₂↑',
  explanation: '약한 산이라도 반응성 큰 마그네슘과는 천천히 수소를 낸다.',
  effect: { gas: true, gasName: 'H₂', temp: 'warm', danger: 'safe' },
});
add('zn', 'vinegar', {
  title: '아연 + 식초 → 아주 느린 수소 발생',
  equation: 'Zn + 2CH₃COOH → Zn(CH₃COO)₂ + H₂↑',
  explanation: '약산이라 기포가 아주 천천히 조금씩 생긴다.',
  effect: { gas: true, gasName: 'H₂', temp: 'same', danger: 'safe' },
});

// ── 금속 치환 ─────────────────────────────
add('fe', 'cuso4', {
  title: '쇠못 + 황산구리 → 구리 석출',
  equation: 'Fe + CuSO₄ → FeSO₄ + Cu',
  explanation: '철이 구리보다 반응성이 커서 구리 이온에게 전자를 준다. 못 표면에 붉은 구리가 입혀지고, 파란 용액은 점점 옅은 초록빛으로 바뀐다.',
  effect: { color: '#9cc9a8', coat: '#b4562d', temp: 'same', danger: 'safe' },
});
add('zn', 'cuso4', {
  title: '아연 + 황산구리 → 구리 석출',
  equation: 'Zn + CuSO₄ → ZnSO₄ + Cu',
  explanation: '아연이 구리 이온을 밀어내고 이온이 된다. 파란색이 점점 사라지고 아연 표면이 붉은 갈색으로 덮인다.',
  effect: { color: '#d9ecf2', coat: '#b4562d', temp: 'warm', danger: 'safe' },
});
add('mg', 'cuso4', {
  title: '마그네슘 + 황산구리 → 구리 석출',
  equation: 'Mg + CuSO₄ → MgSO₄ + Cu',
  explanation: '반응성 차이가 커서 빠르게 반응하고 열도 난다.',
  effect: { color: '#d9ecf2', coat: '#b4562d', temp: 'hot', danger: 'caution' },
});

// ── 앙금 생성 ─────────────────────────────
add('agno3', 'nacl', {
  title: '질산은 + 소금물 → 흰색 앙금 (AgCl)',
  equation: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃',
  explanation: '은 이온과 염화 이온이 만나 물에 녹지 않는 염화은이 생긴다. 물속에 염화 이온이 있는지 확인하는 대표 실험이다.',
  effect: { precipitate: '#f5f5f5', color: '#eef2f4', temp: 'same', danger: 'caution' },
});
add('agno3', 'hcl', {
  title: '질산은 + 염산 → 흰색 앙금 (AgCl)',
  equation: 'AgNO₃ + HCl → AgCl↓ + HNO₃',
  explanation: '염산에도 염화 이온이 있어서 똑같이 흰 앙금이 생긴다.',
  effect: { precipitate: '#f5f5f5', color: '#eef2f4', temp: 'same', danger: 'caution' },
});
add('agno3', 'ki', {
  title: '질산은 + 아이오딘화칼륨 → 노란 앙금 (AgI)',
  equation: 'AgNO₃ + KI → AgI↓ + KNO₃',
  explanation: '아이오딘화은은 노란색 앙금이다. 할로젠 이온마다 은 앙금의 색이 달라서 구별에 쓰인다.',
  effect: { precipitate: '#f1df6a', color: '#f7f2cf', temp: 'same', danger: 'caution' },
});
add('cuso4', 'naoh', {
  title: '황산구리 + 수산화나트륨 → 파란 앙금',
  equation: 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄',
  explanation: '구리 이온과 수산화 이온이 만나 젤리 같은 파란색 수산화구리 앙금이 생긴다.',
  effect: { precipitate: '#4f9fe8', color: '#cfe4f7', temp: 'same', danger: 'caution' },
});
add('cuso4', 'nh3', {
  title: '황산구리 + 암모니아수 → 짙은 남색 착이온',
  equation: 'Cu²⁺ + 4NH₃ → [Cu(NH₃)₄]²⁺',
  explanation: '처음에는 연한 파란 앙금이 생기지만, 암모니아가 더 들어가면 구리 이온을 감싸는 착이온이 되어 아주 진한 남색 용액으로 바뀐다.',
  effect: { color: '#1f2fa8', temp: 'same', danger: 'caution' },
});
add('cuso4', 'ki', {
  title: '황산구리 + 아이오딘화칼륨 → 갈색 아이오딘',
  equation: '2Cu²⁺ + 4I⁻ → 2CuI↓ + I₂',
  explanation: '구리 이온이 아이오딘화 이온을 산화시켜 갈색의 아이오딘이 생기고, 흰색 아이오딘화구리(I) 앙금도 생긴다.',
  effect: { color: '#8a5418', precipitate: '#e9e2d6', temp: 'same', danger: 'caution' },
});

// ── 분해 반응 ─────────────────────────────
add('h2o2', 'ki', {
  title: '과산화수소 + 아이오딘화칼륨 → 산소 폭발적 발생',
  equation: '2H₂O₂ —(I⁻ 촉매)→ 2H₂O + O₂↑',
  explanation: 'I⁻가 촉매가 되어 과산화수소가 순식간에 물과 산소로 분해된다. 열이 많이 나고, 주방세제가 있으면 산소가 거품에 갇혀 "코끼리 치약"이 된다. 실제로는 뜨거운 거품과 고농도 과산화수소 때문에 화상 위험이 있어 선생님 지도 아래에서만 한다.',
  effect: { gas: true, gasName: 'O₂', color: '#e7c27a', temp: 'hot', danger: 'caution' },
});

// ── 절대 섞으면 안 되는 조합 ─────────────────
add('bleach', 'nh3', {
  title: '⛔ 락스 + 암모니아 → 유독한 클로라민 기체',
  equation: 'NaClO + NH₃ → NH₂Cl + NaOH',
  explanation: '클로라민 기체가 생겨 기침, 호흡 곤란, 폐 손상을 일으킨다. 락스와 암모니아가 든 세제(유리 세정제 등)를 함께 쓰는 사고가 실제로 자주 일어난다.',
  safety: '현실에서 절대 섞지 마세요. 실수로 섞었다면 즉시 그 자리를 떠나 환기하고, 증상이 있으면 119에 연락하세요.',
  effect: { gas: 'toxic', gasName: 'NH₂Cl (클로라민)', temp: 'warm', danger: 'danger' },
});
add('bleach', 'hcl', {
  title: '⛔ 락스 + 산 → 유독한 염소 기체',
  equation: 'NaClO + 2HCl → NaCl + H₂O + Cl₂↑',
  explanation: '노란 초록빛 염소 기체가 생긴다. 염소는 눈·코·폐를 심하게 손상시킨다. 락스와 산성 세제(욕실용 등)를 함께 쓰면 이런 사고가 난다.',
  safety: '현실에서 절대 섞지 마세요. "섞으면 위험" 표시가 있는 세제끼리는 함께 쓰지 않습니다.',
  effect: { gas: 'toxic', gasName: 'Cl₂ (염소)', color: '#e6f09a', temp: 'same', danger: 'danger' },
});
add('bleach', 'vinegar', {
  title: '⛔ 락스 + 식초 → 유독한 염소 기체',
  equation: 'NaClO + 2CH₃COOH → NaCl + H₂O + Cl₂↑ + …',
  explanation: '식초 같은 약한 산도 락스와 섞이면 염소 기체를 낸다. "천연 세제"라도 락스와 섞으면 안전하지 않다.',
  safety: '현실에서 절대 섞지 마세요. 청소할 때는 한 번에 한 가지 세제만 쓰고 환기하세요.',
  effect: { gas: 'toxic', gasName: 'Cl₂ (염소)', temp: 'same', danger: 'danger' },
});
add('bleach', 'h2o2', {
  title: '⚠️ 락스 + 과산화수소 → 산소 급격히 발생',
  equation: 'NaClO + H₂O₂ → NaCl + H₂O + O₂↑',
  explanation: '두 산화제가 서로 반응해 산소가 갑자기 많이 나오고 열이 난다. 밀폐된 용기라면 터질 수 있다.',
  safety: '산화제끼리는 섞지 않습니다.',
  effect: { gas: true, gasName: 'O₂', temp: 'hot', danger: 'danger' },
});

export function findReaction(a, b) {
  return R[[a, b].sort().join('+')] || null;
}
