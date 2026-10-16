// 비밀번호 잠금 화면. 코드에는 비밀번호가 아니라 SHA-256 해시만 저장한다.
// 비밀번호 바꾸기: SHA-256("chemlab:" + 새 비밀번호) 값을 PASSWORD_HASH에 넣는다.
// 정적 웹페이지라 소스를 뜯어보는 사람까지 막지는 못한다(README 참고).
const PASSWORD_HASH = '67230f96493047e19237fe1bc17ac050e248b5cee320672e7e073496eb7f711e';
const UNLOCK_KEY = 'chemlab.unlocked';

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function remembered() {
  try { return localStorage.getItem(UNLOCK_KEY) === PASSWORD_HASH; } catch { return false; }
}

function show(unlocked) {
  document.getElementById('lock').hidden = unlocked;
  document.getElementById('app').hidden = !unlocked;
  if (!unlocked) setTimeout(() => document.getElementById('lock-input').focus(), 0);
}

export function setupLock() {
  const form = document.getElementById('lock-form');
  const input = document.getElementById('lock-input');
  const error = document.getElementById('lock-error');
  show(remembered());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    if (!crypto?.subtle) {
      error.textContent = '이 브라우저에서는 잠금을 확인할 수 없어요. https 주소로 열어 주세요.';
      return;
    }
    const ok = (await sha256(`chemlab:${input.value}`)) === PASSWORD_HASH;
    if (!ok) {
      error.textContent = '비밀번호가 맞지 않아요. 선생님께 받은 비밀번호를 다시 확인하세요.';
      input.select();
      return;
    }
    input.value = '';
    if (document.getElementById('lock-remember').checked) {
      try { localStorage.setItem(UNLOCK_KEY, PASSWORD_HASH); } catch { /* 저장 불가 — 이번만 열기 */ }
    }
    show(true);
  });

  document.getElementById('btn-lock').addEventListener('click', () => {
    try { localStorage.removeItem(UNLOCK_KEY); } catch { /* 무시 */ }
    show(false);
  });
}
