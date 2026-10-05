import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { invitation as config, type Invitation } from "./config/invitation";
import {
  calendarFor,
  createCalendarEvent,
  daysUntil,
  dDayLabel,
  formatWedding,
  validDateTime,
} from "./lib/date";
import { copyText, loadKakao, mapLinks, phoneHref } from "./lib/actions";
import { useReveal } from "./lib/useReveal";
import Icon from "./components/Icon";
import Photo from "./components/Photo";
import Gallery from "./components/Gallery";
import Dialog from "./components/Dialog";
import VenueMap from "./components/VenueMap";
import Chrysanthemum from "./components/Chrysanthemum";
import SecretEntrance from "./components/SecretEntrance";
import Backroom from "./components/Backroom";

function SectionTitle({
  english,
  children,
}: {
  english: string;
  children: string;
}) {
  return (
    <header className="section-title">
      <p className="eyebrow">{english}</p>
      <h2>{children}</h2>
    </header>
  );
}
function ManualCopy({
  value,
  label,
  onClose,
}: {
  value: string;
  label: string;
  onClose: () => void;
}) {
  const field = useRef<HTMLTextAreaElement>(null);
  return (
    <Dialog title={`${label} 직접 복사`} onClose={onClose}>
      <div className="manual-copy">
        <h2>직접 복사해주세요</h2>
        <p>
          자동 복사를 사용할 수 없는 환경이에요.
          <br />
          아래 내용을 길게 눌러 선택한 뒤 복사해주세요.
        </p>
        <label htmlFor="manual-copy-field">{label}</label>
        <textarea id="manual-copy-field" readOnly ref={field} value={value} />
        <button
          className="button"
          onClick={() => {
            field.current?.focus();
            field.current?.select();
          }}
        >
          내용 선택
        </button>
      </div>
    </Dialog>
  );
}
function WeddingCalendar({
  wedding,
  onSave,
}: {
  wedding: Invitation["wedding"];
  onSave: () => void;
}) {
  const confirmed = wedding.confirmed && validDateTime(wedding.dateTime);
  const value = confirmed ? wedding.dateTime! : wedding.demoDateTime;
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  if (!validDateTime(value))
    return <p className="muted">예식 날짜와 시간을 준비 중입니다.</p>;
  const { year, month, day, cells } = calendarFor(value);
  return (
    <>
      <p className="event-date">
        {confirmed ? formatWedding(value) : "예식 날짜와 시간을 준비 중입니다"}
      </p>
      {!confirmed && (
        <p className="small muted">
          아래 달력은 디자인 확인을 위한 임시 예시입니다
        </p>
      )}
      <div
        className="calendar"
        aria-label={`${year}년 ${month}월 ${confirmed ? "예식 달력" : "예시 달력"}`}
      >
        <p className="calendar-month">
          {year}. {String(month).padStart(2, "0")}
          <span>{confirmed ? "" : "예시"}</span>
        </p>
        <table>
          <thead>
            <tr>
              {["일", "월", "화", "수", "목", "금", "토"].map((weekday, i) => (
                <th
                  key={weekday}
                  scope="col"
                  className={i === 0 ? "sunday" : ""}
                >
                  {weekday}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: cells.length / 7 }, (_, row) => (
              <tr key={row}>
                {cells.slice(row * 7, row * 7 + 7).map((number, col) => (
                  <td key={col} className={col === 0 ? "sunday" : ""}>
                    <span
                      className={number === day ? "wedding-day" : ""}
                      aria-label={
                        number === day
                          ? `${month}월 ${day}일 ${confirmed ? "결혼식" : "예시 결혼식"}`
                          : undefined
                      }
                    >
                      {number}
                      {number === day && <Icon name="heart" size={10} />}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="d-day">
        {confirmed ? "우리의 시작까지" : "예시 날짜 기준"}{" "}
        <strong>{dDayLabel(daysUntil(value, now))}</strong>
      </p>
      <button className="button subtle" disabled={!confirmed} onClick={onSave}>
        <Icon name="calendar" />
        {confirmed ? "일정 저장하기" : "날짜 확정 후 일정 저장"}
      </button>
    </>
  );
}
export default function App() {
  const [toast, setToast] = useState("");
  const [manual, setManual] = useState<{ value: string; label: string } | null>(
    null,
  );
  const [playing, setPlaying] = useState(false);
  const [musicFailed, setMusicFailed] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);
  const [kakaoFailed, setKakaoFailed] = useState(false);
  const [secretOpen, setSecretOpen] = useState(false);
  const [inBackroom, setInBackroom] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const playAttempt = useRef(0);
  const playbackPending = useRef(false);
  const musicWanted = useRef(Boolean(config.music.src));
  const resumePoint = useRef<number | null>(null);
  const returnMusic = useRef({ playing: false, time: 0, scroll: 0 });
  const backroomEntry = useRef<HTMLButtonElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localPreview = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
  const { root: revealRoot, enabled: motionEnabled } = useReveal(inBackroom ? "off" : localPreview ? "on" : "auto");
  const thanks = config.stage === "thank-you";
  const dateConfirmed =
    config.wedding.confirmed && validDateTime(config.wedding.dateTime);
  const links = mapLinks(config.venue);
  const hasMusic = Boolean(config.music.src);
  const currentMusic = inBackroom && config.backroom ? config.backroom.music : config.music;
  const hasAudio = Boolean(config.music.src || config.backroom?.music.src);
  const names = `${config.couple.groom} · ${config.couple.bride}`;
  const hasKakao = Boolean(config.share.kakaoJavaScriptKey && config.share.siteUrl);
  useEffect(() => {
    if (!hasKakao) return;
    let active = true;
    // 미리 연결해 버튼 탭 안에서 공유 호출을 즉시 실행할 수 있게 합니다.
    loadKakao().then((kakao) => {
      if (!kakao.isInitialized()) kakao.init(config.share.kakaoJavaScriptKey);
      if (active) setKakaoReady(true);
    }).catch(() => { if (active) setKakaoFailed(true); });
    return () => { active = false; };
  }, [hasKakao]);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );
  useEffect(() => {
    const player = audio.current;
    return () => {
      playAttempt.current += 1;
      playbackPending.current = false;
      player?.pause();
    };
  }, [hasAudio]);
  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4200);
  }, []);
  async function copy(value: string, label: string, message?: string) {
    if (!value) {
      notify(`${label} 정보를 준비 중입니다.`);
      return;
    }
    if (await copyText(value)) notify(message ?? `${label}를 복사했어요.`);
    else setManual({ value, label });
  }
  const requestPlayback = useCallback(async function playMusic(
    player: HTMLAudioElement,
    backroom: boolean,
    automatic = false,
  ) {
    musicWanted.current = true;
    const attempt = ++playAttempt.current;
    playbackPending.current = true;
    try {
      await player.play();
      if (attempt === playAttempt.current) {
        setPlaying(!player.paused);
        setMusicFailed(false);
      }
    } catch (error) {
      if (attempt !== playAttempt.current) return;
      const name = error && typeof error === "object" && "name" in error ? error.name : "";
      if (automatic && (name === "NotAllowedError" || name === "AbortError")) return;
      setPlaying(false);
      setMusicFailed(true);
      notify(backroom
        ? "비트를 재생하지 못했어요. 비트 켜기를 다시 눌러 주세요."
        : "음악을 재생하지 못했어요. 다시 누르거나 다른 브라우저에서 확인해주세요.");
    } finally {
      if (attempt === playAttempt.current) playbackPending.current = false;
    }
  }, [notify]);
  useEffect(() => {
    if (hasMusic && audio.current) void requestPlayback(audio.current, false, true);
  }, [hasMusic, requestPlayback]);
  useEffect(() => {
    const player = audio.current;
    if (!player) return;
    const resume = (gesture = false) => {
      if (!musicWanted.current || !player.getAttribute("src") || !player.paused || player.error) return;
      if (!gesture && playbackPending.current) return;
      void requestPlayback(player, inBackroom, true);
    };
    const onGesture = (event: Event) => {
      if (event instanceof window.KeyboardEvent && (
        event.repeat || event.isComposing ||
        ["Escape", "Tab", "Shift", "Control", "Alt", "Meta"].includes(event.key)
      )) return;
      if (event.target instanceof window.Element && event.target.closest(".music-button, .br-music, .secret-submit, .br-exit")) return;
      resume(true);
    };
    const onResume = () => resume();
    const onVisible = () => {
      if (document.visibilityState === "visible") resume();
    };
    const events = ["pointerup", "touchend", "click", "keydown"] as const;
    for (const event of events) document.addEventListener(event, onGesture, true);
    player.addEventListener("canplay", onResume);
    window.addEventListener("pageshow", onResume);
    window.addEventListener("focus", onResume);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      for (const event of events) document.removeEventListener(event, onGesture, true);
      player.removeEventListener("canplay", onResume);
      window.removeEventListener("pageshow", onResume);
      window.removeEventListener("focus", onResume);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [hasAudio, inBackroom, requestPlayback]);
  function toggleMusic() {
    if (!audio.current || !currentMusic.src) return;
    if (playing) {
      musicWanted.current = false;
      playAttempt.current += 1;
      playbackPending.current = false;
      audio.current.pause();
      setPlaying(false);
    } else {
      void requestPlayback(audio.current, inBackroom);
    }
  }
  function switchMusic(track: Invitation["music"], shouldPlay: boolean, time: number, backroom: boolean) {
    const player = audio.current;
    musicWanted.current = Boolean(track.src && shouldPlay);
    playAttempt.current += 1;
    playbackPending.current = false;
    setPlaying(false);
    setMusicFailed(false);
    resumePoint.current = track.src ? time : null;
    if (!player) return;
    player.pause();
    player.load();
    if (!track.src) return;
    try { player.currentTime = time; } catch { /* 메타데이터가 준비되면 재생 위치를 복구합니다. */ }
    if (shouldPlay) void requestPlayback(player, backroom);
  }
  function enterBackroom() {
    if (!config.backroom) return;
    returnMusic.current = {
      playing: musicWanted.current,
      time: audio.current?.currentTime ?? 0,
      scroll: window.scrollY,
    };
    playAttempt.current += 1;
    audio.current?.pause();
    flushSync(() => { setSecretOpen(false); setInBackroom(true); setPlaying(false); setMusicFailed(false); });
    switchMusic(config.backroom.music, true, 0, true);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function exitBackroom() {
    const previous = returnMusic.current;
    playAttempt.current += 1;
    audio.current?.pause();
    flushSync(() => { setInBackroom(false); setPlaying(false); setMusicFailed(false); });
    switchMusic(config.music, previous.playing, previous.time, false);
    backroomEntry.current?.focus({ preventScroll: true });
    window.scrollTo({ top: previous.scroll, behavior: "instant" });
  }
  function saveCalendar() {
    try {
      const content = createCalendarEvent({
        dateTime: config.wedding.dateTime,
        confirmed: config.wedding.confirmed,
        title: `${names} 결혼식`,
        location: [config.venue.name, config.venue.hall, config.venue.address]
          .filter(Boolean)
          .join(" "),
        durationMinutes: config.wedding.durationMinutes,
      });
      const url = URL.createObjectURL(
        new Blob([content], { type: "text/calendar;charset=utf-8" }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "wedding.ics";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      notify("확정된 예식 일시만 저장할 수 있어요.");
    }
  }
  const shareUrl = () => config.share.siteUrl || window.location.href;
  async function nativeShare() {
    if (navigator.share)
      try {
        await navigator.share({
          title: config.share.title,
          text: config.share.description,
          url: shareUrl(),
        });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    await copy(shareUrl(), "청첩장 링크");
  }
  async function kakaoShare() {
    if (!kakaoReady || !window.Kakao) {
      await copy(
        shareUrl(),
        "청첩장 링크",
        "링크를 복사했어요. 카카오톡 대화창에 붙여넣어 주세요.",
      );
      return;
    }
    setSharing(true);
    try {
      const kakao = window.Kakao;
      kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: config.share.title,
          description: config.share.description,
          imageUrl: new URL(config.share.image, config.share.siteUrl).href,
          link: {
            mobileWebUrl: config.share.siteUrl,
            webUrl: config.share.siteUrl,
          },
        },
        buttons: [
          {
            title: "청첩장 보기",
            link: {
              mobileWebUrl: config.share.siteUrl,
              webUrl: config.share.siteUrl,
            },
          },
        ],
      });
    } catch {
      await copy(
        shareUrl(),
        "청첩장 링크",
        "카카오톡 연결 대신 링크를 복사했어요. 대화창에 붙여넣어 주세요.",
      );
    } finally {
      setSharing(false);
    }
  }
  return (
    <>
      <main id="invitation" className="invitation" ref={revealRoot} hidden={inBackroom} aria-hidden={inBackroom || undefined} data-motion={motionEnabled ? "on" : "off"}>
        <a className="skip-link" href="#greeting">
          초대의 글로 바로가기
        </a>
        <header className="hero">
          <div className="hero-top">
            <span className="eyebrow">WEDDING INVITATION</span>
            {hasMusic && <button
              className={`music-button ${playing ? "is-playing" : ""}`}
              onClick={toggleMusic}
              aria-pressed={playing}
              aria-label={
                playing ? "음악 끄기" : "음악 켜기"
              }
              title={config.music.title}
            >
              <Icon name={playing ? "pause" : "music"} size={16} />
              <span>
                {playing
                    ? "음악 끄기"
                    : musicFailed
                      ? "다시 재생"
                      : "음악 켜기"}
              </span>
            </button>}
          </div>
          <p className="hero-prelude">
            {thanks ? "함께해 주셔서 감사합니다" : config.text.opening}
          </p>
          <h1>
            {config.couple.groom}
            <span className="name-divider">그리고</span>
            {config.couple.bride}
          </h1>
          <div className="hero-photo">
            <Photo
              key={config.photos.hero?.src}
              photo={config.photos.hero}
              eager
            />
          </div>
          {!thanks && (
            <div className="hero-event">
              <p>
                {dateConfirmed
                  ? formatWedding(config.wedding.dateTime!)
                  : "예식 날짜 · 시간 미정"}
              </p>
              <p>
                {config.venue.confirmed && config.venue.name
                  ? [config.venue.name, config.venue.hall, config.venue.floor]
                      .filter(Boolean)
                      .join(" · ")
                  : "예식 장소 미정"}
              </p>
            </div>
          )}
          <div className="hero-tail">
            <span />
            <Icon name="leaf" size={21} />
            <span />
          </div>
        </header>
        <section className="section greeting" id="greeting">
          <SectionTitle english="INVITATION">
            {thanks ? "감사의 마음을 전합니다" : "평생 같이 웃을 사람"}
          </SectionTitle>
          <div className="invitation-text">
            {(thanks ? config.text.closing : config.text.invitation).map(
              (line, i) => (
                <p key={i}>{line}</p>
              ),
            )}
          </div>
          {!thanks && (
            <div className="families">
              {config.families
                .filter((f) => f.visible)
                .map((family) => (
                  <p key={family.id}>
                    {family.confirmed ? (
                      <>
                        <span className="family-members">
                          {family.members?.length
                            ? family.members.map((member, index) => (
                                <span className="family-member" key={member.name}>
                                  {index > 0 && <span className="family-separator">·</span>}
                                  {member.name}
                                  {member.memorial && <Chrysanthemum />}
                                </span>
                              ))
                            : family.names}
                        </span>
                        <span className="family-relation">
                          {family.relation}
                        </span>
                        <strong>{family.person}</strong>
                      </>
                    ) : (
                      <>
                        <span className="muted">가족 표기 미정</span>
                        <strong>{family.person}</strong>
                      </>
                    )}
                  </p>
                ))}
            </div>
          )}
          {!thanks && config.text.notice && (
            <p className="invitation-notice">{config.text.notice}</p>
          )}
          {!thanks && config.privacy.showContacts && (
            <a className="button text-button" href="#contacts">
              <Icon name="phone" size={16} />
              연락하기
              <Icon name="chevron" size={14} />
            </a>
          )}
        </section>
        {!thanks && (
          <section className="section date-section" id="date">
            <SectionTitle english="OUR WEDDING DAY">예식 일시</SectionTitle>
            <WeddingCalendar wedding={config.wedding} onSave={saveCalendar} />
          </section>
        )}
        <section className="section gallery-section" id="gallery">
          <SectionTitle english="OUR MOMENTS">함께한 순간</SectionTitle>
          <Gallery photos={config.photos.gallery} />
        </section>
        {!thanks && (
          <section className="section location-section" id="location">
            <SectionTitle english="LOCATION">오시는 길</SectionTitle>
            <h3 className="venue-name">
              {config.venue.confirmed && config.venue.name
                ? config.venue.name
                : "예식 장소를 준비 중입니다"}
            </h3>
            {config.venue.confirmed && (
              <p>
                {[config.venue.hall, config.venue.floor]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <p className="address">
              {config.venue.confirmed && config.venue.address
                ? config.venue.address
                : "예식장이 정해지면 주소와 교통편을 안내드릴게요"}
            </p>
            <button
              className="button text-button"
              disabled={!config.venue.confirmed || !config.venue.address}
              onClick={() => copy(config.venue.address, "주소")}
            >
              <Icon name="copy" size={15} />
              주소 복사
            </button>
            <VenueMap venue={config.venue} />
            <div className="map-buttons">
              {links ? (
                <>
                  <a
                    className="button"
                    href={links.naver}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="naver-logo">N</span>네이버지도
                  </a>
                  <a
                    className="button"
                    href={links.kakao}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon name="pin" size={16} />
                    카카오맵
                  </a>
                </>
              ) : (
                <>
                  <button className="button" disabled>
                    <span className="naver-logo">N</span>네이버지도
                  </button>
                  <button className="button" disabled>
                    <Icon name="pin" size={16} />
                    카카오맵
                  </button>
                </>
              )}
            </div>
            {config.venue.website && (
              <a className="venue-website" href={config.venue.website} target="_blank" rel="noopener noreferrer">예식장 홈페이지</a>
            )}
            <div className="directions">
              <div>
                <h3>대중교통</h3>
                {config.venue.transit.length ? (
                  config.venue.transit.map((line, i) => <p key={i}>{line}</p>)
                ) : (
                  <p className="muted">지하철 · 버스 안내를 준비 중입니다.</p>
                )}
              </div>
              <div>
                <h3>자가용 및 주차</h3>
                {config.venue.parking.length ? (
                  config.venue.parking.map((line, i) => <p key={i}>{line}</p>)
                ) : (
                  <p className="muted">
                    주차 위치와 이용 안내를 준비 중입니다.
                  </p>
                )}
              </div>
              {config.venue.notices?.length ? (
                <div><h3>ATM 안내</h3>{config.venue.notices.map((line, i) => <p key={i}>{line}</p>)}</div>
              ) : null}
            </div>
          </section>
        )}
        {!thanks && config.privacy.showContacts && (
          <section className="section contacts-section" id="contacts">
            <SectionTitle english="CONTACT">연락하기</SectionTitle>
            <div className="contacts">
              {config.contacts.map((contact) => {
                const tel = phoneHref(contact.phone, contact.consent, "tel"),
                  sms = phoneHref(contact.phone, contact.consent, "sms");
                return (
                  <div className="contact-row" key={contact.id}>
                    <span className="contact-role">{contact.role}</span>
                    <strong>{contact.name}</strong>
                    <div className="contact-actions">
                      {tel && sms ? (
                        <>
                          <a
                            className="icon-button"
                            href={tel}
                            aria-label={`${contact.role} ${contact.name}에게 전화하기`}
                          >
                            <Icon name="phone" />
                          </a>
                          <a
                            className="icon-button"
                            href={sms}
                            aria-label={`${contact.role} ${contact.name}에게 문자 보내기`}
                          >
                            <Icon name="message" />
                          </a>
                        </>
                      ) : (
                        <span className="small muted">연락처 준비 중</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        {!thanks && config.privacy.showAccounts && (
          <section className="section accounts-section" id="accounts">
            <SectionTitle english="WITH LOVE">마음 전하실 곳</SectionTitle>
            <p className="section-description">
              보내주시는 따뜻한 마음에
              <br />
              깊이 감사드립니다.
            </p>
            <div className="account-groups">
              {config.accounts.map((group) => (
                <details key={group.id} className="account-group">
                  <summary>
                    {group.title}
                    <Icon name="chevron" size={17} />
                  </summary>
                  <div className="account-list">
                    {group.items.map((account) => {
                      const enabled =
                        !account.sample &&
                        account.consent &&
                        Boolean(account.number?.trim()) && /[0-9]/.test(account.number ?? "");
                      return (
                        <div className="account" key={account.id}>
                          <div className="account-person">
                            <span>{account.relation}</span>
                            <strong>{account.name}</strong>
                          </div>
                          <p>
                            {enabled
                              ? account.bank
                              : "계좌 정보를 준비 중입니다"}
                            {account.sample && (
                              <span className="example-tag">예시</span>
                            )}
                          </p>
                          <p className="account-number">
                            {enabled
                              ? account.number
                              : "예시은행 / 계좌번호 미입력"}
                          </p>
                          <div className="account-bottom">
                            <span>
                              예금주 {enabled ? account.holder : "미입력"}
                            </span>
                            <button
                              className="button copy-button"
                              disabled={!enabled}
                              onClick={() => copy(account.number!, "계좌번호")}
                            >
                              <Icon name="copy" size={14} />
                              복사
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}
        <footer className="closing">
          <div className="closing-photo">
            <Photo
              key={config.photos.closing?.src}
              photo={config.photos.closing}
            />
          </div>
          <div className="closing-content">
            <Icon name="heart" size={21} />
            <div className="closing-text">
              {config.text.closing.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
            <p className="closing-names">
              {config.couple.groom}
              <span>그리고</span>
              {config.couple.bride}
            </p>
            <div className="share-actions">
              <button
                className="button kakao-button"
                onClick={kakaoShare}
                disabled={sharing || (hasKakao && !kakaoReady && !kakaoFailed)}
              >
                <Icon name="message" size={17} />
                {sharing ? "연결 중" : hasKakao && !kakaoReady && !kakaoFailed ? "카카오톡 준비 중" : !hasKakao || kakaoFailed ? "카카오톡에 링크 복사" : "카카오톡으로 전하기"}
              </button>
              <div className="share-secondary">
                <button
                  className="button text-button"
                  onClick={() => copy(shareUrl(), "청첩장 링크")}
                >
                  <Icon name="copy" size={15} />
                  링크 복사
                </button>
                <span />
                <button className="button text-button" onClick={nativeShare}>
                  <Icon name="share" size={16} />
                  공유하기
                </button>
              </div>
            </div>
            {config.backroom?.code && (
              <button
                ref={backroomEntry}
                className="backroom-entry"
                type="button"
                aria-label="시크릿 코드 입력"
                onClick={() => setSecretOpen(true)}
              >
                BACKROOM ↗
              </button>
            )}
          </div>
        </footer>
      </main>
      {inBackroom && config.backroom && (
        <Backroom
          photos={config.backroom.photos}
          video={config.backroom.video}
          names={config.couple}
          dateLabel={dateConfirmed ? formatWedding(config.wedding.dateTime!) : "예식 날짜 준비 중"}
          venueLabel={[config.venue.name, config.venue.hall, config.venue.floor].filter(Boolean).join(" · ")}
          motionEnabled={localPreview || !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches}
          playing={playing}
          musicFailed={musicFailed}
          onToggleMusic={toggleMusic}
          onExit={exitBackroom}
        />
      )}
      {hasAudio && (
        <audio
          ref={audio}
          src={currentMusic.src ?? undefined}
          loop={currentMusic.loop}
          preload={currentMusic.src ? "auto" : "none"}
          onLoadedMetadata={() => {
            if (resumePoint.current === null || !audio.current) return;
            try { audio.current.currentTime = resumePoint.current; resumePoint.current = null; } catch { /* 미디어를 탐색할 수 없으면 기본 위치를 유지합니다. */ }
          }}
          onPlay={(event) => {
            setPlaying(!event.currentTarget.paused);
          }}
          onPause={(event) => setPlaying(!event.currentTarget.paused)}
          onEnded={() => setPlaying(false)}
          onError={() => {
            playAttempt.current += 1;
            playbackPending.current = false;
            setMusicFailed(true);
            setPlaying(false);
            notify(
              inBackroom
                ? "비트를 불러오지 못했어요. BACKROOM은 계속 보실 수 있습니다."
                : "음악 파일을 불러오지 못했어요. 청첩장은 계속 보실 수 있습니다.",
            );
          }}
        />
      )}
      <div
        className={`toast ${toast ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
      {manual && <ManualCopy {...manual} onClose={() => setManual(null)} />}
      {secretOpen && config.backroom && <SecretEntrance code={config.backroom.code} onClose={() => setSecretOpen(false)} onUnlock={enterBackroom} />}
    </>
  );
}
