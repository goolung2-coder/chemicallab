// 시약 선반에 놓이는 가상 시약 목록.
// ph: 'acid' | 'base' | 'neutral' — 지시약 색을 계산할 때 쓴다.
// hazards: GHS 경고 분류를 단순화한 표시.
export const HAZARDS = {
  corrosive: { label: '부식성', icon: '🧪' },
  oxidizer: { label: '산화성', icon: '🔥' },
  toxic: { label: '독성', icon: '☠️' },
  irritant: { label: '자극성', icon: '⚠️' },
  flammable: { label: '인화성', icon: '♨️' },
  environment: { label: '환경유해', icon: '🐟' },
};

export const CHEMICALS = [
  { id: 'water', name: '물', formula: 'H₂O', state: 'liquid', color: '#cfe9ff', ph: 'neutral', hazards: [],
    info: '가장 흔한 용매. 많은 물질을 녹인다.' },
  { id: 'vinegar', name: '식초 (아세트산)', formula: 'CH₃COOH', state: 'liquid', color: '#f3f0e0', ph: 'acid', hazards: ['irritant'],
    info: '약한 산. 부엌에서 흔히 쓰인다.' },
  { id: 'hcl', name: '묽은 염산', formula: 'HCl', state: 'liquid', color: '#eef6f2', ph: 'acid', hazards: ['corrosive', 'irritant'],
    info: '강한 산. 금속과 반응해 수소 기체를 낸다. 피부·눈에 닿으면 위험.' },
  { id: 'naoh', name: '묽은 수산화나트륨', formula: 'NaOH', state: 'liquid', color: '#f2f2f7', ph: 'base', hazards: ['corrosive'],
    info: '강한 염기. 단백질을 녹여 피부에 화상을 입힐 수 있다.' },
  { id: 'nh3', name: '암모니아수', formula: 'NH₃(aq)', state: 'liquid', color: '#f0f5ff', ph: 'base', hazards: ['corrosive', 'irritant', 'environment'],
    info: '약한 염기. 자극적인 냄새가 난다. 표백제와 절대 섞으면 안 된다.' },
  { id: 'bleach', name: '락스 (차아염소산나트륨)', formula: 'NaClO', state: 'liquid', color: '#f7fbd9', ph: 'base', hazards: ['corrosive', 'oxidizer', 'environment'],
    info: '가정용 표백제. 산이나 암모니아와 섞으면 유독 기체가 생긴다.' },
  { id: 'bakingsoda', name: '베이킹소다', formula: 'NaHCO₃', state: 'solid', color: '#ffffff', ph: 'base', hazards: [],
    info: '탄산수소나트륨. 산과 만나면 이산화탄소를 낸다.' },
  { id: 'nacl', name: '소금물', formula: 'NaCl(aq)', state: 'liquid', color: '#e8f4ff', ph: 'neutral', hazards: [],
    info: '염화나트륨 수용액. 염화 이온(Cl⁻)을 가지고 있다.' },
  { id: 'agno3', name: '질산은 용액', formula: 'AgNO₃', state: 'liquid', color: '#f4f4f4', ph: 'neutral', hazards: ['corrosive', 'oxidizer', 'environment'],
    info: '은 이온(Ag⁺) 검출에 쓰인다. 피부에 닿으면 검게 변색된다.' },
  { id: 'cuso4', name: '황산구리 용액', formula: 'CuSO₄', state: 'liquid', color: '#3d8fe0', ph: 'neutral', hazards: ['irritant', 'environment'],
    info: '구리 이온(Cu²⁺) 때문에 파란색을 띤다.' },
  { id: 'ki', name: '아이오딘화칼륨 용액', formula: 'KI', state: 'liquid', color: '#f7f7f0', ph: 'neutral', hazards: ['irritant'],
    info: '아이오딘화 이온(I⁻)을 가진다. 과산화수소 분해의 촉매로도 쓰인다.' },
  { id: 'h2o2', name: '과산화수소 (농도 높음)', formula: 'H₂O₂', state: 'liquid', color: '#f1fbff', ph: 'neutral', hazards: ['oxidizer', 'corrosive'],
    info: '강한 산화제. 촉매가 있으면 물과 산소로 빠르게 분해된다.' },
  { id: 'soap', name: '주방세제', formula: '계면활성제', state: 'liquid', color: '#b8f0c8', ph: 'neutral', hazards: [],
    info: '거품을 만들고 기체를 가둔다.' },
  { id: 'zn', name: '아연 조각', formula: 'Zn', state: 'metal', color: '#a9b3bd', ph: 'neutral', hazards: ['environment'],
    info: '반응성이 중간 정도인 금속.' },
  { id: 'mg', name: '마그네슘 리본', formula: 'Mg', state: 'metal', color: '#d7dbe0', ph: 'neutral', hazards: ['flammable'],
    info: '반응성이 큰 금속. 산과 격렬하게 반응한다.' },
  { id: 'fe', name: '쇠못', formula: 'Fe', state: 'metal', color: '#6f6a66', ph: 'neutral', hazards: [],
    info: '철. 구리보다 반응성이 커서 구리 이온을 밀어낸다.' },
  { id: 'php', name: '페놀프탈레인', formula: 'C₂₀H₁₄O₄', state: 'liquid', color: '#fafafa', ph: 'neutral', hazards: ['irritant'], indicator: true,
    info: '지시약. 산성·중성에서는 무색, 염기성에서는 분홍색.' },
  { id: 'cabbage', name: '적양배추 지시약', formula: '안토시아닌', state: 'liquid', color: '#7b4fa8', ph: 'neutral', hazards: [], indicator: true,
    info: '천연 지시약. 산성에서 빨강, 중성 보라, 염기성에서 초록~노랑.' },
];

export const byId = Object.fromEntries(CHEMICALS.map((c) => [c.id, c]));
