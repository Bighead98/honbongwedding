import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import type { Invitation } from "../src/config/invitation";
import { invitation } from "../src/config/invitation";
import { mapLinks, phoneHref } from "../src/lib/actions";
import {
  calendarFor,
  createCalendarEvent,
  dDayLabel,
  daysUntil,
  formatWedding,
  seoulParts,
  validDateTime,
} from "../src/lib/date";
import { releaseIssues } from "../src/lib/validation";

// 모든 값은 테스트 전용 합성 데이터다. 실제 인물·행사·연락처·계좌가 아니다.
function configuredInvitation(): Invitation {
  return {
    mode: "live",
    stage: "invitation",
    couple: {
      groom: "테스트 신랑",
      bride: "테스트 신부",
      namesConfirmed: true,
    },
    wedding: {
      dateTime: "2027-01-01T13:00:00+09:00",
      confirmed: true,
      durationMinutes: 90,
      demoDateTime: "2027-04-24T13:00:00+09:00",
    },
    venue: {
      name: "검증용 행사 공간",
      hall: "검증 홀",
      floor: "1층",
      address: "검증용 도로명 주소",
      confirmed: true,
      lat: 37.5,
      lng: 127,
      transit: ["검증용 교통 안내"],
      parking: ["검증용 주차 안내"],
    },
    text: {
      opening: "소중한 분들을 초대합니다",
      invitation: ["함께해 주시면 감사하겠습니다."],
      closing: ["감사합니다."],
    },
    families: [
      {
        id: "test-family",
        names: "테스트 보호자",
        relation: "자녀",
        person: "테스트 신랑",
        visible: true,
        confirmed: true,
      },
    ],
    contacts: [
      {
        id: "test-contact",
        role: "신랑",
        name: "테스트 신랑",
        phone: "010-0000-0000",
        consent: true,
      },
    ],
    accounts: [
      {
        id: "test-group",
        title: "신랑 측",
        items: [
          {
            id: "test-account",
            relation: "신랑",
            name: "테스트 신랑",
            bank: "검증 은행",
            holder: "테스트 신랑",
            number: "000000000000",
            consent: true,
            sample: false,
          },
        ],
      },
    ],
    privacy: { showContacts: true, showAccounts: true, consentConfirmed: true },
    photos: {
      hero: {
        id: "test-hero",
        src: "/test-hero.webp",
        alt: "검증용 사진",
        sample: false,
      },
      gallery: [
        {
          id: "test-gallery",
          src: "/test-gallery.webp",
          alt: "검증용 사진",
          sample: false,
        },
      ],
      closing: {
        id: "test-closing",
        src: "/test-closing.webp",
        alt: "검증용 사진",
        sample: false,
      },
    },
    music: {
      src: "/test-audio.mp3",
      title: "검증용 곡",
      loop: true,
      rightsConfirmed: true,
    },
    share: {
      siteUrl: "https://hojeong-sojeong.test",
      title: "두 사람의 결혼 소식",
      description: "소중한 분들을 초대합니다.",
      image: "/test-og.jpg",
      imageSample: false,
      kakaoJavaScriptKey: "",
    },
    operation: { retentionYears: 1, publicFrom: null },
  };
}

const fixedNow = new Date("2026-10-04T01:02:03.400Z");
const calendarOptions = {
  dateTime: "2027-01-01T13:00:00+09:00",
  confirmed: true,
  title: "두 사람의 결혼식",
  location: "검증용 행사 공간",
  durationMinutes: 90,
};

describe("서울 기준 날짜와 달력", () => {
  it("사용자가 지정한 예식일은 토요일 오후 4시 20분이며 2026년 10월 4일 기준 272일 남는다", () => {
    const value = "2027-07-03T16:20:00+09:00";
    assert.match(formatWedding(value), /토요일/);
    assert.match(formatWedding(value), /오후 4:20/);
    assert.equal(daysUntil(value, new Date("2026-10-04T12:00:00+09:00")), 272);
  });
  it("UTC의 전날 밤을 서울의 다음 날짜로 해석한다", () => {
    assert.deepEqual(seoulParts(new Date("2026-12-31T15:00:00Z")), {
      year: 2027,
      month: 1,
      day: 1,
    });
    assert.deepEqual(seoulParts(new Date("2026-12-31T14:59:59Z")), {
      year: 2026,
      month: 12,
      day: 31,
    });
  });

  it("D-day를 서울 날짜 경계에서 계산하고 월말·연말·윤일을 처리한다", () => {
    const cases: { target: string; now: string; expected: number }[] = [
      {
        target: "2027-01-01T13:00:00+09:00",
        now: "2026-12-31T14:59:59Z",
        expected: 1,
      },
      {
        target: "2027-01-01T13:00:00+09:00",
        now: "2026-12-31T15:00:00Z",
        expected: 0,
      },
      {
        target: "2027-01-01T13:00:00+09:00",
        now: "2027-01-01T15:00:00Z",
        expected: -1,
      },
      {
        target: "2026-11-01T13:00:00+09:00",
        now: "2026-10-31T12:00:00+09:00",
        expected: 1,
      },
      {
        target: "2024-03-01T13:00:00+09:00",
        now: "2024-02-28T23:59:00+09:00",
        expected: 2,
      },
      {
        target: "2027-01-01T13:00:00+09:00",
        now: "2027-01-01T23:59:59+09:00",
        expected: 0,
      },
    ];
    for (const scenario of cases) {
      assert.equal(
        daysUntil(scenario.target, new Date(scenario.now)),
        scenario.expected,
        scenario.now,
      );
    }
    assert.equal(dDayLabel(1), "D-1");
    assert.equal(dDayLabel(0), "D-day");
    assert.equal(dDayLabel(-2), "D+2");
  });

  it("윤년 2월의 29일과 목요일 위치, 주 단위 빈칸을 맞춘다", () => {
    const leap = calendarFor("2024-02-29T13:00:00+09:00");
    assert.deepEqual(
      { year: leap.year, month: leap.month, day: leap.day },
      {
        year: 2024,
        month: 2,
        day: 29,
      },
    );
    assert.deepEqual(leap.cells.slice(0, 5), [null, null, null, null, 1]);
    assert.equal(leap.cells.filter((day) => day !== null).length, 29);
    assert.equal(leap.cells.indexOf(29) % 7, 4);
    assert.equal(leap.cells.length % 7, 0);
    assert.deepEqual(leap.cells.slice(-2), [null, null]);
    assert.match(formatWedding("2024-02-29T13:00:00+09:00"), /목요일/);
    assert.match(formatWedding("2024-02-29T13:00:00+09:00"), /오후 1:00/);
  });

  it("평년 2월과 일요일로 시작하는 달에 불필요한 앞 빈칸을 넣지 않는다", () => {
    const regular = calendarFor("2026-02-01T13:00:00+09:00");
    assert.equal(regular.cells[0], 1);
    assert.equal(regular.cells.filter((day) => day !== null).length, 28);
    assert.equal(regular.cells.length, 28);
    assert.match(formatWedding("2026-02-01T13:00:00+09:00"), /일요일/);
  });

  it("윤일은 허용하고 자동 보정되는 날짜·시간과 서울이 아닌 형식을 거부한다", () => {
    assert.equal(validDateTime("2024-02-29T13:00:00+09:00"), true);
    for (const value of [
      null,
      "",
      "2023-02-29T13:00:00+09:00",
      "2026-02-30T13:00:00+09:00",
      "2026-04-31T13:00:00+09:00",
      "2026-13-01T13:00:00+09:00",
      "2026-01-01T24:00:00+09:00",
      "2026-01-01T13:60:00+09:00",
      "2026-01-01T13:00:00Z",
      "2026-01-01T13:00+09:00",
      "날짜 미정",
    ]) {
      assert.equal(validDateTime(value), false, String(value));
    }
  });
});

describe("확정된 일정의 ICS 내보내기", () => {
  it("미확정·미입력·잘못된 날짜를 하객 일정으로 저장하지 않는다", () => {
    assert.throws(
      () =>
        createCalendarEvent({ ...calendarOptions, confirmed: false }, fixedNow),
      /확정/,
    );
    assert.throws(
      () =>
        createCalendarEvent({ ...calendarOptions, dateTime: null }, fixedNow),
      /확정/,
    );
    assert.throws(
      () =>
        createCalendarEvent(
          {
            ...calendarOptions,
            dateTime: "2026-02-30T13:00:00+09:00",
          },
          fixedNow,
        ),
      /확정/,
    );
  });

  it("서울 일시를 올바른 UTC 시작·종료 시각으로 내보내고 CRLF를 사용한다", () => {
    const ics = createCalendarEvent(calendarOptions, fixedNow);
    assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
    assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
    assert.ok(ics.includes("DTSTAMP:20261004T010203Z\r\n"));
    assert.ok(ics.includes("DTSTART:20270101T040000Z\r\n"));
    assert.ok(ics.includes("DTEND:20270101T053000Z\r\n"));
    assert.equal(ics.replace(/\r\n/g, "").includes("\n"), false);
  });

  it("한글·이모지의 UTF-8 바이트를 기준으로 75바이트 이하 접기와 텍스트 이스케이프를 지킨다", () => {
    const title =
      "두 사람, 결혼; 초대\\감사\n새로운 시작 " + "🌷한글".repeat(30);
    const location = "검증 홀\r\n1층, 정원; 입구\\안내";
    const ics = createCalendarEvent(
      { ...calendarOptions, title, location },
      fixedNow,
    );
    const physicalLines = ics.split("\r\n").filter(Boolean);
    assert.ok(
      physicalLines.some((line) => line.startsWith(" ")),
      "긴 UTF-8 문자열은 접혀야 한다.",
    );
    for (const line of physicalLines) {
      assert.ok(
        Buffer.byteLength(line, "utf8") <= 75,
        "75바이트 초과: " + line,
      );
      assert.ok(
        !line.includes("\uFFFD"),
        "접기 중 유니코드 문자가 깨지면 안 된다.",
      );
    }
    const unfolded = ics.replace(/\r\n[ \t]/g, "");
    assert.ok(
      unfolded.includes(
        "SUMMARY:두 사람\\, 결혼\\; 초대\\\\감사\\n새로운 시작 " +
          "🌷한글".repeat(30) +
          "\r\n",
      ),
    );
    assert.ok(
      unfolded.includes("LOCATION:검증 홀\\n1층\\, 정원\\; 입구\\\\안내\r\n"),
    );
  });
});

describe("공개 전 검사", () => {
  it("완전히 확정된 합성 fixture는 통과하고 미확정 합성 초안은 공개를 막는다", () => {
    assert.deepEqual(releaseIssues(configuredInvitation()), []);
    const draft = configuredInvitation();
    draft.mode = "demo";
    draft.couple.namesConfirmed = false;
    draft.wedding.confirmed = false;
    draft.venue.confirmed = false;
    draft.privacy.consentConfirmed = false;
    draft.share.siteUrl = "";
    draft.share.imageSample = true;
    draft.photos.hero!.sample = true;
    draft.accounts[0].items[0].sample = true;
    const fields = new Set(releaseIssues(draft).map((issue) => issue.field));
    for (const expected of [
      "mode",
      "couple.namesConfirmed",
      "wedding",
      "venue",
      "privacy.consentConfirmed",
      "share.siteUrl",
      "share.image",
    ]) {
      assert.ok(fields.has(expected), expected + " 경고가 있어야 한다.");
    }
    assert.ok([...fields].some((field) => field.startsWith("photos.")));
    assert.ok([...fields].some((field) => field.startsWith("accounts.")));
  });

  it("미확정 일시·장소와 보이는 가족 표기는 검수를 요구한다", () => {
    const config = configuredInvitation();
    config.wedding.confirmed = false;
    config.venue.confirmed = false;
    config.families[0].confirmed = false;
    const fields = releaseIssues(config).map((issue) => issue.field);
    assert.ok(fields.includes("wedding"));
    assert.ok(fields.includes("venue"));
    assert.ok(fields.includes("families.test-family"));
    config.families[0].visible = false;
    assert.ok(
      !releaseIssues(config).some((issue) =>
        issue.field.startsWith("families."),
      ),
    );
  });

  it("공개 연락처·계좌의 당사자 동의와 음원 게시 권한을 검수한다", () => {
    const config = configuredInvitation();
    config.contacts[0].consent = false;
    config.accounts[0].items[0].consent = false;
    config.music.rightsConfirmed = false;
    const fields = releaseIssues(config).map((issue) => issue.field);
    assert.ok(fields.includes("contacts.test-contact.consent"));
    assert.ok(fields.includes("accounts.test-account.consent"));
    assert.ok(fields.includes("music.rightsConfirmed"));
    config.music.src = null;
    assert.ok(
      !releaseIssues(config).some(
        (issue) => issue.field === "music.rightsConfirmed",
      ),
    );
  });

  it("BACKROOM 코드를 확인하고 별도 음원의 게시 권한도 공개 전에 검수한다", () => {
    const config = configuredInvitation();
    config.backroom = {
      code: 'synthetic-backroom-code',
      music: { src: '/synthetic-backroom-audio.mp3', title: '검증 비트', loop: true, rightsConfirmed: false },
      photos: structuredClone(config.photos.gallery),
    };
    assert.ok(releaseIssues(config).some(issue => issue.field === 'backroom.music.rightsConfirmed'));
    config.backroom.music.rightsConfirmed = true;
    assert.deepEqual(releaseIssues(config), []);
    config.backroom.code = '   ';
    assert.ok(releaseIssues(config).some(issue => issue.field === 'backroom.code'));
  });

  it("계좌를 실제 항목이라고 표시해도 공백 번호·샘플 은행은 공개 준비로 인정하지 않는다", () => {
    const config = configuredInvitation();
    config.accounts[0].items[0].number = "   ";
    assert.ok(
      releaseIssues(config).some(
        (issue) => issue.field === "accounts.test-account",
      ),
    );
    config.accounts[0].items[0].number = "000000000000";
    config.accounts[0].items[0].bank = "예시은행";
    assert.ok(
      releaseIssues(config).some(
        (issue) => issue.field === "accounts.test-account",
      ),
    );
  });

  it("숫자가 없는 공개 연락처와 샘플 공유 이미지·HTTP 대표주소를 거부한다", () => {
    const config = configuredInvitation();
    config.contacts[0].phone = "--------";
    config.share.siteUrl = "http://hojeong-sojeong.test";
    config.share.imageSample = true;
    const fields = releaseIssues(config).map((issue) => issue.field);
    assert.ok(fields.includes("contacts.test-contact"));
    assert.ok(fields.includes("share.siteUrl"));
    assert.ok(fields.includes("share.image"));
  });

  it("감사 화면에서는 지나간 미확정 예식 정보와 가족 표기를 다시 요구하지 않는다", () => {
    const config = configuredInvitation();
    config.stage = "thank-you";
    config.wedding.dateTime = null;
    config.wedding.confirmed = false;
    config.venue.confirmed = false;
    config.families[0].confirmed = false;
    config.contacts = [];
    config.accounts = [];
    config.privacy.showContacts = false;
    config.privacy.showAccounts = false;
    assert.deepEqual(releaseIssues(config), []);
  });
});

describe("현재 기본 설정", () => {
  it("카카오 지도는 사용자가 지정한 예식장 장소 링크로 연결한다", () => {
    assert.equal(invitation.venue.kakaoUrl, "https://place.map.kakao.com/803348028");
    assert.equal(mapLinks(invitation.venue)?.kakao, invitation.venue.kakaoUrl);
  });

  it("연락처는 숨기고 신랑 측 두 계좌·신부 측 세 계좌는 번호와 공개 동의를 갖춘 실제 항목으로 지정한다", () => {
    assert.equal(invitation.privacy.showContacts, false);
    assert.equal(invitation.privacy.showAccounts, true);
    const accounts = invitation.accounts.flatMap((group) => group.items);
    assert.equal(accounts.length, 5);
    assert.equal(invitation.accounts.find((group) => group.title === "신랑 측")?.items.length, 2);
    assert.equal(invitation.accounts.find((group) => group.title === "신부 측")?.items.length, 3);
    for (const account of accounts) {
      assert.equal(account.sample, false);
      assert.equal(account.consent, true);
      // 실제 계좌번호를 테스트나 실패 출력에 복제하지 않고 준비 상태만 검사한다.
      assert.ok(typeof account.number === "string" && account.number.trim().length > 0);
      assert.ok(/[0-9]/.test(account.number ?? ""));
    }
  });
});

describe("연락처와 지도 링크의 안전한 대안", () => {
  it("연락처 공개 동의가 없거나 번호가 비었으면 전화·문자 주소를 만들지 않는다", () => {
    assert.equal(phoneHref("010-0000-0000", false, "tel"), null);
    assert.equal(phoneHref("010-0000-0000", false, "sms"), null);
    assert.equal(phoneHref(null, true, "tel"), null);
    assert.equal(phoneHref("", true, "sms"), null);
  });

  it("동의한 번호의 구분 문자를 제거하고 국제번호의 +는 보존한다", () => {
    assert.equal(phoneHref("010-0000-0000", true, "tel"), "tel:01000000000");
    assert.equal(
      phoneHref("+82 (10) 0000-0000", true, "sms"),
      "sms:+821000000000",
    );
    for (const phone of ["--------", "        ", "12", "010-ABCD-0000"]) {
      assert.equal(phoneHref(phone, true, "tel"), null, phone);
    }
  });

  it("장소 미확정·공백 이름·공백 주소에서는 실제 지도 링크를 만들지 않는다", () => {
    const venue = { ...configuredInvitation().venue, kakaoUrl: "https://kakao.test/place" };
    assert.equal(mapLinks({ ...venue, confirmed: false }), null);
    assert.equal(mapLinks({ ...venue, name: "" }), null);
    assert.equal(mapLinks({ ...venue, name: "   " }), null);
    assert.equal(mapLinks({ ...venue, address: "   " }), null);
  });

  it("HTTPS 설정 지도 링크는 좌표 유무와 관계없이 생성된 대체 링크보다 우선한다", () => {
    const venue = {
      ...configuredInvitation().venue,
      naverUrl: "https://naver.test/place",
      kakaoUrl: "https://kakao.test/place",
    };
    for (const coords of [{ lat: 37.5, lng: 127 }, { lat: null, lng: null }]) {
      assert.deepEqual(mapLinks({ ...venue, ...coords }), {
        naver: venue.naverUrl,
        kakao: venue.kakaoUrl,
      });
    }
  });

  it("카카오 설정 링크가 없거나 HTTPS가 아니면 좌표 길찾기·장소 검색을 유지한다", () => {
    const venue = configuredInvitation().venue;
    for (const kakaoUrl of [undefined, "", "http://kakao.test/place", "javascript:alert(1)"]) {
      const coordinateLinks = mapLinks({ ...venue, kakaoUrl });
      assert.ok(coordinateLinks);
      assert.equal(coordinateLinks.kakao, `https://map.kakao.com/link/to/${encodeURIComponent(venue.name)},37.5,127`);
      const searchLinks = mapLinks({ ...venue, kakaoUrl, lat: null, lng: null });
      assert.ok(searchLinks);
      assert.equal(searchLinks.kakao, `https://map.kakao.com/link/search/${encodeURIComponent(`${venue.name} ${venue.address}`)}`);
    }
  });

  it("한글 장소명·주소를 인코딩하고 좌표가 있으면 카카오 길찾기를 사용한다", () => {
    const venue = {
      ...configuredInvitation().venue,
      name: "검증 홀, 정원",
      address: "검증로 1 & 별관",
    };
    const links = mapLinks(venue);
    assert.ok(links);
    assert.equal(
      decodeURIComponent(new URL(links.naver).pathname.split("/search/")[1]),
      venue.name + " " + venue.address,
    );
    assert.ok(links.kakao.startsWith("https://map.kakao.com/link/to/"));
    assert.ok(links.kakao.endsWith(",37.5,127"));
    assert.ok(links.kakao.includes(encodeURIComponent(venue.name)));
  });

  it("좌표 미입력·비정상·범위 초과 시 API 키 없이 장소 검색으로 돌아간다", () => {
    const venue = configuredInvitation().venue;
    const coords: { lat: number | null; lng: number | null }[] = [
      { lat: null, lng: null },
      { lat: null, lng: 127 },
      { lat: 37.5, lng: null },
      { lat: Number.NaN, lng: 127 },
      { lat: 37.5, lng: Number.POSITIVE_INFINITY },
      { lat: 90.01, lng: 127 },
      { lat: 37.5, lng: -180.01 },
    ];
    for (const point of coords) {
      const links = mapLinks({ ...venue, ...point });
      assert.ok(links);
      assert.ok(links.kakao.startsWith("https://map.kakao.com/link/search/"));
      assert.equal(
        decodeURIComponent(links.kakao.split("/search/")[1]),
        venue.name + " " + venue.address,
      );
    }
  });
});
