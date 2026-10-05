# 사진과 음원 출처

갱신일: **2026년 10월 5일 (Asia/Seoul)**.

## 현재 사용하는 실제 웨딩사진

사용자가 제공한 `E:\1\260912 0703 이호정 박소정 님 헤이쥬드` 폴더에서 사진 10장을 선택했습니다. 대표 사진은 **`YUP_0070.JPG`**입니다. 개인 청첩장이나 참고 사이트에서 가져온 사진은 사용하지 않습니다. 사용자의 사진 적용 요청을 받아 작업했으며 사진가와의 계약상 웹 게시 권한은 별도 확인 대상입니다.

| 사용자 원본 | 공개 사본 파일 이름 |
| --- | --- |
| `YUP_0070.JPG` | `wedding-0070-{480,960,1440}.webp` — 대표 사진 |
| `YUP_1065.JPG` | `wedding-1065-{480,960,1440}.webp` |
| `YUP_1153.JPG` | `wedding-1153-{480,960,1440}.webp` |
| `YUP_1301.JPG` | `wedding-1301-{480,960,1440}.webp` |
| `YUP_1362.JPG` | `wedding-1362-{480,960,1440}.webp` |
| `YUP_1499.JPG` | `wedding-1499-{480,960,1440}.webp` |
| `YUP_2073.JPG` | `wedding-2073-{480,960,1440}.webp` |
| `YUP_2473.JPG` | `wedding-2473-{480,960,1440}.webp` |
| `YUP_3425.JPG` | `wedding-3425-{480,960,1440}.webp` |
| `YUP_3602.JPG` | `wedding-3602-{480,960,1440}.webp` |

공개 사본은 `public/images/`에 있습니다. 별도 공유 이미지는 **`og-cover-actual.jpg`(1200×630px)**입니다. 현재 청첩장과 공유 설정은 이 실제 사진 파일을 참조하며 샘플 사진 표시를 해제했습니다.

## 원본 보관과 처리 내역

선택한 JPEG 원본은 `assets/user-originals/`에 변경 없이 복사해 보관했습니다. 이 폴더는 `.gitignore`에 등록했고 `public/` 밖에 두어 Vite 배포물에 자동 포함되지 않습니다.

웹용 사본은 원본의 EXIF 방향을 적용한 뒤 비율을 유지해 가로 **480·960·1440px**, **WebP 품질 84**로 생성했습니다. **색·밝기 조정과 사진 크롭은 하지 않았습니다.** 파일 용량을 줄이기 위한 리사이즈·압축과 방향 적용만 수행했습니다. 공개 사본에는 EXIF/GPS/XMP를 전달하지 않았습니다. `YUP_2473.JPG`의 흑백은 원본 자체의 표현이며 변환 과정에서 흑백 처리하지 않았습니다.

원본 파일명·크기·SHA-256·원본 방향·공개 사본별 크기는 [처리 명세](../output/user-photo-preview/manifest.json)에 기록했습니다. 현재 대표·갤러리 사진은 원본 2:3 비율과 `object-fit: contain`으로 자르지 않고 표시하며 확대창에서도 전체 사진을 볼 수 있습니다. 갤러리는 2열입니다. 사진을 교체할 때는 실제 사진 설정과 OG 이미지를 함께 변경합니다.

## Backroom 사진과 영상

사용자가 **2026-10-05**에 프로젝트의 `backroom image/` 폴더로 제공한 JPG 10장과 MP4 1개입니다. 앞서 받은 웨딩사진 폴더와 별개로 모든 사진을 직접 열어 내용과 방향을 확인했습니다. 원본 폴더의 파일은 변경하거나 삭제하지 않았습니다. 원본 사진·영상 폴더와 `music/`는 `.gitignore`에 등록했으며, 공개용 사본만 `public/`에서 제공합니다.

사진 번호는 원본 파일 이름 오름차순으로 고정했습니다. 각 사진은 `public/images/backroom-XX.webp`와 `backroom-XX-480.webp`로 제공합니다. 다음 크기는 기본 사본의 실제 픽셀 크기입니다.

| 번호 | 사용자 원본(`backroom image/` 기준) | 기본 공개 사본 | 크기 | 확인한 내용 |
| --- | --- | --- | --- | --- |
| 01 | `KakaoTalk_20261005_141627443.jpg` | `backroom-01.webp` | 960 × 1440 | 흰 셔츠와 픽셀 선글라스를 착용한 두 사람 |
| 02 | `KakaoTalk_20261005_141641961.jpg` | `backroom-02.webp` | 960 × 1440 | 밤 창가의 가죽 의자에 부케와 함께 앉은 두 사람 |
| 03 | `KakaoTalk_20261005_141658864.jpg` | `backroom-03.webp` | 960 × 1280 | ‘에겐남’ 티셔츠를 입고 책상 앞에 앉은 모습 |
| 04 | `KakaoTalk_20261005_141730587.jpg` | `backroom-04.webp` | 960 × 720 | 금색 꽃 조형물 앞에서 선글라스를 쓴 두 사람 |
| 05 | `KakaoTalk_20261005_141757942.jpg` | `backroom-05.webp` | 960 × 640 | 앞치마를 입고 쿠키를 꾸미는 두 사람 |
| 06 | `KakaoTalk_20261005_141815769.jpg` | `backroom-06.webp` | 960 × 1280 | 비옷을 입고 공연장 입구에서 찍은 사진 |
| 07 | `KakaoTalk_20261005_141845901.jpg` | `backroom-07.webp` | 960 × 1280 | 넓은 실내 공간에서 토끼 인형을 든 모습 |
| 08 | `KakaoTalk_20261005_141921840.jpg` | `backroom-08.webp` | 960 × 1280 | 실내 낚시터에서 분홍 앞치마를 입고 뜰채를 든 모습 |
| 09 | `KakaoTalk_20261005_142138239.jpg` | `backroom-09.webp` | 960 × 1280 | 야구 유니폼을 입고 관람석에서 찍은 사진 |
| 10 | `KakaoTalk_20261005_142146836.jpg` | `backroom-10.webp` | 960 × 1280 | 잔을 들어 보이는 두 사람의 셀카 |

JPG 원본 10장 모두 EXIF가 있었고 9장에는 GPS 메타데이터가 있었습니다. 공개용 JPG 원본을 복사하는 대신 EXIF 방향을 픽셀에 적용한 새 사본을 만들고 **EXIF/GPS/XMP를 제거했습니다**. **색·밝기·크롭은 변경하지 않았으며 업스케일도 하지 않았습니다.** 기본 사본은 최대 가로 **960px**, 작은 사본은 **480px**, WebP 품질은 **86**입니다. 실제 원본 너비가 480px 이상인 경우에만 작은 사본을 생성하며 이번 10장은 모두 해당됩니다.

7장에 포함된 정상 **Display P3 ICC 색상 프로파일**은 원본의 색 표현을 유지하기 위해 보존했습니다. 공개 사본 20개를 다시 열어 디코딩, 실제 치수, EXIF/GPS/XMP가 없는 상태와 프로파일 보존을 확인했습니다. 20개 WebP 합계는 **1,733,164 bytes**입니다. 원본 10장의 SHA-256은 처리 전후 동일합니다. 각 원본의 치수·방향·메타데이터 유무와 사본별 경로·치수·크기·SHA-256·한국어 대체 설명은 [Backroom 자산 처리 명세](../output/backroom-assets.json)에 기록했습니다. 명세의 `srcSet`은 생성된 파일의 실제 가로 크기를 사용합니다.

영상 원본 `backroom image/KakaoTalk_20261005_142109073.mp4`는 `public/video/backroom.mp4`로 **변경 없이 복사**했습니다. 원본과 공개 사본의 SHA-256은 `3a9ded09afcd382338abc6fd864d5d761c2de20d1665d6fdabf3b5b338312ffb`로 같습니다.

- **960 × 640px**, **10.959초**, **1,373,734 bytes**
- H.264 Constrained Baseline, `avc1`, `yuv420p`, 약 9fps
- 오디오 스트림 없음. 위치/GPS 메타데이터 없음
- 재인코딩·색 조정·크롭·메타데이터 재포장 없음
- `ffmpeg` 전체 영상 디코딩 검사에서 오류 없음
- 공개 폴더 밖의 [영상 확인 프레임](../output/backroom-preview.jpg)을 추출해 실제 내용을 확인

확인 프레임에는 포토부스에서 크리스마스 머리띠와 눈사람 소품을 든 두 사람이 보입니다. 사용자 요청에 따라 Backroom에서 `autoPlay`, `muted`, `playsInline`, `loop`, `preload="auto"`로 자동 무한 반복을 시도합니다. 재생 컨트롤·수동 재생 버튼과 영상 자체의 포인터·키보드 조작은 제공하지 않으며, 자동 재생이 차단되면 이후 사용자 동작에서 재시도합니다. 확인 프레임을 `public/images/backroom-video-poster.jpg`에도 복사해 포스터로 연결했습니다. 실제 휴대폰에서의 영상 재생은 별도 검수 항목입니다.

## 보존한 이전 스톡 사진

초안에서 사용했던 아래 Pexels 사진은 **현재 청첩장 설정에서 사용하지 않습니다**. 원본(`assets/originals/`), 이전 공개 사본과 출처 기록은 보존했습니다. `public/images/`에 남은 파일은 Vite 빌드 시 함께 복사될 수 있으므로 ‘미사용’과 ‘파일 삭제’는 구분합니다.

아래 작가·원본 페이지·[Pexels 공식 라이선스](https://www.pexels.com/license/)는 2026년 10월 4일에 확인했습니다. 당시 라이선스는 웹사이트·초대장 사용과 수정을 허용하며 출처 표기는 필수는 아니지만 기록을 남깁니다. 재판매·스톡 플랫폼 재배포·인물의 추천이나 보증을 암시하는 사용 등에는 제한이 있습니다.

| 이전 사본(`public/images/` 기준) | 작가 | 공식 원본 페이지 |
| --- | --- | --- |
| `hero-{480,960,1440}.webp` | Aşkın polat | [Pexels 16589107](https://www.pexels.com/photo/newlyweds-in-black-and-white-16589107/) |
| `gallery-01-{480,960}.webp` | Denys Gromov | [Pexels 17034946](https://www.pexels.com/photo/wedding-bouquet-of-white-roses-17034946/) |
| `gallery-02-{480,960}.webp` | Jhon Macias | [Pexels 36413331](https://www.pexels.com/photo/elegant-wedding-rings-on-a-floral-bouquet-36413331/) |
| `gallery-03-{480,960}.webp` | with cloudd | [Pexels 20704637](https://www.pexels.com/photo/arches-made-of-white-flowers-and-leaves-for-wedding-20704637/) |
| `gallery-04-{480,960}.webp` | Beyzaa Yurtkuran | [Pexels 15419257](https://www.pexels.com/photo/a-bunch-of-white-flowers-in-a-glass-vase-15419257/) |
| `gallery-05-{480,960}.webp` | Tara Winstead | [Pexels 7666515](https://www.pexels.com/photo/white-flowers-in-clear-glass-vase-7666515/) |
| `gallery-06-{480,960}.webp` | Fer ID | [Pexels 34255232](https://www.pexels.com/photo/elegant-outdoor-wedding-arch-with-white-roses-34255232/) |
| `gallery-07-{480,960}.webp` | Alexander Mass | [Pexels 35546896](https://www.pexels.com/photo/elegant-floral-arrangement-on-wooden-arch-outdoors-35546896/) |
| `gallery-08-{480,960}.webp` | Monika Cichosz | [Pexels 36863759](https://www.pexels.com/photo/elegant-white-rose-bouquet-with-wedding-rings-36863759/) |
| `closing-{480,960}.webp` | Mustafa Akın | [Pexels 33070027](https://www.pexels.com/photo/elegant-bouquet-of-white-flowers-in-vase-33070027/) |
| `og-cover.jpg` | Aşkın polat | [이전 대표 사진과 동일](https://www.pexels.com/photo/newlyweds-in-black-and-white-16589107/) |

이전 스톡을 다시 사용할 경우에는 위 원본과 라이선스를 확인합니다. 현재 실제 웨딩사진의 사용 권한과 Pexels 라이선스는 별개입니다.

## 음원

### 청첩장 음원 A

사용자가 **2026-10-05**에 지정한 프로젝트 내 `music/A_song.mp3`를 `public/audio/A_song.mp3`에 변경 없이 복사했습니다. 원본은 그대로 유지하며 청첩장의 `music.src`에서 공개 사본을 참조합니다. 곡명·아티스트 태그는 없으므로 별도 곡명을 추정하지 않았습니다.

- MP3, 44,100 Hz, 스테레오, 약 192 kbps
- 길이 약 **4분 10.8초**, 파일 크기 **6,018,656 bytes**
- 원본과 사본 SHA-256: `a563d0603d65b8e5f3c284dea00fd647d03050ad50b52dae02da4cdfcf3ed013`
- 재인코딩·음량 조정·편집 없음. 전체 디코딩 검사에서 오류 없음
- 음원 경로가 있으면 `preload="auto"`로 페이지를 열 때 재생 시도. `NotAllowedError`로 차단되면 첫 터치·클릭·키 입력에서 재시도
- 상단 버튼으로 재생·정지, 반복 재생. 사용자의 명시적인 일시정지는 이후 사용자 동작에서도 유지

사용자의 파일 적용 요청에 따라 로컬 청첩장에 연결했습니다. 웹 게시 권한·라이선스는 별도 확인하지 않아 `music.rightsConfirmed`는 `false`로 유지했으며 공개 검사가 해당 상태를 확인합니다. 실제 기기에서의 소리 재생은 아직 확인하지 못했습니다.

### 별도 화면(backroom) 음원 B

사용자가 **2026-10-05**에 지정한 프로젝트 내 `music/B_song.mp3`를 `public/audio/B_song.mp3`에 변경 없이 복사했습니다. 원본은 삭제하거나 편집하지 않았으며 별도 화면의 음원 설정에서 `/audio/B_song.mp3`를 참조합니다. 곡명·아티스트 태그는 없으므로 파일 이름으로 별도 제목이나 작가를 추정하지 않았습니다.

- MP3, 44,100 Hz, 2채널 스테레오, 약 192 kbps
- 길이 **156.473458초(약 2분 36.5초)**, 파일 크기 **3,755,407 bytes**
- 원본과 사본 SHA-256: `41f7ce8342e261742a851517c207958acbaa86aefd6d3b83f1f1d65ef9c44454`
- 재인코딩·음량 조정·편집 없음. `ffprobe`로 형식을 확인하고 `ffmpeg` 전체 디코딩 검사에서 오류 없음
- 초기 청첩장 화면에서는 공통 오디오 요소에 A만 연결해 B 음원 다운로드를 시작하지 않음. 현재 연결된 음원 경로가 있으면 `preload="auto"` 사용
- 입장 입력을 제출하는 사용자 동작으로 B의 재생을 요청하며, 재생 중에는 반복 재생

사용자의 파일 적용 요청에 따라 로컬 검토본에 연결했습니다. B의 웹 게시 권한·라이선스는 별도 확인하지 않아 해당 음원의 `rightsConfirmed`는 `false`로 유지합니다. 실제 휴대폰에서 입장 후 소리가 재생되는지와 브라우저의 재생 제한은 별도 확인 대상입니다.
