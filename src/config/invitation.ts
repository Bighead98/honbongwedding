// 이 파일에서 청첩장 내용을 바꾸세요. null은 미정이며 실제 정보로 대체하지 않습니다.
export interface Photo {
  id: string;
  src: string;
  srcSet?: string;
  width?: number;
  height?: number;
  alt: string;
  position?: string; // 예: '50% 35%' — 사진별로 중요한 부분의 위치 조정
  sample: boolean;
}
export interface Contact {
  id: string;
  role: string;
  name: string;
  phone: string | null;
  consent: boolean; // 당사자가 공개에 동의했을 때 true
}
export interface Account {
  id: string;
  relation: string;
  name: string;
  bank: string;
  holder: string;
  number: string | null;
  consent: boolean;
  sample: boolean;
}
export interface Invitation {
  mode: "demo" | "live";
  stage: "invitation" | "thank-you";
  couple: {
    groom: string;
    bride: string;
    namesConfirmed: boolean;
    english?: string;
  };
  wedding: {
    dateTime: string | null;
    confirmed: boolean;
    durationMinutes: number;
    demoDateTime: string;
  };
  venue: {
    name: string;
    hall: string;
    floor: string;
    address: string;
    confirmed: boolean;
    lat: number | null;
    lng: number | null;
    transit: string[];
    parking: string[];
    notices?: string[];
    mapImage?: string;
    naverUrl?: string;
    website?: string;
  };
  text: { opening: string; invitation: string[]; closing: string[]; notice?: string };
  families: {
    id: string;
    names: string;
    members?: { name: string; memorial?: boolean }[];
    relation: string;
    person: string;
    visible: boolean;
    confirmed: boolean;
  }[];
  contacts: Contact[];
  accounts: { id: string; title: string; items: Account[] }[];
  privacy: {
    showContacts: boolean;
    showAccounts: boolean;
    consentConfirmed: boolean;
  };
  photos: { hero: Photo | null; gallery: Photo[]; closing: Photo | null };
  music: {
    src: string | null;
    title: string;
    loop: boolean;
    rightsConfirmed: boolean;
  };
  backroom?: {
    code: string;
    music: Invitation["music"];
    photos: Photo[];
    video?: { src: string; poster?: string; label: string };
  };
  share: {
    siteUrl: string;
    title: string;
    description: string;
    image: string;
    imageSample: boolean;
    kakaoJavaScriptKey: string;
  };
  operation: { retentionYears: number; publicFrom: string | null };
}

const photo = (id: string, alt: string): Photo => ({
  id,
  src: `/images/wedding-${id}-960.webp`,
  srcSet: `/images/wedding-${id}-480.webp 480w, /images/wedding-${id}-960.webp 960w, /images/wedding-${id}-1440.webp 1440w`,
  alt,
  position: "50% 50%",
  sample: false,
});
const backroomPhoto = (id: string, alt: string, height: number): Photo => ({
  id: `backroom-${id}`,
  src: `/images/backroom-${id}.webp`,
  srcSet: `/images/backroom-${id}-480.webp 480w, /images/backroom-${id}.webp 960w`,
  width: 960,
  height,
  alt,
  sample: false,
});

export const invitation: Invitation = {
  mode: "demo", // 실제 정보 검수 후 'live'로 변경. check:publish 검사도 통과해야 합니다.
  stage: "invitation", // 예식 후 'thank-you'로 바꾸면 연락처·계좌·일시·교통이 화면에서 사라집니다.
  couple: {
    groom: "이호정",
    bride: "박소정",
    namesConfirmed: true,
    english: "",
  },
  wedding: {
    dateTime: "2027-07-03T16:20:00+09:00", // 사용자 제공, Asia/Seoul
    confirmed: true,
    durationMinutes: 60,
    demoDateTime: "2027-04-24T13:00:00+09:00", // 달력 디자인용 예시입니다. 일정 저장 불가.
  },
  venue: {
    name: "웨딩 시그니처",
    hall: "트리니티 홀",
    floor: "2층",
    address: "서울특별시 마포구 양화로 87",
    confirmed: true,
    lat: null,
    lng: null,
    transit: [
      "지하철 2·6호선 합정역 2번 출구에서 도보 약 4분",
      "홍대입구역 공항철도·경의중앙선 1번 출구에서 도보 약 11분",
    ],
    parking: [
      "일반 하객은 입차 시간 기준 2시간 무료입니다.",
      "본 건물 · H스퀘어 · 서교빌딩 주차장을 이용합니다.",
      "건물 정문에서 주차요원의 안내를 받아주세요.",
    ],
    notices: [
      "예식장 내 ATM이 없습니다. 현금이 필요하신 분은 옆 건물 우리은행 ATM을 이용해주세요.",
    ], // 사용자 제공, 기기 운영 여부는 예식 전 확인
    mapImage: "/images/venue-map.svg",
    website: "https://signatureconvention.com/",
    naverUrl: "https://map.naver.com/?elng=56e4d2b61b90d6558bd4d131a3949d39&eelat=96179ddacd8a560772f7ac43566ad556&elat=87cee17a8a2b20d839bd537e6edfd26a&eText=%EC%9B%A8%EB%94%A9%EC%8B%9C%EA%B7%B8%EB%8B%88%EC%B2%98&eelng=f4dcabd74278dee25467eebef0d05a2a", // 공식 오시는 길에서 제공하는 장소 링크
  },
  text: {
    opening: "작은 다정함을, 오래오래",
    invitation: [
      "잘 잤는지 물어보고",
      "잘 자라고 말해 주는 일.",
      "그런 작은 다정함을",
      "서로에게 오래 건네려 합니다.",
      "호정과 소정이",
      "서로의 가족이 되는 날,",
      "오셔서 함께 웃어 주세요.",
      "그 웃음까지 잘 간직하겠습니다.",
    ],
    closing: ["나눠 주시는 다정한 마음을", "저희의 매일에 오래 담아둘게요."],
    notice: "화환은 정중히 사양합니다.",
  },
  families: [
    {
      id: "groom-family",
      names: "이창균 · 이주은",
      members: [{ name: "이창균" }, { name: "이주은", memorial: true }],
      relation: "의 아들",
      person: "이호정",
      visible: true,
      confirmed: true,
    },
    {
      id: "bride-family",
      names: "박길순 · 조진희",
      members: [{ name: "박길순" }, { name: "조진희" }],
      relation: "의 딸",
      person: "박소정",
      visible: true,
      confirmed: true,
    },
  ],
  contacts: [],
  accounts: [
    {
      id: "groom",
      title: "신랑 측",
      items: [
        {
          id: "groom-account",
          relation: "신랑",
          name: "이호정",
          bank: "국민은행",
          holder: "이호정",
          number: "939302-00-320965",
          consent: true,
          sample: false,
        },
        {
          id: "groom-father-account",
          relation: "신랑 아버지",
          name: "이창균",
          bank: "기업은행",
          holder: "이창균",
          number: "387-005012-02-021",
          consent: true,
          sample: false,
        },
      ],
    },
    {
      id: "bride",
      title: "신부 측",
      items: [
        {
          id: "bride-account",
          relation: "신부",
          name: "박소정",
          bank: "우리은행",
          holder: "박소정",
          number: "1002-558-253664",
          consent: true,
          sample: false,
        },
        {
          id: "bride-mother-account",
          relation: "신부 어머니",
          name: "조진희",
          bank: "신한은행",
          holder: "조진희",
          number: "110-054-104784",
          consent: true,
          sample: false,
        },
        {
          id: "bride-family-account",
          relation: "신부 부",
          name: "박길순",
          bank: "국민은행",
          holder: "박길순",
          number: "544302-01-152570",
          consent: true,
          sample: false,
        },
      ],
    },
  ],
  privacy: { showContacts: false, showAccounts: true, consentConfirmed: false },
  photos: {
    hero: photo("0070", "흰 테이블에 기대어 미소 짓는 소정과 소정을 바라보는 호정"),
    gallery: [
      photo("0070", "흰 테이블에 기대어 미소 짓는 두 사람"),
      photo("1065", "밝은 문 앞에 나란히 선 소정과 호정"),
      photo("1301", "베일을 쓴 소정과 손을 잡은 호정"),
      photo("1362", "창가에서 흰 드레스와 부케를 함께한 소정"),
      photo("1499", "도시가 보이는 창가에서 소정을 안아 올린 호정"),
      photo("2073", "계단에서 입을 맞추는 두 사람"),
      photo("2473", "흰 부케를 든 소정의 흑백 사진"),
      photo("3425", "밤의 횡단보도에서 손을 잡고 걷는 두 사람"),
      photo("3602", "밤거리에서 서로를 비추며 웃는 두 사람"),
      photo("1153", "베일을 두르고 문을 지나가는 소정의 뒷모습"),
    ],
    closing: photo("3425", "밤의 횡단보도에서 손을 잡고 함께 걷는 두 사람"),
  },
  music: { src: "/audio/A_song.mp3", title: "배경음악", loop: true, rightsConfirmed: false },
  backroom: {
    code: "honbong98",
    music: { src: "/audio/B_song.mp3", title: "BACKROOM 비트", loop: true, rightsConfirmed: false },
    photos: [
      backroomPhoto("01", "픽셀 선글라스를 살짝 내리고 흰 셔츠 차림으로 나란히 선 두 사람", 1440),
      backroomPhoto("02", "밤 창가의 가죽 의자에 나란히 앉아 부케와 함께 포즈를 취한 두 사람", 1440),
      backroomPhoto("03", "에겐남 글자가 적힌 검은 티셔츠를 입고 책상 앞에 앉은 모습", 1280),
      backroomPhoto("04", "금색 꽃 조형물 앞에서 선글라스를 쓰고 브이 포즈로 웃는 두 사람", 720),
      backroomPhoto("05", "앞치마를 입고 나란히 쿠키를 꾸미는 두 사람", 640),
      backroomPhoto("06", "비옷을 입고 공연장 입구에서 브이 포즈를 취하는 두 사람", 1280),
      backroomPhoto("07", "넓은 실내 공간에서 토끼 인형을 들고 웃는 모습", 1280),
      backroomPhoto("08", "실내 낚시터에서 분홍 앞치마를 입고 뜰채를 든 모습", 1280),
      backroomPhoto("09", "야구 유니폼을 입고 관람석에서 브이 포즈를 취하는 두 사람", 1280),
      backroomPhoto("10", "잔을 들어 보이며 미소 짓는 두 사람의 셀카", 1280),
    ],
    video: { src: "/video/backroom.mp4", poster: "/images/backroom-video-poster.jpg", label: "머리띠와 눈사람 소품을 든 두 사람의 포토부스 영상" },
  },
  share: {
    siteUrl: "https://honbongmarry.co.kr", // 구매·연결한 HTTPS 대표 도메인. 예: https://실제주소
    title: "이호정 · 박소정의 결혼 소식",
    description:
      "2027년 7월 3일 토요일 오후 4시 20분 · 웨딩 시그니처 2층 트리니티 홀",
    image: "/images/og-cover-actual.jpg",
    imageSample: false,
    kakaoJavaScriptKey: "", // 공개 가능한 JavaScript 키만. REST/Admin 키·토큰은 넣지 마세요.
  },
  operation: { retentionYears: 1, publicFrom: null }, // 공개일부터 1년 희망. 갱신/종료는 직접 관리.
};
