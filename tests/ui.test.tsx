import { strict as assert } from 'node:assert';
import { after, afterEach, beforeEach, describe, it } from 'node:test';
import { JSDOM } from 'jsdom';
import type { Photo as PhotoData } from '../src/config/invitation';
import type { MotionPolicy } from '../src/lib/useReveal';

// jsdom은 레이아웃·실제 터치·브라우저 권한·실제 음악 재생을 검증하지 않는다.
// 외부 사이트 접속, SDK 다운로드, 클립보드 권한 우회 없이 UI 상태와 대안을 검증한다.
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://invitation.test/preview',
});
for (const name of [
  'window', 'document', 'navigator', 'HTMLElement', 'HTMLTextAreaElement',
  'HTMLMediaElement', 'Event', 'MouseEvent', 'KeyboardEvent', 'DOMException',
] as const) {
  Object.defineProperty(globalThis, name, {
    configurable: true, writable: true, value: dom.window[name],
  });
}
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
  configurable: true, writable: true, value: true,
});

// React DOMとtesting-libraryはglobal DOMが揃ってから読み込む。
const { render, screen, within, fireEvent, cleanup, waitFor, act } = await import('@testing-library/react');
const { StrictMode } = await import('react');
const { default: App } = await import('../src/App');
const { default: Gallery } = await import('../src/components/Gallery');
const { default: Photo } = await import('../src/components/Photo');
const { invitation } = await import('../src/config/invitation');
const { useReveal } = await import('../src/lib/useReveal');
const baseline = structuredClone(invitation);

const testPhotos: PhotoData[] = [
  { id: 'test-1', src: '/test-1.webp', alt: '검증 사진 1', sample: false },
  { id: 'test-2', src: '/test-2.webp', alt: '검증 사진 2', sample: false },
  { id: 'test-3', src: '/test-3.webp', alt: '검증 사진 3', sample: false },
];
let copied: string[] = [];
let playCalls = 0;
let pauseCalls = 0;
let loadCalls = 0;
let mediaEvents: { action: 'play' | 'pause' | 'load'; src: string | null }[] = [];
const normalTrack = '/synthetic-test-audio.mp3';
const backroomTrack = '/synthetic-backroom-audio.mp3';

function setClipboard(writeText?: (value: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: writeText ? { writeText } : undefined,
  });
}
function setNativeShare(share?: (data: ShareData) => Promise<void>) {
  Object.defineProperty(navigator, 'share', { configurable: true, value: share });
}
function useAccounts(number = '000-0000-0000') {
  invitation.accounts = [{
    id: 'test-group', title: '신랑 측', items: [{
      id: 'test-account', relation: '신랑', name: '검증 신랑',
      bank: '검증 은행', holder: '검증 예금주', number,
      consent: true, sample: false,
    }],
  }];
}
function accountDetails(): HTMLDetailsElement {
  const details = document.querySelector<HTMLDetailsElement>('#accounts details');
  assert.ok(details);
  return details;
}
function openAccounts() {
  const details = accountDetails();
  fireEvent.click(within(details).getByText('신랑 측'));
  assert.equal(details.open, true);
  return details;
}
function enableMusic() {
  invitation.music = {
    src: normalTrack, title: '검증용 음원',
    loop: true, rightsConfirmed: true,
  };
}
function enableBackroom() {
  invitation.backroom = {
    code: 'synthetic-backroom-code',
    music: { src: backroomTrack, title: '검증 비트', loop: true, rightsConfirmed: false },
    photos: structuredClone(testPhotos),
  };
}
function audioElement(): HTMLAudioElement {
  const audio = document.querySelector<HTMLAudioElement>('audio');
  assert.ok(audio);
  return audio;
}

beforeEach(() => {
  delete window.Kakao;
  Object.assign(invitation, structuredClone(baseline));
  // 개인정보·예식 정보는 모두 합성 fixture로 대체한다.
  invitation.couple = { groom: '검증 신랑', bride: '검증 신부', namesConfirmed: true };
  invitation.wedding = {
    confirmed: true, dateTime: '2028-02-29T13:00:00+09:00',
    demoDateTime: '2028-02-29T13:00:00+09:00', durationMinutes: 60,
  };
  invitation.venue = {
    name: '검증 행사 공간', hall: '검증 홀', floor: '1층',
    address: '검증로 1, 검증 구역', confirmed: true,
    lat: null, lng: null, transit: [], parking: [],
  };
  invitation.families = [];
  invitation.contacts = [];
  invitation.accounts = [];
  invitation.privacy = { showContacts: true, showAccounts: true, consentConfirmed: true };
  invitation.photos = {
    hero: { ...testPhotos[0], id: 'test-hero', alt: '검증 대표 사진' },
    gallery: structuredClone(testPhotos),
    closing: { ...testPhotos[2], id: 'test-closing', alt: '검증 마무리 사진' },
  };
  invitation.music = { src: null, title: '검증용 음원', loop: true, rightsConfirmed: false };
  invitation.backroom = undefined;
  invitation.share = {
    siteUrl: 'https://hojeong-sojeong.test', title: '검증 초대',
    description: '함께해 주세요.', image: '/test-og.jpg',
    imageSample: false, kakaoJavaScriptKey: '',
  };
  copied = [];
  playCalls = 0;
  pauseCalls = 0;
  loadCalls = 0;
  mediaEvents = [];
  setClipboard(async value => { copied.push(value); });
  setNativeShare();
  Object.defineProperty(dom.window.HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: function (this: HTMLMediaElement) {
      playCalls += 1;
      mediaEvents.push({ action: 'play', src: this.getAttribute('src') });
      Object.defineProperty(this, 'paused', { configurable: true, writable: true, value: false });
      this.dispatchEvent(new dom.window.Event('play'));
      return Promise.resolve();
    },
  });
  Object.defineProperty(dom.window.HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: function (this: HTMLMediaElement) {
      pauseCalls += 1;
      mediaEvents.push({ action: 'pause', src: this.getAttribute('src') });
      Object.defineProperty(this, 'paused', { configurable: true, writable: true, value: true });
      this.dispatchEvent(new dom.window.Event('pause'));
    },
  });
  Object.defineProperty(dom.window.HTMLMediaElement.prototype, 'load', {
    configurable: true,
    value: function (this: HTMLMediaElement) {
      loadCalls += 1;
      mediaEvents.push({ action: 'load', src: this.getAttribute('src') });
      Object.defineProperty(this, 'paused', { configurable: true, writable: true, value: true });
      this.currentTime = 0;
    },
  });
  document.body.style.overflow = '';
});

afterEach(() => {
  cleanup();
  delete window.Kakao;
  Object.assign(invitation, structuredClone(baseline));
  document.body.style.overflow = '';
});
after(() => { dom.window.close(); });

describe('갤러리 확대창 접근성과 탐색', () => {
  it('main 밖 portal에 열고 배경을 잠그며 탭 포커스·Escape·원래 포커스를 복구한다', () => {
    document.body.style.overflow = 'auto';
    render(<main id="invitation"><Gallery photos={testPhotos} /></main>);
    const trigger = screen.getByRole('button', { name: /사진 1 확대 보기/ });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: '사진 갤러리 확대 보기' });
    const main = document.getElementById('invitation');
    assert.ok(main);
    assert.equal(main.contains(dialog), false, 'dialog 자신이 inert인 main의 자식이면 안 된다.');
    assert.equal(main.inert, true);
    assert.equal(document.body.style.overflow, 'hidden');
    const close = within(dialog).getByRole('button', { name: '닫기' });
    const next = within(dialog).getByRole('button', { name: '다음 사진' });
    assert.ok(document.activeElement === close, '확대창을 열면 닫기 버튼에 포커스한다.');
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    assert.ok(document.activeElement === next, 'Shift+Tab이 마지막 버튼으로 이동한다.');
    fireEvent.keyDown(next, { key: 'Tab' });
    assert.ok(document.activeElement === close, '마지막 버튼의 Tab이 닫기로 돌아온다.');
    fireEvent.keyDown(close, { key: 'Escape' });
    assert.equal(screen.queryByRole('dialog'), null);
    assert.equal(main.inert, false);
    assert.equal(document.body.style.overflow, 'auto');
    assert.ok(document.activeElement === trigger, '닫힌 뒤 원래 사진 버튼에 포커스를 돌려준다.');
  });

  it('좌우키·이전/다음·가로 스와이프를 지원하고 세로 스와이프는 사진을 바꾸지 않는다', () => {
    render(<main id="invitation"><Gallery photos={testPhotos} /></main>);
    fireEvent.click(screen.getByRole('button', { name: /사진 1 확대 보기/ }));
    const dialog = screen.getByRole('dialog');
    const hasPhoto = (number: number) => assert.ok(within(dialog).getByRole('img', { name: '검증 사진 ' + number }));
    hasPhoto(1);
    fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
    hasPhoto(3);
    fireEvent.keyDown(dialog, { key: 'ArrowRight' });
    hasPhoto(1);
    fireEvent.click(within(dialog).getByRole('button', { name: '다음 사진' }));
    hasPhoto(2);
    fireEvent.click(within(dialog).getByRole('button', { name: '이전 사진' }));
    hasPhoto(1);
    const area = dialog.querySelector('.lightbox-photo');
    assert.ok(area);
    fireEvent.touchStart(area, { touches: [{ clientX: 110, clientY: 100 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 20, clientY: 105 }] });
    hasPhoto(2);
    fireEvent.touchStart(area, { touches: [{ clientX: 100, clientY: 110 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 105, clientY: 20 }] });
    hasPhoto(2);
    fireEvent.click(within(dialog).getByRole('button', { name: '닫기' }));
    assert.equal(screen.queryByRole('dialog'), null);
  });

  it('빈 갤러리는 안정적인 안내를 보여주고 확대 버튼을 만들지 않는다', () => {
    render(<Gallery photos={[]} />);
    assert.ok(screen.getByText('함께한 순간들을 곧 담아둘게요.'));
    assert.equal(screen.queryByRole('button'), null);
    assert.equal(screen.queryByRole('dialog'), null);
  });
});

describe('사진 누락과 로딩 실패', () => {
  it('사진 미설정이면 빈 src 대신 이름 있는 대체 화면을 보여준다', () => {
    render(<Photo photo={null} />);
    assert.ok(screen.getByRole('img', { name: '사진 준비 중' }));
    assert.equal(document.querySelector('img'), null);
  });

  it('깨진 사진은 설명을 유지한 대체 화면으로 바꾸고 다른 사진 경로로 교체하면 복구한다', () => {
    const view = render(<Photo key="first" photo={testPhotos[0]} eager />);
    const image = screen.getByRole('img', { name: '검증 사진 1' });
    fireEvent.error(image);
    assert.equal(document.querySelector('img'), null);
    assert.ok(screen.getByRole('img', { name: /검증 사진 1.*사진을 불러오지 못했습니다/ }));
    view.rerender(<Photo key="second" photo={testPhotos[1]} />);
    const replacement = screen.getByRole('img', { name: '검증 사진 2' });
    assert.equal(replacement.getAttribute('src'), '/test-2.webp');
    assert.equal(replacement.getAttribute('loading'), 'lazy');
  });
});

describe('계좌·주소 복사와 수동 대안', () => {
  it('계좌 아코디언을 펼치고 접으며 은행·이름 없이 계좌번호만 복사한다', async () => {
    useAccounts();
    render(<App />);
    const details = accountDetails();
    assert.equal(details.open, false);
    openAccounts();
    fireEvent.click(within(details).getByRole('button', { name: '복사' }));
    await waitFor(() => assert.deepEqual(copied, ['000-0000-0000']));
    await waitFor(() => assert.match(screen.getByRole('status').textContent ?? '', /계좌번호를 복사했어요/));
    fireEvent.click(within(details).getByText('신랑 측'));
    assert.equal(details.open, false);
  });

  it('신랑·신부 계좌 그룹을 독립적으로 펼치고 신부 측 세 이름의 번호만 정확히 복사한다', async () => {
    useAccounts();
    invitation.accounts[0].items.push({
      ...invitation.accounts[0].items[0], id: 'test-groom-parent',
      relation: '신랑 아버지', name: '검증 신랑 부친', holder: '검증 신랑 부친', number: '000-0000-0099',
    });
    const brideAccounts = [
      { name: '검증 신부', relation: '신부', number: '000-0000-0001' },
      { name: '검증 가족 하나', relation: '신부 아버지', number: '000-0000-0002' },
      { name: '검증 가족 둘', relation: '신부 측', number: '000-0000-0003' },
    ];
    invitation.accounts.push({
      id: 'test-bride-group', title: '신부 측',
      items: brideAccounts.map((account, index) => ({
        ...account, id: 'test-bride-account-' + index,
        holder: account.name, bank: '검증 은행', consent: true, sample: false,
      })),
    });
    render(<App />);
    const groups = document.querySelectorAll<HTMLDetailsElement>('#accounts details');
    assert.equal(groups.length, 2);
    const [groom, bride] = groups;
    assert.equal(groom.open, false);
    assert.equal(bride.open, false);
    fireEvent.click(within(bride).getByText('신부 측', { selector: 'summary' }));
    assert.equal(bride.open, true);
    assert.equal(groom.open, false);
    fireEvent.click(within(groom).getByText('신랑 측', { selector: 'summary' }));
    assert.equal(groom.open, true);
    assert.equal(bride.open, true);
    fireEvent.click(within(groom).getByText('신랑 측', { selector: 'summary' }));
    assert.equal(groom.open, false);
    assert.equal(bride.open, true);
    assert.equal(within(bride).getAllByRole('button', { name: '복사' }).length, 3);
    for (const [index, account] of brideAccounts.entries()) {
      const row = within(bride).getByText(account.name).closest<HTMLElement>('.account');
      assert.ok(row);
      assert.ok(within(row).getByText('예금주 ' + account.name));
      const button = within(row).getByRole<HTMLButtonElement>('button', { name: '복사' });
      assert.equal(button.disabled, false);
      await act(async () => { fireEvent.click(button); });
      assert.deepEqual(copied, brideAccounts.slice(0, index + 1).map(item => item.number));
    }
    fireEvent.click(within(bride).getByText('신부 측', { selector: 'summary' }));
    assert.equal(bride.open, false);
    assert.equal(groom.open, false);
  });

  it('샘플·공백 번호·공개 미동의 계좌의 복사 버튼은 비활성화한다', () => {
    useAccounts('   ');
    const account = invitation.accounts[0].items[0];
    invitation.accounts[0].items.push(
      { ...account, id: 'sample', number: '000000000000', sample: true },
      { ...account, id: 'no-consent', number: '000000000000', consent: false },
    );
    render(<App />);
    const details = openAccounts();
    const buttons = within(details).getAllByRole<HTMLButtonElement>('button', { name: '복사' });
    assert.equal(buttons.length, 3);
    for (const button of buttons) {
      assert.equal(button.disabled, true);
      fireEvent.click(button);
    }
    assert.deepEqual(copied, []);
  });

  it('클립보드 거절 시 번호를 직접 선택할 수 있고 좌우키 선택과 Escape 복구를 허용한다', async () => {
    useAccounts();
    setClipboard(async () => { throw new dom.window.DOMException('denied', 'NotAllowedError'); });
    render(<App />);
    const details = openAccounts();
    const trigger = within(details).getByRole('button', { name: '복사' });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: '계좌번호 직접 복사' });
    const textarea = within(dialog).getByLabelText<HTMLTextAreaElement>('계좌번호');
    assert.equal(textarea.value, '000-0000-0000');
    assert.equal(textarea.readOnly, true);
    fireEvent.click(within(dialog).getByRole('button', { name: '내용 선택' }));
    assert.ok(document.activeElement === textarea, '내용 선택 버튼이 텍스트 영역에 포커스한다.');
    assert.equal(textarea.selectionStart, 0);
    assert.equal(textarea.selectionEnd, textarea.value.length);
    const arrow = new dom.window.KeyboardEvent('keydown', {
      key: 'ArrowLeft', shiftKey: true, bubbles: true, cancelable: true,
    });
    fireEvent(textarea, arrow);
    assert.equal(arrow.defaultPrevented, false, '수동 선택에서는 방향키를 가로채면 안 된다.');
    fireEvent.keyDown(textarea, { key: 'Escape' });
    assert.equal(screen.queryByRole('dialog'), null);
    assert.ok(document.activeElement === trigger, '닫힌 뒤 원래 복사 버튼에 포커스를 돌려준다.');
    assert.deepEqual(copied, []);
  });

  it('주소 복사는 예식장명이나 안내 문구를 섞지 않고 설정의 도로명 주소를 그대로 전달한다', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '주소 복사' }));
    await waitFor(() => assert.deepEqual(copied, ['검증로 1, 검증 구역']));
  });

  it('클립보드 API가 없어도 링크 수동 복사 창을 제공한다', async () => {
    setClipboard();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '링크 복사' }));
    const dialog = await screen.findByRole('dialog', { name: '청첩장 링크 직접 복사' });
    assert.equal(within(dialog).getByLabelText<HTMLTextAreaElement>('청첩장 링크').value, invitation.share.siteUrl);
  });
});

describe('음악의 명시적인 재생과 실패 처리', () => {
  it('음원이 없으면 음악 버튼과 audio 요소를 만들지 않는다', () => {
    render(<App />);
    assert.equal(screen.queryByRole('button', { name: /음악|음원|다시 재생/ }), null);
    assert.equal(document.querySelector('.music-button'), null);
    assert.equal(document.querySelector('audio'), null);
    assert.equal(playCalls, 0);
  });

  it('기본 음원은 자동재생하지 않고 사용자가 켠 뒤 스크롤에도 유지되며 끄면 일시정지한다', async () => {
    invitation.music = structuredClone(baseline.music);
    assert.equal(invitation.music.rightsConfirmed, false, 'UI 재생과 공개 권리 검수는 별도로 처리한다.');
    render(<App />);
    const audio = audioElement();
    assert.equal(audio.getAttribute('src'), baseline.music.src);
    assert.equal(audio.loop, true);
    assert.equal(audio.getAttribute('preload'), 'none');
    assert.equal(audio.hasAttribute('autoplay'), false);
    assert.equal(audio.autoplay, false);
    assert.equal(playCalls, 0, '렌더링만으로 소리를 자동 재생하면 안 된다.');
    fireEvent.click(screen.getByRole('button', { name: '음악 켜기' }));
    const stop = await screen.findByRole('button', { name: '음악 끄기' });
    assert.equal(stop.getAttribute('aria-pressed'), 'true');
    assert.equal(playCalls, 1);
    fireEvent.scroll(window);
    assert.equal(pauseCalls, 0);
    fireEvent.click(stop);
    assert.equal(pauseCalls, 1);
    assert.equal(screen.getByRole('button', { name: '음악 켜기' }).getAttribute('aria-pressed'), 'false');
  });

  it('play Promise 거절은 안내와 다시 재생 상태로 처리하고 화면을 유지한다', async () => {
    enableMusic();
    Object.defineProperty(dom.window.HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: () => Promise.reject(new dom.window.DOMException('blocked', 'NotAllowedError')),
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '음악 켜기' }));
    await waitFor(() => assert.match(screen.getByRole('status').textContent ?? '', /음악을 재생하지 못했어요/));
    assert.ok(screen.getByText('다시 재생'));
    assert.equal(screen.getByRole('button', { name: '음악 켜기' }).getAttribute('aria-pressed'), 'false');
    assert.ok(screen.getByRole('heading', { level: 1 }));
  });

  it('파일 오류가 나도 청첩장과 공유 기능을 유지하고 재생 중 상태를 해제한다', async () => {
    enableMusic();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '음악 켜기' }));
    await screen.findByRole('button', { name: '음악 끄기' });
    fireEvent.error(audioElement());
    assert.match(screen.getByRole('status').textContent ?? '', /음악 파일을 불러오지 못했어요/);
    assert.equal(screen.getByRole('button', { name: '음악 켜기' }).getAttribute('aria-pressed'), 'false');
    assert.ok(screen.getByRole('button', { name: '링크 복사' }));
  });
});

describe('BACKROOM 코드 입력과 한 음원의 전환', () => {
  const requestFrame = Object.getOwnPropertyDescriptor(window, 'requestAnimationFrame');
  const cancelFrame = Object.getOwnPropertyDescriptor(window, 'cancelAnimationFrame');
  const globalRequestFrame = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
  const globalCancelFrame = Object.getOwnPropertyDescriptor(globalThis, 'cancelAnimationFrame');
  const scrollTo = Object.getOwnPropertyDescriptor(window, 'scrollTo');
  const scrollY = Object.getOwnPropertyDescriptor(window, 'scrollY');
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;

  function restore(target: object, name: string, descriptor: PropertyDescriptor | undefined) {
    if (descriptor) Object.defineProperty(target, name, descriptor);
    else Reflect.deleteProperty(target, name);
  }
  function finishFrames() {
    for (let count = 0; count < 4 && frames.size; count += 1) {
      const callbacks = [...frames.values()];
      frames.clear();
      act(() => { callbacks.forEach(callback => callback(16)); });
    }
  }
  function normalMain() {
    const main = document.getElementById('invitation');
    assert.ok(main);
    return main;
  }
  function openGate() {
    const trigger = screen.getByRole('button', { name: '시크릿 코드 입력' });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'BACKROOM 입장' });
    const input = within(dialog).getByLabelText<HTMLInputElement>('시크릿 코드');
    return { trigger, dialog, input };
  }
  function unlock() {
    assert.ok(invitation.backroom);
    const gate = openGate();
    fireEvent.change(gate.input, { target: { value: invitation.backroom.code } });
    fireEvent.click(within(gate.dialog).getByRole('button', { name: '입장하기' }));
    return gate.trigger;
  }
  function assertBackroom() {
    assert.equal(normalMain().hidden, true);
    assert.equal(normalMain().getAttribute('aria-hidden'), 'true');
    assert.ok(document.getElementById('backroom'));
    assert.ok(screen.getByRole('heading', { name: /너가 선택한\s*결혼이다\./ }));
    assert.equal(screen.queryByRole('dialog', { name: 'BACKROOM 입장' }), null);
    assert.equal(document.querySelectorAll('audio').length, 1);
  }
  function assertSwitch(from: string, to: string, events = mediaEvents) {
    const pause = events.findIndex(event => event.action === 'pause' && event.src === from);
    const load = events.findIndex(event => event.action === 'load' && event.src === to);
    const play = events.findIndex(event => event.action === 'play' && event.src === to);
    assert.ok(pause >= 0 && load > pause && play > load, '기존 음원 정지 후 새 음원을 불러와 재생한다.');
    assert.equal(events.filter(event => event.action === 'play' && event.src === to).length, 1);
  }

  beforeEach(() => {
    frames.clear();
    nextFrame = 0;
    for (const target of [window, globalThis]) {
      Object.defineProperty(target, 'requestAnimationFrame', {
        configurable: true, writable: true,
        value: (callback: FrameRequestCallback) => { const id = ++nextFrame; frames.set(id, callback); return id; },
      });
      Object.defineProperty(target, 'cancelAnimationFrame', {
        configurable: true, writable: true, value: (id: number) => { frames.delete(id); },
      });
    }
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
    Object.defineProperty(window, 'scrollTo', {
      configurable: true, writable: true,
      value: (first: ScrollToOptions | number, second?: number) => {
        const top = typeof first === 'number' ? second ?? 0 : first.top ?? window.scrollY;
        Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: top });
      },
    });
  });
  afterEach(() => {
    cleanup();
    restore(window, 'requestAnimationFrame', requestFrame);
    restore(window, 'cancelAnimationFrame', cancelFrame);
    restore(globalThis, 'requestAnimationFrame', globalRequestFrame);
    restore(globalThis, 'cancelAnimationFrame', globalCancelFrame);
    restore(window, 'scrollTo', scrollTo);
    restore(window, 'scrollY', scrollY);
    frames.clear();
  });

  it('기능 미설정에서는 입구가 없고 잘못된 코드는 화면이나 비트 재생을 시작하지 않는다', () => {
    render(<App />);
    assert.ok(screen.queryByRole('button', { name: '시크릿 코드 입력' }) === null);
    cleanup();
    enableBackroom();
    render(<App />);
    const audio = audioElement();
    assert.equal(audio.getAttribute('src'), null, 'A가 없어도 B를 나중에 재생할 한 audio는 준비한다.');
    assert.equal(audio.getAttribute('preload'), 'none');
    const { dialog, input } = openGate();
    assert.equal(input.type, 'password');
    assert.equal(input.required, true);
    assert.equal(input.autocomplete, 'off');
    assert.ok(document.activeElement === input);
    fireEvent.change(input, { target: { value: 'incorrect-code' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '입장하기' }));
    assert.equal(within(dialog).getByRole('alert').textContent, '코드가 맞지 않아요. 다시 입력해 주세요.');
    assert.equal(input.getAttribute('aria-invalid'), 'true');
    assert.equal(normalMain().hidden, false);
    assert.equal(document.getElementById('backroom'), null);
    assert.equal(audio.getAttribute('src'), null);
    assert.equal(playCalls, 0);
    assert.equal(loadCalls, 0);
  });

  it('코드 입력 창을 취소하면 원래 음악과 재생 위치·포커스를 그대로 유지한다', async () => {
    enableMusic();
    enableBackroom();
    render(<App />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '음악 켜기' })); });
    await screen.findByRole('button', { name: '음악 끄기' });
    const audio = audioElement();
    audio.currentTime = 42.5;
    const { trigger, input } = openGate();
    fireEvent.keyDown(input, { key: 'Escape' });
    assert.equal(screen.queryByRole('dialog'), null);
    assert.ok(document.activeElement === trigger);
    assert.equal(normalMain().hidden, false);
    assert.equal(audio.getAttribute('src'), normalTrack);
    assert.equal(audio.currentTime, 42.5);
    assert.equal(playCalls, 1);
    assert.equal(pauseCalls, 0);
    assert.equal(loadCalls, 0);
    assert.ok(screen.getByRole('button', { name: '음악 끄기' }));
  });

  it('올바른 코드는 A를 멈춘 뒤 같은 audio로 B를 즉시 켜고 Escape 복귀에서는 멈춘 A를 유지한다', async () => {
    enableMusic();
    enableBackroom();
    render(<App />);
    const audio = audioElement();
    audio.currentTime = 18.25;
    window.scrollTo(0, 560);
    const previousUrl = window.location.href;
    const trigger = unlock();
    assertBackroom();
    assert.ok(audioElement() === audio);
    assert.equal(audio.getAttribute('src'), backroomTrack);
    assertSwitch(normalTrack, backroomTrack);
    assert.equal(window.location.href, previousUrl);
    assert.equal(dom.window.localStorage.length, 0);
    await act(async () => {});
    await screen.findByRole('button', { name: '비트 끄기' });
    fireEvent.pause(audio);
    assert.equal(audio.paused, false);
    assert.ok(screen.getByRole('button', { name: '비트 끄기' }), '재생 중인 새 음원에 늦은 pause 이벤트가 와도 UI는 실제 재생 상태를 따른다.');
    fireEvent.keyDown(document, { key: 'Escape' });
    finishFrames();
    fireEvent.loadedMetadata(audio);
    await waitFor(() => assert.equal(normalMain().hidden, false));
    assert.equal(document.getElementById('backroom'), null);
    assert.equal(audio.getAttribute('src'), normalTrack);
    assert.equal(audio.currentTime, 18.25);
    assert.equal(audio.paused, true);
    assert.equal(mediaEvents.filter(event => event.action === 'play' && event.src === normalTrack).length, 0);
    assert.equal(window.scrollY, 560);
    assert.ok(document.activeElement === trigger);
  });

  it('원래 재생하던 A는 B를 멈추고 청첩장으로 돌아올 때 위치를 복구하며 다시 재생한다', async () => {
    enableMusic();
    enableBackroom();
    render(<App />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '음악 켜기' })); });
    await screen.findByRole('button', { name: '음악 끄기' });
    const audio = audioElement();
    audio.currentTime = 37.75;
    unlock();
    assertBackroom();
    await screen.findByRole('button', { name: '비트 끄기' });
    const beforeExit = mediaEvents.length;
    await act(async () => { fireEvent.click(screen.getAllByRole('button', { name: '원래 청첩장으로' })[0]); });
    finishFrames();
    fireEvent.loadedMetadata(audio);
    await screen.findByRole('button', { name: '음악 끄기' });
    assert.equal(normalMain().hidden, false);
    assert.equal(document.getElementById('backroom'), null);
    assert.ok(audioElement() === audio);
    assert.equal(audio.currentTime, 37.75);
    assert.equal(audio.getAttribute('src'), normalTrack);
    assertSwitch(backroomTrack, normalTrack, mediaEvents.slice(beforeExit));
  });

  it('A 없이 입장한 B의 비트 버튼은 한 audio를 일시정지·재생하고 A가 없는 복귀는 조용히 유지한다', async () => {
    enableBackroom();
    render(<App />);
    const audio = audioElement();
    unlock();
    assertBackroom();
    await act(async () => {});
    fireEvent.click(await screen.findByRole('button', { name: '비트 끄기' }));
    assert.ok(screen.getByRole('button', { name: '비트 켜기' }));
    assert.equal(audio.paused, true);
    fireEvent.play(audio);
    assert.ok(screen.getByRole('button', { name: '비트 켜기' }), '멈춘 음원에 늦은 play 이벤트가 와도 UI는 실제 일시정지 상태를 따른다.');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '비트 켜기' })); });
    await screen.findByRole('button', { name: '비트 끄기' });
    assert.ok(audioElement() === audio);
    assert.equal(audio.getAttribute('src'), backroomTrack);
    assert.equal(playCalls, 2);
    const exit = screen.getAllByRole('button', { name: '원래 청첩장으로' }).at(-1);
    assert.ok(exit);
    fireEvent.click(exit);
    finishFrames();
    assert.equal(normalMain().hidden, false);
    assert.equal(audio.getAttribute('src'), null);
    assert.equal(audio.paused, true);
    assert.ok(screen.queryByRole('button', { name: /음악 켜기|음악 끄기/ }) === null);
  });

  it('B의 play 거절에도 BACKROOM 화면을 유지하고 비트 버튼으로 안전하게 다시 시도한다', async () => {
    enableMusic();
    enableBackroom();
    Object.defineProperty(dom.window.HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: function (this: HTMLMediaElement) {
        playCalls += 1;
        mediaEvents.push({ action: 'play', src: this.getAttribute('src') });
        if (playCalls === 1) return Promise.reject(new dom.window.DOMException('blocked', 'NotAllowedError'));
        Object.defineProperty(this, 'paused', { configurable: true, writable: true, value: false });
        this.dispatchEvent(new dom.window.Event('play'));
        return Promise.resolve();
      },
    });
    render(<App />);
    unlock();
    const musicRegion = screen.getByRole('button', { name: '비트 켜기' }).closest('section');
    assert.ok(musicRegion);
    await waitFor(() => assert.match(within(musicRegion).getByRole('status').textContent ?? '', /다시/));
    assertBackroom();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '비트 켜기' })); });
    await screen.findByRole('button', { name: '비트 끄기' });
    assert.equal(audioElement().getAttribute('src'), backroomTrack);
    assert.equal(playCalls, 2);
    assert.equal(document.querySelectorAll('audio').length, 1);
  });

  it('복귀 후 늦게 도착한 B 재생 실패는 원래 청첩장의 음악 상태를 바꾸지 않는다', async () => {
    enableMusic();
    enableBackroom();
    const pending: { reject?: (reason: Error) => void } = {};
    Object.defineProperty(dom.window.HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: function (this: HTMLMediaElement) {
        playCalls += 1;
        mediaEvents.push({ action: 'play', src: this.getAttribute('src') });
        return new Promise<void>((_resolve, reject) => { pending.reject = reject; });
      },
    });
    render(<App />);
    unlock();
    assertBackroom();
    assert.ok(pending.reject);
    fireEvent.click(screen.getAllByRole('button', { name: '원래 청첩장으로' })[0]);
    finishFrames();
    await act(async () => { pending.reject?.(new Error('synthetic late B failure')); });
    assert.equal(normalMain().hidden, false);
    assert.equal(document.getElementById('backroom'), null);
    assert.equal(audioElement().getAttribute('src'), normalTrack);
    assert.equal(audioElement().paused, true);
    const button = screen.getByRole('button', { name: '음악 켜기' });
    assert.match(button.textContent ?? '', /음악 켜기/);
    assert.doesNotMatch(button.textContent ?? '', /다시 재생/);
    assert.equal(document.querySelector('.toast')?.textContent ?? '', '');
  });

  it('열 사진과 기분 순환·무음 영상을 유지하고 영상 소리와 비트가 겹치지 않게 전환한다', async () => {
    enableMusic();
    enableBackroom();
    let videoAttempts = 0;
    Object.defineProperty(dom.window.HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: function (this: HTMLMediaElement) {
        playCalls += 1;
        mediaEvents.push({ action: 'play', src: this.getAttribute('src') });
        if (this instanceof dom.window.HTMLVideoElement && ++videoAttempts === 1) {
          return Promise.reject(new dom.window.DOMException('synthetic autoplay blocked', 'NotAllowedError'));
        }
        Object.defineProperty(this, 'paused', { configurable: true, writable: true, value: false });
        this.dispatchEvent(new dom.window.Event('play'));
        return Promise.resolve();
      },
    });
    assert.ok(invitation.backroom);
    invitation.backroom.photos = Array.from({ length: 10 }, (_, index) => ({
      id: 'backroom-' + String(index + 1).padStart(2, '0'), src: '/synthetic-backroom-photo-' + index + '.webp',
      alt: '검증 BACKROOM 사진 ' + index, sample: false,
    }));
    invitation.backroom.video = { src: '/synthetic-test-video.mp4', poster: '/synthetic-test-poster.webp', label: '검증 영상' };
    render(<App />);
    unlock();
    await act(async () => {});
    assertBackroom();
    const main = document.getElementById('backroom');
    assert.ok(main);
    assert.ok(within(main).getByRole('heading', { level: 1, name: /작전명:\s*평생\s*한 팀/ }));
    for (const nickname of ['호냥이', '의정부 맑눈광']) assert.ok(within(main).getAllByText(nickname).length > 0);
    const renderedPhotos = within(main).getAllByRole<HTMLImageElement>('img');
    assert.equal(renderedPhotos.length, 10);
    for (const photo of invitation.backroom.photos) {
      assert.equal(renderedPhotos.filter(image => image.getAttribute('src') === photo.src).length, 1, '설정된 사진은 각자 한 번만 표시한다.');
    }
    const video = screen.getByLabelText<HTMLVideoElement>('검증 영상');
    assert.ok(within(main).queryByText('검증 영상') === null, '영상의 접근 가능한 설명은 유지하고 별도 보이는 설명은 제거한다.');
    assert.equal(video.defaultMuted, true);
    assert.equal(video.muted, true);
    assert.equal(video.controls, true);
    assert.equal(video.playsInline, true);
    assert.equal(video.loop, true);
    assert.equal(video.getAttribute('preload'), 'auto');
    assert.equal(video.hasAttribute('autoplay'), true);
    assert.equal(video.autoplay, true);
    assert.equal(video.getAttribute('src'), '/synthetic-test-video.mp4');
    const audio = audioElement();
    assert.equal(mediaEvents.filter(event => event.action === 'play' && event.src === video.getAttribute('src')).length, 1, '영상은 마운트에서 한 번만 재생을 요청한다.');
    const retryVideo = screen.getByRole('button', { name: '영상 재생' });
    assert.equal(video.paused, true);
    assert.equal(audio.paused, false, '영상 자동 재생 거절은 비트 재생을 멈추지 않는다.');
    assertBackroom();
    await act(async () => { fireEvent.click(retryVideo); });
    assert.ok(screen.queryByRole('button', { name: '영상 재생' }) === null);
    assert.equal(video.paused, false);
    const attemptsAfterRetry = videoAttempts;
    assert.equal(audio.paused, false, '무음 영상은 비트와 함께 재생할 수 있다.');
    act(() => { video.pause(); video.muted = false; fireEvent.volumeChange(video); });
    const moodButton = screen.getByRole<HTMLButtonElement>('button', { name: '기분 바꾸기' });
    const card = moodButton.closest<HTMLElement>('.br-mood');
    assert.ok(card);
    const emoji = moodButton.querySelector<HTMLElement>('.br-mood-emoji');
    assert.ok(emoji);
    assert.equal(emoji.getAttribute('aria-hidden'), 'true');
    assert.doesNotMatch(moodButton.textContent ?? '', /기분 바꾸기/);
    const turns = [Number.parseFloat(emoji.style.getPropertyValue('--br-mood-turn'))];
    const initialFace = emoji.textContent;
    assert.equal(main.getAttribute('data-mood'), 'good');
    moodButton.focus();
    assert.ok(screen.getByText('기분이 좋아졌어~~'));
    fireEvent.click(moodButton);
    assert.ok(screen.getByText('기분이 안 좋아졌어~~~~~'));
    assert.equal(main.getAttribute('data-mood'), 'bad');
    assert.notEqual(emoji.textContent, initialFace);
    const badFace = emoji.textContent;
    turns.push(Number.parseFloat(emoji.style.getPropertyValue('--br-mood-turn')));
    fireEvent.click(moodButton);
    assert.ok(screen.getByText('흐음!!!!'));
    assert.equal(main.getAttribute('data-mood'), 'hmm');
    assert.notEqual(emoji.textContent, initialFace);
    assert.notEqual(emoji.textContent, badFace);
    turns.push(Number.parseFloat(emoji.style.getPropertyValue('--br-mood-turn')));
    fireEvent.click(moodButton);
    assert.ok(screen.getByText('기분이 좋아졌어~~'));
    assert.equal(main.getAttribute('data-mood'), 'good');
    assert.equal(emoji.textContent, initialFace);
    turns.push(Number.parseFloat(emoji.style.getPropertyValue('--br-mood-turn')));
    assert.ok(turns.every((turn, index) => Number.isFinite(turn) && (index === 0 || turn > turns[index - 1])), '이모지 회전은 기분 순환 뒤에도 되감지 않고 누적된다.');
    assert.ok(screen.getByRole('button', { name: '기분 바꾸기' }) === moodButton);
    act(() => { for (let click = 0; click < 7; click += 1) fireEvent.click(moodButton); });
    assert.equal(main.getAttribute('data-mood'), 'bad', '빠른 연속 클릭도 누락 없이 세 기분을 순환한다.');
    assert.equal(emoji.textContent, badFace);
    assert.ok(Number.parseFloat(emoji.style.getPropertyValue('--br-mood-turn')) > turns[turns.length - 1]);
    assert.ok(screen.getByRole('button', { name: '기분 바꾸기' }) === moodButton, '기분 변경은 클릭 중인 버튼을 교체하지 않는다.');
    assert.equal(moodButton.disabled, false);
    assert.ok(document.activeElement === moodButton);
    for (const text of ['자기야!!!!', '난 버려졌어!!!!', '맞짱!!!!', '으어어어어어어', '구아아아아아악']) assert.ok((main.textContent ?? '').includes(text));
    assert.equal(video.muted, false, '기분 갱신은 사용자가 바꾼 영상 무음을 덮어쓰지 않는다.');
    fireEvent.click(screen.getByRole('button', { name: '비트 끄기' }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '비트 켜기' })); });
    assert.equal(video.muted, false, '음악 상태 갱신도 영상 설정을 유지한다.');
    assert.equal(videoAttempts, attemptsAfterRetry, '기분이나 음악 갱신은 영상을 다시 재생하지 않는다.');
    await act(async () => { await video.play(); });
    assert.equal(video.paused, false);
    assert.equal(audio.paused, true, '소리 있는 영상이 시작되면 비트는 멈춘다.');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '비트 켜기' })); });
    assert.equal(video.paused, true);
    assert.equal(audio.paused, false);
    assert.equal(video.muted, false);
  });
});

describe('공유 대안과 연락·지도 설정', () => {
  it('카카오 키가 없으면 SDK를 로드하지 않고 현재 청첩장 URL을 복사한다', async () => {
    invitation.share.siteUrl = '';
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '카카오톡에 링크 복사' }));
    await waitFor(() => assert.deepEqual(copied, ['https://invitation.test/preview']));
    await waitFor(() => assert.match(screen.getByRole('status').textContent ?? '', /카카오톡 대화창에 붙여넣어/));
    assert.equal(document.querySelector('script[src*="kakao"]'), null);
  });

  it('카카오 SDK 초기화 전에는 공유를 막고 준비되면 탭 안에서 정확한 피드를 즉시 전달한다', async () => {
    invitation.share.kakaoJavaScriptKey = 'synthetic-test-key';
    let initialized = false;
    const initializedWith: string[] = [];
    const sent: object[] = [];
    window.Kakao = {
      isInitialized: () => initialized,
      init: key => { initializedWith.push(key); initialized = true; },
      Share: { sendDefault: options => { sent.push(options); } },
    };
    render(<App />);
    const button = screen.getByRole<HTMLButtonElement>('button', { name: '카카오톡 준비 중' });
    assert.equal(button.disabled, true);
    fireEvent.click(button);
    assert.deepEqual(sent, []);
    await waitFor(() => assert.equal(button.disabled, false));
    assert.deepEqual(initializedWith, ['synthetic-test-key']);
    assert.equal(button.textContent, '카카오톡으로 전하기');
    fireEvent.click(button);
    // 클릭 직후 동기적으로 호출해야 Safari의 사용자 탭 권한이 이어진다.
    assert.deepEqual(sent, [{
      objectType: 'feed',
      content: {
        title: '검증 초대', description: '함께해 주세요.',
        imageUrl: 'https://hojeong-sojeong.test/test-og.jpg',
        link: { mobileWebUrl: 'https://hojeong-sojeong.test', webUrl: 'https://hojeong-sojeong.test' },
      },
      buttons: [{
        title: '청첩장 보기',
        link: { mobileWebUrl: 'https://hojeong-sojeong.test', webUrl: 'https://hojeong-sojeong.test' },
      }],
    }]);
    assert.deepEqual(copied, []);
    assert.equal(document.querySelector('script[src*="kakao"]'), null);
  });

  it('이미 초기화된 카카오 SDK는 다시 초기화하지 않고 공유 오류를 링크 복사로 처리한다', async () => {
    invitation.share.kakaoJavaScriptKey = 'synthetic-test-key';
    let initCalls = 0;
    let sendCalls = 0;
    window.Kakao = {
      isInitialized: () => true,
      init: () => { initCalls += 1; },
      Share: { sendDefault: () => { sendCalls += 1; throw new Error('synthetic share failure'); } },
    };
    render(<App />);
    const button = screen.getByRole<HTMLButtonElement>('button', { name: '카카오톡 준비 중' });
    await waitFor(() => assert.equal(button.disabled, false));
    assert.equal(initCalls, 0);
    fireEvent.click(button);
    assert.equal(sendCalls, 1);
    await waitFor(() => assert.deepEqual(copied, [invitation.share.siteUrl]));
    await waitFor(() => assert.match(screen.getByRole('status').textContent ?? '', /카카오톡 연결 대신 링크를 복사/));
    assert.equal(button.disabled, false);
    assert.ok(screen.getByRole('heading', { level: 1 }));
  });

  it('SDK 로딩 실패 시 준비 중 상태를 풀고 네트워크 없이 링크 복사 대안을 제공한다', async () => {
    invitation.share.kakaoJavaScriptKey = 'synthetic-test-key';
    render(<App />);
    const button = screen.getByRole<HTMLButtonElement>('button', { name: '카카오톡 준비 중' });
    assert.equal(button.disabled, true);
    const script = document.querySelector<HTMLScriptElement>('script[src*="kakao_js_sdk"]');
    assert.ok(script);
    assert.ok(script.src.startsWith('https://t1.kakaocdn.net/kakao_js_sdk/'));
    // jsdom의 외부 리소스 로드는 꺼져 있다. 실패 이벤트만 직접 전달한다.
    fireEvent.error(script);
    await waitFor(() => assert.equal(button.disabled, false));
    assert.equal(button.textContent, '카카오톡에 링크 복사');
    assert.equal(document.querySelector('script[src*="kakao"]'), null);
    fireEvent.click(button);
    await waitFor(() => assert.deepEqual(copied, [invitation.share.siteUrl]));
    await waitFor(() => assert.match(screen.getByRole('status').textContent ?? '', /카카오톡 대화창에 붙여넣어/));
  });

  it('기본 공유 미지원 또는 실패 시 링크 복사로 돌아간다', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '공유하기' }));
    await waitFor(() => assert.deepEqual(copied, [invitation.share.siteUrl]));
    copied = [];
    setNativeShare(async () => { throw new Error('native share failed'); });
    fireEvent.click(screen.getByRole('button', { name: '공유하기' }));
    await waitFor(() => assert.deepEqual(copied, [invitation.share.siteUrl]));
  });

  it('기본 공유 성공은 설정 URL을 전달하고 사용자 취소는 복사를 강행하지 않는다', async () => {
    const shared: ShareData[] = [];
    setNativeShare(async data => { shared.push(data); });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '공유하기' }));
    await waitFor(() => assert.equal(shared.length, 1));
    assert.equal(shared[0].url, invitation.share.siteUrl);
    assert.equal(shared[0].title, invitation.share.title);
    assert.deepEqual(copied, []);
    setNativeShare(async () => { throw new dom.window.DOMException('cancelled', 'AbortError'); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '공유하기' })); });
    assert.deepEqual(copied, []);
  });

  it('동의한 합성 연락처만 tel/sms를 만들고 좌표 없이도 공식 장소 검색 링크를 제공한다', () => {
    invitation.contacts = [
      { id: 'allowed', role: '신랑', name: '검증 신랑', phone: '010-0000-0000', consent: true },
      { id: 'denied', role: '신부', name: '검증 신부', phone: '010-0000-0000', consent: false },
    ];
    render(<App />);
    assert.equal(screen.getByRole('link', { name: '신랑 검증 신랑에게 전화하기' }).getAttribute('href'), 'tel:01000000000');
    assert.equal(screen.getByRole('link', { name: '신랑 검증 신랑에게 문자 보내기' }).getAttribute('href'), 'sms:01000000000');
    assert.equal(screen.queryByRole('link', { name: /신부 검증 신부에게/ }), null);
    const naver = screen.getByRole('link', { name: /네이버지도/ });
    const kakao = screen.getByRole('link', { name: '카카오맵' });
    assert.ok(naver.getAttribute('href')?.startsWith('https://map.naver.com/'));
    assert.ok(kakao.getAttribute('href')?.startsWith('https://map.kakao.com/link/search/'));
    assert.equal(naver.getAttribute('target'), '_blank');
    assert.match(naver.getAttribute('rel') ?? '', /noopener/);
  });
});

describe('기본 표시 설정', () => {
  it('기본 연락처 숨김 설정에서는 번호가 있어도 연락하기와 전화·문자 링크를 표시하지 않는다', () => {
    invitation.privacy = structuredClone(baseline.privacy);
    invitation.contacts = [{
      id: 'hidden-by-setting', role: '신랑', name: '검증 연락처',
      phone: '010-0000-0000', consent: true,
    }];
    render(<App />);
    assert.equal(document.getElementById('contacts'), null);
    assert.equal(screen.queryByRole('link', { name: '연락하기' }), null);
    assert.equal(document.querySelector('a[href^="tel:"], a[href^="sms:"]'), null);
  });

  it('이주은 이름 옆에 접근 가능한 국화꽃을 표시하고 기존 가족 names 표기도 지원한다', () => {
    invitation.families = [
      ...structuredClone(baseline.families),
      {
        id: 'legacy-family', names: '검증 가족', relation: '자녀',
        person: '검증 신랑', visible: true, confirmed: true,
      },
    ];
    render(<App />);
    const families = document.querySelector('.families');
    assert.ok(families);
    assert.match(families.textContent ?? '', /이주은/);
    assert.equal((families.textContent ?? '').includes('故'), false);
    const flower = within(families as HTMLElement).getByRole('img', { name: '추모 국화꽃' });
    assert.equal(flower.tagName.toLowerCase(), 'svg');
    assert.ok(flower.parentElement?.textContent?.includes('이주은'), '국화꽃은 추모 대상 이름과 함께 표시한다.');
    assert.ok(within(families as HTMLElement).getByText('검증 가족'));
  });

  it('초안 검수 패널과 갤러리 안내·사진 영문 장식을 표시하지 않고 사진 확대는 유지한다', () => {
    render(<App />);
    assert.ok(document.querySelector('.demo-audit, .gallery-hint, .photo-mark') === null);
    assert.equal(screen.queryByText('사진을 누르면 크게 볼 수 있어요'), null);
    assert.equal(screen.queryByText('our beginning'), null);
    assert.equal(screen.getAllByText('화환은 정중히 사양합니다.').length, 1);
    fireEvent.click(screen.getByRole('button', { name: /사진 1 확대 보기/ }));
    const dialog = screen.getByRole('dialog', { name: '사진 갤러리 확대 보기' });
    assert.ok(within(dialog).getByRole('img', { name: '검증 사진 1' }));
  });
});

describe('미설정 정보와 감사 화면', () => {
  it('사진·연락처·계좌·장소·일시가 비어 있어도 빈 링크 없이 안내를 유지한다', () => {
    invitation.photos = { hero: null, gallery: [], closing: null };
    invitation.contacts = [];
    invitation.accounts = [];
    invitation.families = [];
    invitation.venue = { ...invitation.venue, name: '', hall: '', floor: '', address: '', confirmed: false };
    invitation.wedding = { ...invitation.wedding, dateTime: null, confirmed: false };
    render(<App />);
    assert.ok(screen.getByRole('heading', { level: 1 }));
    assert.equal(screen.getAllByRole('img', { name: '사진 준비 중' }).length, 2);
    assert.ok(screen.getByText('함께한 순간들을 곧 담아둘게요.'));
    assert.equal(document.querySelector('img[src=""]'), null);
    assert.equal(document.querySelector('a[href^="tel:"], a[href^="sms:"]'), null);
    assert.equal(screen.getByRole<HTMLButtonElement>('button', { name: '주소 복사' }).disabled, true);
    assert.equal(screen.getByRole<HTMLButtonElement>('button', { name: '날짜 확정 후 일정 저장' }).disabled, true);
    assert.equal(screen.getByRole<HTMLButtonElement>('button', { name: /네이버지도/ }).disabled, true);
    assert.equal(screen.getByRole<HTMLButtonElement>('button', { name: '카카오맵' }).disabled, true);
  });

  it('감사 화면은 계좌·연락처·일시·교통 섹션을 숨기고 감사 문구와 공유를 유지한다', () => {
    invitation.stage = 'thank-you';
    invitation.contacts = [
      { id: 'hidden-contact', role: '신랑', name: '숨길 연락처 이름', phone: '010-0000-0000', consent: true },
    ];
    useAccounts();
    render(<App />);
    assert.ok(screen.getByRole('heading', { name: '감사의 마음을 전합니다' }));
    assert.equal(document.getElementById('contacts'), null);
    assert.equal(document.getElementById('accounts'), null);
    assert.equal(document.getElementById('date'), null);
    assert.equal(document.getElementById('location'), null);
    assert.equal(screen.queryByText('숨길 연락처 이름'), null);
    assert.equal(document.querySelector('a[href^="tel:"], a[href^="sms:"]'), null);
    assert.ok(screen.getByRole('button', { name: '링크 복사' }));
    // 화면에서 숨긴 값이 배포 파일에서도 삭제됐다는 뜻은 아니다.
    assert.equal(invitation.contacts.length, 1);
  });
});

describe('스크롤 애니메이션의 콘텐츠 표시와 정리', () => {
  const globalObserver = Object.getOwnPropertyDescriptor(globalThis, 'IntersectionObserver');
  const windowObserver = Object.getOwnPropertyDescriptor(window, 'IntersectionObserver');
  const windowMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
  const windowRequestFrame = Object.getOwnPropertyDescriptor(window, 'requestAnimationFrame');
  const windowCancelFrame = Object.getOwnPropertyDescriptor(window, 'cancelAnimationFrame');
  let observers: MockIntersectionObserver[] = [];
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrameId = 0;

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '0px';
    readonly scrollMargin = '0px';
    readonly thresholds = [0];
    readonly observed = new Set<Element>();
    readonly unobserved: Element[] = [];
    disconnectCalls = 0;

    constructor(private readonly callback: IntersectionObserverCallback) {
      observers.push(this);
    }
    observe(target: Element) { this.observed.add(target); }
    unobserve(target: Element) { this.unobserved.push(target); this.observed.delete(target); }
    disconnect() { this.disconnectCalls += 1; this.observed.clear(); }
    takeRecords(): IntersectionObserverEntry[] { return []; }
    intersect(target: Element, isIntersecting: boolean) {
      if (!this.observed.has(target)) return;
      this.callback([{
        target, isIntersecting, intersectionRatio: isIntersecting ? 1 : 0,
        time: 0, rootBounds: null,
        boundingClientRect: target.getBoundingClientRect(),
        intersectionRect: target.getBoundingClientRect(),
      }], this);
    }
  }

  function installObserver() {
    for (const target of [globalThis, window]) {
      Object.defineProperty(target, 'IntersectionObserver', {
        configurable: true, writable: true, value: MockIntersectionObserver,
      });
    }
  }
  function mockMotionPreference(initial: boolean) {
    const listeners = new Set<EventListenerOrEventListenerObject>();
    const preference = {
      matches: initial,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
        if (type === 'change') listeners.add(listener);
      },
      removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
        if (type === 'change') listeners.delete(listener);
      },
    };
    Object.defineProperty(window, 'matchMedia', {
      configurable: true, writable: true,
      value: (query: string) => {
        assert.equal(query, preference.media);
        return preference;
      },
    });
    return {
      listeners,
      change(reduced: boolean) {
        preference.matches = reduced;
        const event = new dom.window.Event('change');
        for (const listener of listeners) {
          if (typeof listener === 'function') listener(event);
          else listener.handleEvent(event);
        }
      },
    };
  }
  function RevealFixture({ policy = 'auto' }: { policy?: MotionPolicy }) {
    const { root, enabled } = useReveal(policy);
    return <main ref={root} className="invitation" data-motion={enabled ? 'on' : 'off'}>
      <h2 className="section-title">검증 제목</h2>
      <div className="invitation-text"><p>계속 읽을 수 있는 내용</p></div>
      <p>애니메이션 대상 밖 내용</p>
    </main>;
  }
  function RevealRowsFixture() {
    const { root, enabled } = useReveal();
    return <main ref={root} className="invitation" data-motion={enabled ? 'on' : 'off'}>
      <div className="invitation-text">
        <p>검증 문장 하나</p><p>검증 문장 둘</p><p>검증 문장 셋</p>
      </div>
      <div className="families"><p>검증 가족 하나</p><p>검증 가족 둘</p></div>
      <div className="gallery-grid">
        <button className="gallery-thumb">검증 사진 하나</button>
        <button className="gallery-thumb">검증 사진 둘</button>
      </div>
      <div className="directions"><div>검증 교통 하나</div><div>검증 교통 둘</div></div>
      <div className="account-groups">
        <details className="account-group"><summary>검증 계좌 하나</summary></details>
        <details className="account-group"><summary>검증 계좌 둘</summary></details>
      </div>
    </main>;
  }
  function targets() {
    return [screen.getByRole('heading', { name: '검증 제목' }), screen.getByText('계속 읽을 수 있는 내용')];
  }
  function restoreProperty(target: object, name: string, descriptor: PropertyDescriptor | undefined) {
    if (descriptor) Object.defineProperty(target, name, descriptor);
    else Reflect.deleteProperty(target, name);
  }
  function flushAnimationFrame() {
    const callbacks = [...frames.values()];
    frames.clear();
    act(() => { callbacks.forEach(callback => callback(16)); });
  }
  function finishInitialization() {
    flushAnimationFrame();
    flushAnimationFrame();
  }

  beforeEach(() => {
    observers = [];
    frames.clear();
    nextFrameId = 0;
    dom.reconfigure({ url: 'https://invitation.test/preview' });
    for (const target of [globalThis, window]) {
      Object.defineProperty(target, 'IntersectionObserver', { configurable: true, writable: true, value: undefined });
    }
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: undefined });
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true, writable: true,
      value: (callback: FrameRequestCallback) => {
        const id = ++nextFrameId;
        frames.set(id, callback);
        return id;
      },
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true, writable: true, value: (id: number) => { frames.delete(id); },
    });
  });
  afterEach(() => {
    cleanup();
    restoreProperty(globalThis, 'IntersectionObserver', globalObserver);
    restoreProperty(window, 'IntersectionObserver', windowObserver);
    restoreProperty(window, 'matchMedia', windowMatchMedia);
    restoreProperty(window, 'requestAnimationFrame', windowRequestFrame);
    restoreProperty(window, 'cancelAnimationFrame', windowCancelFrame);
    frames.clear();
    dom.reconfigure({ url: 'https://invitation.test/preview' });
  });

  it('관찰 API가 없거나 모션 감소가 처음부터 켜져 있으면 내용을 숨기지 않는다', () => {
    const unsupported = render(<RevealFixture />);
    for (const target of targets()) assert.equal(target.classList.contains('reveal-pending'), false);
    assert.equal(observers.length, 0);
    unsupported.unmount();
    installObserver();
    const motion = mockMotionPreference(true);
    render(<RevealFixture />);
    for (const target of targets()) assert.equal(target.classList.contains('reveal-pending'), false);
    assert.equal(observers.length, 0);
    assert.equal(motion.listeners.size, 1, '정적 표시 중에도 설정 복구를 구독한다.');
    assert.equal(frames.size, 0);
    act(() => { motion.change(false); });
    for (const target of targets()) assert.equal(target.classList.contains('reveal-pending'), true);
    finishInitialization();
    assert.equal(observers[0].observed.size, 2, '처음부터 켜져 있던 모션 감소를 끄면 효과를 복구한다.');
  });

  it('화면 안에 들어온 내용은 한 번만 표시하고 관찰을 해제하며 나머지는 기다린다', () => {
    installObserver();
    mockMotionPreference(false);
    render(<RevealFixture />);
    assert.equal(observers.length, 1);
    const observer = observers[0];
    const [heading, paragraph] = targets();
    assert.equal(heading.classList.contains('reveal-pending'), true);
    assert.equal(paragraph.classList.contains('reveal-pending'), true);
    assert.equal(observer.observed.size, 0, '초기 숨김 상태를 잡은 뒤 프레임 경계에서 관찰을 시작한다.');
    finishInitialization();
    assert.equal(observer.observed.size, 2);
    assert.equal(screen.getByText('애니메이션 대상 밖 내용').classList.contains('reveal-pending'), false);
    act(() => { observer.intersect(heading, false); });
    assert.equal(heading.classList.contains('reveal-pending'), true);
    assert.equal(observer.unobserved.length, 0);
    act(() => { observer.intersect(heading, true); });
    assert.equal(heading.classList.contains('reveal-pending'), false);
    assert.equal(observer.observed.has(heading), false);
    assert.equal(observer.unobserved.length, 1);
    assert.ok(observer.unobserved[0] === heading);
    act(() => { observer.intersect(heading, true); });
    assert.equal(observer.unobserved.length, 1);
    assert.equal(paragraph.classList.contains('reveal-pending'), true);
  });

  it('문장·가족·교통·계좌 행은 차례로 표시하고 사진은 각 버튼의 화면 진입을 따로 기다린다', () => {
    installObserver();
    mockMotionPreference(false);
    const view = render(<RevealRowsFixture />);
    const observer = observers[0];
    finishInitialization();
    for (const selector of ['.invitation-text', '.families', '.directions', '.account-groups', '.gallery-grid']) {
      const group = view.container.querySelector<HTMLElement>(selector);
      assert.ok(group);
      assert.equal(observer.observed.has(group), false, '묶음 대신 개별 내용을 관찰한다.');
      const rows = Array.from(group.children) as HTMLElement[];
      for (const row of rows) {
        assert.equal(observer.observed.has(row), true);
        assert.equal(row.classList.contains('reveal-pending'), true);
        assert.match(row.style.getPropertyValue('--reveal-delay'), /^\d+ms$/);
      }
      const delays = rows.map(row => Number.parseFloat(row.style.getPropertyValue('--reveal-delay')));
      assert.ok(delays.every((delay, index) => index === 0 || delay > delays[index - 1]), '연속된 행에 순차 지연을 지정한다.');
    }
    const first = screen.getByRole('button', { name: '검증 사진 하나' });
    const second = screen.getByRole('button', { name: '검증 사진 둘' });
    act(() => { observer.intersect(first, true); });
    assert.equal(first.classList.contains('reveal-pending'), false);
    assert.equal(second.classList.contains('reveal-pending'), true, '다른 사진은 자기 화면 진입 전까지 기다린다.');
    act(() => { observer.intersect(second, false); });
    assert.equal(second.classList.contains('reveal-pending'), true);
    act(() => { observer.intersect(second, true); observer.intersect(first, true); });
    assert.equal(second.classList.contains('reveal-pending'), false);
    assert.equal(observer.unobserved.length, 2);
    assert.equal(observer.observed.has(first), false);
    assert.equal(observer.observed.has(second), false);
  });

  it('키보드 포커스가 들어온 사진은 즉시 표시하고 화면 제거 후 포커스 리스너를 남기지 않는다', () => {
    installObserver();
    mockMotionPreference(false);
    const view = render(<RevealRowsFixture />);
    const observer = observers[0];
    const first = screen.getByRole('button', { name: '검증 사진 하나' });
    const second = screen.getByRole('button', { name: '검증 사진 둘' });
    assert.equal(first.classList.contains('reveal-pending'), true);
    // global Element를 설치하지 않아도 window.Element로 DOM 대상을 판별한다.
    act(() => { first.focus(); });
    assert.ok(document.activeElement === first);
    assert.equal(first.classList.contains('reveal-pending'), false);
    assert.equal(second.classList.contains('reveal-pending'), true);
    assert.equal(observer.observed.has(first), false);
    assert.equal(observer.unobserved.length, 1);
    finishInitialization();
    assert.equal(observer.observed.has(first), false, '초기화 전에 포커스로 표시한 사진을 다시 관찰하지 않는다.');
    assert.equal(observer.observed.has(second), true);
    view.unmount();
    first.classList.add('reveal-pending');
    first.dispatchEvent(new dom.window.FocusEvent('focusin', { bubbles: true }));
    assert.equal(first.classList.contains('reveal-pending'), true, '제거한 화면의 포커스 이벤트에는 더 이상 반응하지 않는다.');
    assert.equal(observer.unobserved.length, 1);
  });

  it('자동 모드는 모션 감소를 켜면 모두 표시하고 다시 끄면 관찰과 스크롤 표시를 복구한다', () => {
    installObserver();
    const motion = mockMotionPreference(false);
    const view = render(<RevealFixture />);
    const observer = observers[0];
    for (const target of targets()) assert.equal(target.classList.contains('reveal-pending'), true);
    act(() => { motion.change(false); });
    assert.equal(observer.disconnectCalls, 0);
    act(() => { motion.change(true); });
    for (const target of targets()) assert.equal(target.classList.contains('reveal-pending'), false);
    assert.equal(observer.disconnectCalls, 1);
    assert.equal(observer.observed.size, 0);
    assert.equal(view.getByRole('main').getAttribute('data-motion'), 'off');
    assert.equal(frames.size, 0);
    act(() => { motion.change(false); });
    assert.equal(view.getByRole('main').getAttribute('data-motion'), 'on');
    assert.equal(observers.length, 2);
    for (const target of targets()) assert.equal(target.classList.contains('reveal-pending'), true);
    finishInitialization();
    assert.equal(observers[1].observed.size, 2);
  });

  it('화면을 제거할 때 관찰과 설정 리스너를 정리하고 남은 숨김 상태도 없앤다', () => {
    installObserver();
    const motion = mockMotionPreference(false);
    const view = render(<RevealFixture />);
    const observer = observers[0];
    const content = targets();
    assert.equal(motion.listeners.size, 1);
    assert.equal(frames.size, 1);
    for (const target of content) assert.equal(target.classList.contains('reveal-pending'), true);
    flushAnimationFrame();
    assert.equal(frames.size, 1, '첫 프레임 뒤 예약한 두 번째 프레임도 정리해야 한다.');
    view.unmount();
    assert.equal(observer.disconnectCalls, 1);
    assert.equal(observer.observed.size, 0);
    assert.equal(motion.listeners.size, 0);
    assert.equal(frames.size, 0);
    for (const target of content) assert.equal(target.classList.contains('reveal-pending'), false);
    act(() => { motion.change(true); });
    assert.equal(observer.disconnectCalls, 1);
  });

  it('명시적으로 켠 모드는 모션 감소 설정에서도 대기 상태를 만들고 끄면 정적으로 모두 표시한다', () => {
    installObserver();
    mockMotionPreference(true);
    const view = render(<RevealFixture policy="on" />);
    assert.equal(view.getByRole('main').getAttribute('data-motion'), 'on');
    for (const target of targets()) assert.equal(target.classList.contains('reveal-pending'), true);
    finishInitialization();
    const observer = observers[0];
    assert.equal(observer.observed.size, 2);
    view.rerender(<RevealFixture policy="off" />);
    assert.equal(view.getByRole('main').getAttribute('data-motion'), 'off');
    for (const target of targets()) assert.equal(target.classList.contains('reveal-pending'), false);
    assert.equal(observer.disconnectCalls, 1);
    assert.equal(frames.size, 0);
  });

  it('StrictMode 재설정 뒤에도 프레임 전 숨김 상태와 마지막 관찰 콜백을 유지한다', () => {
    installObserver();
    const motion = mockMotionPreference(false);
    const view = render(<StrictMode><RevealFixture /></StrictMode>);
    const main = view.getByRole('main');
    assert.equal(observers.length, 2);
    assert.equal(observers[0].disconnectCalls, 1);
    assert.equal(motion.listeners.size, 1);
    assert.equal(frames.size, 1, '정리된 첫 실행의 프레임은 취소한다.');
    for (const target of targets()) assert.equal(target.classList.contains('reveal-pending'), true);
    assert.equal(main.classList.contains('reveal-initializing'), true);
    const observer = observers[1];
    assert.equal(observer.observed.size, 0);
    flushAnimationFrame();
    assert.equal(main.classList.contains('reveal-initializing'), true);
    assert.equal(observer.observed.size, 0);
    assert.equal(frames.size, 1);
    flushAnimationFrame();
    assert.equal(main.classList.contains('reveal-initializing'), false);
    assert.equal(observer.observed.size, 2);
    assert.equal(frames.size, 0);
    const [heading, paragraph] = targets();
    act(() => { observer.intersect(heading, true); });
    assert.equal(heading.classList.contains('reveal-pending'), false);
    assert.equal(paragraph.classList.contains('reveal-pending'), true);
    view.rerender(<StrictMode><RevealFixture /></StrictMode>);
    assert.equal(observers.length, 2);
    assert.equal(heading.classList.contains('reveal-pending'), false);
    assert.equal(paragraph.classList.contains('reveal-pending'), true);
  });

  it('효과 조작 버튼 없이 공개 주소의 자동 설정과 로컬 미리보기의 기본 켜기를 유지한다', () => {
    installObserver();
    const motion = mockMotionPreference(true);
    render(<App />);
    const main = screen.getByRole('main');
    assert.ok(screen.queryByRole('button', { name: /스크롤 효과/ }) === null);
    assert.ok(document.querySelector('.motion-button') === null);
    assert.equal(main.getAttribute('data-motion'), 'off');
    assert.equal(document.querySelectorAll('.reveal-pending').length, 0);
    act(() => { motion.change(false); });
    assert.equal(main.getAttribute('data-motion'), 'on');
    assert.ok(document.querySelectorAll('.reveal-pending').length > 0);
    finishInitialization();
    const observer = observers[0];
    assert.ok(observer.observed.size > 0);
    act(() => { motion.change(true); });
    assert.equal(main.getAttribute('data-motion'), 'off');
    assert.equal(document.querySelectorAll('.reveal-pending').length, 0);
    assert.equal(observer.disconnectCalls, 1);
    cleanup();
    dom.reconfigure({ url: 'http://127.0.0.1:5173/' });
    render(<App />);
    const localMain = screen.getByRole('main');
    assert.ok(screen.queryByRole('button', { name: /스크롤 효과/ }) === null);
    assert.ok(document.querySelector('.motion-button') === null);
    assert.equal(localMain.getAttribute('data-motion'), 'on');
    assert.ok(document.querySelectorAll('.reveal-pending').length > 0);
    finishInitialization();
    act(() => { motion.change(false); motion.change(true); });
    assert.equal(localMain.getAttribute('data-motion'), 'on', '로컬 미리보기에서는 모션 감소 설정에서도 효과를 유지한다.');
  });
});
