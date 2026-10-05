import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type SyntheticEvent } from "react";
import type { Photo as PhotoData } from "../config/invitation";
import Photo from "./Photo";
import { useBackroomEntryScroll } from "../lib/useBackroomEntryScroll";

interface BackroomProps {
  photos: PhotoData[];
  video?: { src: string; poster?: string; label: string };
  names: { groom: string; bride: string };
  dateLabel: string;
  venueLabel: string;
  motionEnabled: boolean;
  playing: boolean;
  musicFailed: boolean;
  onToggleMusic: () => void;
  onExit: () => void;
}

const moods = [
  { text: "기분이 좋아졌어~~", theme: "good", face: "😀" },
  { text: "기분이 안 좋아졌어~~~~~", theme: "bad", face: "😤" },
  { text: "흐음!!!!", theme: "hmm", face: "🤨" },
];
const photoAngles = ["-5deg", "4deg", "3deg", "-4deg", "-3deg", "5deg"];
const photoNotes = [
  "이게 사랑의 증거라고?",
  "침착함은 두고 왔어.",
  "분위기? 우리가 만들지.",
  "설명은 생략한다.",
  "아무튼 우리 편.",
  "좋아, 이대로 가자.",
];
const photoScenes: Record<string, { layout: string; caption: string; label: string }> = {
  "backroom-01": { layout: "poster", caption: "이런 모청 처음이지? 드루와! 드루와!!", label: "MAIN CHARACTERS" },
  "backroom-02": { layout: "film", caption: "분위기는 누아르, 장르는 로맨스.", label: "A LOVE FILM / TAKE 02" },
  "backroom-03": { layout: "portrait", caption: "갸르르르르르르르릉", label: "에겐력 MAX" },
  "backroom-04": { layout: "collage-red", caption: "홍콩 마 접수했다!!", label: "GOLDEN MAIN ENERGY" },
  "backroom-05": { layout: "collage-lime", caption: "자기야~ 오븐에 들어가고 싶어?", label: "LOVE: OVERHEATING" },
  "backroom-06": { layout: "battle", caption: "우의 풀장착. 오늘도 둘이 출격.", label: "FIELD REPORT / TEAM LOVE" },
  "backroom-07": { layout: "powerup", caption: "나도 쥬디 인형 갖고 싶어~~ (땡깡)", label: "POWER UP +999" },
  "backroom-08": { layout: "portrait", caption: "꺄아아아아아아악", label: "안광력 MAX" },
  "backroom-09": { layout: "ticket", caption: "오늘은 승리한다 (롯데가, 두산이).", label: "ADMIT TWO / SAME TEAM" },
  "backroom-10": { layout: "celebration", caption: "잔 들어! 우리 팀 승리!", label: "VICTORY LAP!!!!" },
};

export default function Backroom({
  photos,
  video,
  names,
  dateLabel,
  venueLabel,
  motionEnabled,
  playing,
  musicFailed,
  onToggleMusic,
  onExit,
}: BackroomProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const videoElement = useRef<HTMLVideoElement>(null);
  const [moodStep, setMoodStep] = useState(0);
  const mood = moods[moodStep % moods.length];
  const groomPortrait = photos.find((photo) => photo.id === "backroom-03");
  const bridePortrait = photos.find((photo) => photo.id === "backroom-08");
  const hasDuel = Boolean(groomPortrait && bridePortrait);
  const videoInPhotos = photos.some((photo) => photo.id === "backroom-06");
  const musicLabel = playing
    ? "비트 끄기"
    : musicFailed
      ? "다시 재생"
      : "비트 켜기";

  useBackroomEntryScroll(heading);

  useLayoutEffect(() => {
    const element = videoElement.current;
    if (!element) return;
    element.defaultMuted = true;
    element.muted = true;
    let active = true;
    let blocked = false;
    let pending = false;

    const requestPlayback = () => {
      if (!active || pending) return;
      element.muted = true;
      pending = true;
      let request: Promise<void> | undefined;
      try {
        request = element.play();
      } catch (error) {
        request = Promise.reject(error);
      }
      void Promise.resolve(request)
        .then(() => {
          if (!active) return;
          pending = false;
          blocked = false;
        })
        .catch(() => {
          if (!active) return;
          pending = false;
          blocked = true;
        });
    };

    const retryForPointer = (event: PointerEvent) => {
      if (blocked && event.button === 0) requestPlayback();
    };
    const retryForKeyboard = (event: KeyboardEvent) => {
      if (
        !blocked || event.repeat || event.isComposing ||
        ["Escape", "Tab", "Shift", "Control", "Alt", "Meta"].includes(event.key)
      ) return;
      requestPlayback();
    };
    const retryWhenVisible = () => {
      if (blocked && document.visibilityState === "visible") requestPlayback();
    };

    window.addEventListener("pointerdown", retryForPointer, true);
    window.addEventListener("keydown", retryForKeyboard, true);
    document.addEventListener("visibilitychange", retryWhenVisible);
    requestPlayback();

    return () => {
      active = false;
      window.removeEventListener("pointerdown", retryForPointer, true);
      window.removeEventListener("keydown", retryForKeyboard, true);
      document.removeEventListener("visibilitychange", retryWhenVisible);
      element.pause();
    };
  }, [video?.src]);

  function keepVideoMuted(event: SyntheticEvent<HTMLVideoElement>) {
    const element = event.currentTarget;
    if (!element.muted) element.muted = true;
  }

  function renderPhoto(photo: PhotoData, index: number, layoutOverride?: string) {
    const scene = photoScenes[photo.id];
    const layout = layoutOverride ?? scene?.layout ?? ["collage-red", "film", "collage-lime"][index % 3];
    return (
      <figure
        className={`br-photo-card br-photo-${layout}`}
        style={{
          "--br-card-angle": photoAngles[index % photoAngles.length],
          "--br-card-delay": `${index * -1.3}s`,
        } as CSSProperties}
      >
        <span className="br-photo-type">{scene?.label ?? "LOVE FILE / UNCLASSIFIED"}</span>
        <Photo
          key={photo.src}
          photo={photo}
          eager={index === 0}
          sizes="(max-width: 600px) 92vw, 900px"
          className="br-photo-image"
        />
        <figcaption>
          <span className="br-photo-number">{String(index + 1).padStart(2, "0")}</span>
          <span className="br-photo-caption">{scene?.caption ?? photoNotes[index % photoNotes.length]}</span>
          <span className="br-photo-mark" aria-hidden="true">↗</span>
        </figcaption>
      </figure>
    );
  }

  function renderVideo() {
    if (!video) return null;
    return (
      <section className="br-video-section" aria-labelledby="br-video-title">
        <p className="br-section-index">BONUS / STILL NOT CALM</p>
        <h2 id="br-video-title">움직이는<br /><span>증거까지.</span></h2>
        <div className="br-video-frame" onContextMenu={(event) => event.preventDefault()}>
          <video
            key={video.src}
            ref={videoElement}
            src={video.src}
            poster={video.poster}
            controls={false}
            controlsList="nodownload nofullscreen noremoteplayback"
            disablePictureInPicture
            disableRemotePlayback
            x-webkit-airplay="deny"
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
            tabIndex={-1}
            draggable={false}
            aria-label={video.label}
            onPlay={keepVideoMuted}
            onVolumeChange={keepVideoMuted}
          >
            이 브라우저에서는 영상을 재생할 수 없습니다.
          </video>
        </div>
      </section>
    );
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || event.isComposing)
        return;
      event.preventDefault();
      onExit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onExit]);

  return (
    <main
      id="backroom"
      className="backroom"
      tabIndex={-1}
      data-motion={motionEnabled ? "on" : "off"}
      data-mood={mood.theme}
      aria-label={`${names.groom}과 ${names.bride}의 Backroom`}
    >
      <div className="br-shell">
        <header className="br-toolbar">
          <span className="br-mode-tag">AFTER HOURS / LOVE CLUB</span>
          <button className="br-exit" type="button" onClick={onExit}>
            <span aria-hidden="true">↗</span> 원래 청첩장으로
          </button>
        </header>

        <section className="br-hero" aria-labelledby="br-title">
          <p className="br-kicker">BACKROOM</p>
          <div className="br-title-wrap">
            <h1 id="br-title" className="br-title" ref={heading} tabIndex={-1} aria-label="작전명: 평생 한 팀">
              <span>작전명:</span>
              <span className="br-title-room">평생 한 팀</span>
            </h1>
            <span className="br-stamp" aria-hidden="true">
              자기야!!!!
            </span>
          </div>
          <p className="br-couple">{names.groom} <span>×</span> {names.bride}</p>
          <div className="br-hero-bottom">
            <span className="br-small-print">NO RETREAT. JUST LOVE.</span>
            <button
              className="br-music"
              type="button"
              onClick={onToggleMusic}
              aria-pressed={playing}
              aria-label={playing ? "비트 끄기" : "비트 켜기"}
            >
              <span className="br-beat-icon" aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>
              {musicLabel}
            </button>
          </div>
          {musicFailed && !playing && (
            <p className="br-music-error" role="status">
              비트가 잠깐 쉬는 중. 다시 눌러주세요.
            </p>
          )}
        </section>

        <div className="br-ticker" aria-hidden="true">
          <div className="br-ticker-track">
            {[0, 1].map((copy) => (
              <span className="br-ticker-copy" key={copy}>
                LOVE IS LOUD <b>✳</b> 둘이면 일단 해볼 만해 <b>✳</b> LOVE IS LOUD <b>✳</b>
              </span>
            ))}
          </div>
        </div>

        <section className="br-manifesto" aria-labelledby="br-manifesto-title">
          <p className="br-section-index">01 / THE DECLARATION</p>
          <h2 id="br-manifesto-title">
            너가 선택한<br />결혼이다.
          </h2>
          <p className="br-battlecry">악으로 깡으로<br />견뎌라!!!</p>
          <p className="br-soft-note">물론, 서로 꼭 안아주면서.</p>

          <div className="br-ransom">
            <p className="br-ransom-piece br-ransom-red">난 버려졌어!!!!</p>
            <p className="br-ransom-piece br-ransom-lime">맞짱!!!!</p>
          </div>

          <div className="br-mood">
            <p className="br-mood-label">TODAY&apos;S MOOD</p>
            <button
              type="button"
              className="br-mood-button"
              aria-label="기분 바꾸기"
              aria-describedby="br-mood-status"
              onClick={() => setMoodStep((previous) => previous + 1)}
            >
              <span
                className="br-mood-emoji"
                aria-hidden="true"
                style={{ "--br-mood-turn": `${moodStep * 720}deg` } as CSSProperties}
              >
                {mood.face}
              </span>
            </button>
            <p id="br-mood-status" className="br-mood-text" role="status" aria-live="polite" aria-atomic="true">
              {mood.text}
            </p>
          </div>
        </section>

        {photos.length > 0 && (
          <section className="br-photos" aria-labelledby="br-photos-title">
            <div className="br-photos-heading">
              <p className="br-section-index">02 / THE EVIDENCE</p>
              <h2 id="br-photos-title">증거는<br /><span>충분해.</span></h2>
              <p className="br-photo-intro">우리가 같이 있으면<br />이렇게 됩니다.</p>
            </div>
            <div className="br-photo-grid">
              {photos.map((photo, index) => {
                if (hasDuel && photo.id === "backroom-08") return null;
                return (
                  <Fragment key={photo.id}>
                    {hasDuel && photo.id === "backroom-03" && groomPortrait && bridePortrait ? (
                      <section className="br-duel" aria-label={`${names.groom}과 ${names.bride}의 대결 무대`}>
                        <div className="br-duel-heading">
                          <span><b>호냥이</b></span>
                          <strong>VS</strong>
                          <span><b>의정부 맑눈광</b></span>
                        </div>
                        <p className="br-duel-rule">에겐력 MAX <span>×</span> 안광력 MAX</p>
                        <div className="br-duel-grid">
                          {renderPhoto(groomPortrait, index, "duelist")}
                          {renderPhoto(bridePortrait, photos.indexOf(bridePortrait), "duelist")}
                        </div>
                        <p className="br-duel-result">판정: 둘 다 이김.</p>
                      </section>
                    ) : renderPhoto(photo, index)}
                    {index === Math.floor((photos.length - 1) / 2) && (
                      <p className="br-photo-callout">으어어어어어어</p>
                    )}
                    {photo.id === "backroom-06" && renderVideo()}
                  </Fragment>
                );
              })}
            </div>
            <p className="br-photo-roar">구아아아아아악</p>
          </section>
        )}

        {!videoInPhotos && renderVideo()}

        <footer className="br-footer">
          <p className="br-section-index">03 / SHOW UP FOR LOVE</p>
          <div className="br-mission-card">
            <span className="br-mission-star" aria-hidden="true">✳</span>
            <p className="br-mission-label">오늘의 미션: 우리 결혼식에 와주기</p>
            <h2>{names.groom} <span>×</span> {names.bride}</h2>
            <p className="br-mission-date">{dateLabel}</p>
            <p className="br-mission-venue">{venueLabel}</p>
          </div>
          <button className="br-exit br-exit-bottom" type="button" onClick={onExit}>
            원래 청첩장으로 <span aria-hidden="true">↗</span>
          </button>
          <p className="br-signoff">끝까지 같이. 꽤 시끄럽게.</p>
        </footer>
      </div>
    </main>
  );
}
