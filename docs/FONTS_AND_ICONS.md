# 글꼴과 아이콘

갱신일: **2026-10-05**.

문장 글꼴은 **나눔손글씨 펜(Nanum Pen Script)과 SUIT 두 종류**입니다. 신랑·신부 이름과 표지·초대·감사 멘트에는 큰 손글씨를 적극적으로 적용합니다. 부모님 성함·‘의 아들/딸’과 예식 일시·교통·계좌·버튼·화환 안내에는 SUIT를 유지합니다. BACKROOM은 강한 제목·제어·예식 정보에 SUIT를, 두 사람의 이름과 재미있는 사진 멘트에 손글씨를 혼용합니다. 이모지는 기기에 내장된 색상 이모지 글꼴로 표시하며 문장 글꼴과 별개입니다.

정보 구역 제목인 ‘예식 일시·함께한 순간·오시는 길·마음 전하실 곳’은 SUIT 26px·600 굵기입니다. 계좌 위의 ‘보내주시는 따뜻한 마음에 / 깊이 감사드립니다.’도 SUIT 20px로 표시합니다. 표지와 마지막 이름 사이에는 `그리고`를 SUIT 20px·600 굵기로 표시합니다.

일반 화면의 손글씨 표지 이름은 44px, 표지·초대·감사 문구는 29px, 가족 소개 안의 부부 이름은 32px입니다. 정보 본문·교통·계좌는 18px이며 혼주 성함과 화환 안내는 20px·600 굵기이고, 예식 일시·장소도 20px로 강조합니다. 줄 간격과 명암을 높이고 좁은 화면에서는 문구와 버튼을 줄바꿈합니다. 약도에는 원본을 별도로 열어 확대할 수 있는 링크를 제공합니다.

| 용도 | 설치한 패키지 | 적용 파일 |
| --- | --- | --- |
| 신랑·신부 이름·멘트 | [@fontsource/nanum-pen-script](https://fontsource.org/fonts/nanum-pen-script) 5.3.0 | `@fontsource/nanum-pen-script/400.css` |
| 정보 본문·교통·계좌 | [@sun-typeface/suit](https://github.com/sun-typeface/SUIT) 2.0.5 | `node_modules/@sun-typeface/suit/fonts/static/woff2/SUIT-Regular.woff2` |
| 부모님 성함·일시·주요 안내 | 위 SUIT 패키지 2.0.5 | `node_modules/@sun-typeface/suit/fonts/static/woff2/SUIT-SemiBold.woff2` |
| 강한 제목·BACKROOM 강조 | 위 SUIT 패키지 2.0.5 | `node_modules/@sun-typeface/suit/fonts/static/woff2/SUIT-ExtraBold.woff2` |

[src/main.tsx](../src/main.tsx)에서 나눔손글씨 펜 400 CSS를 가져오고, [src/styles.css](../src/styles.css)에서 SUIT 400·600·800의 WOFF2 세 파일을 참조합니다. Vite가 배포용 파일과 URL을 처리하며 Fontsource CSS의 중복 WOFF 파일은 변환 단계에서 제거합니다. 두 글꼴 모두 사이트에서 직접 제공하고 `font-display: swap`을 사용합니다. 나눔손글씨 펜은 `unicode-range`에 따라 필요한 문자의 WOFF2 조각만 요청합니다. CSS의 `font-synthesis: none`으로 실제 파일에 없는 굵기·기울임을 합성하지 않으며 손글씨는 실제 파일이 있는 400 굵기로 표시합니다. 명조 글꼴은 사용하지 않습니다.

두 글꼴은 **SIL Open Font License 1.1**입니다. 설치한 패키지의 `LICENSE`에서 원문과 저작권 고지를 확인했습니다. 나눔손글씨 펜은 NHN/Sandoll Communications, SUIT는 SUNN의 고지를 포함합니다. SUIT의 예약 글꼴 이름은 `SUIT`입니다. 공식 정보는 [나눔손글씨 펜](https://fontsource.org/fonts/nanum-pen-script), [SUIT 공식 저장소](https://github.com/sun-typeface/SUIT)에서 확인할 수 있습니다.

배포용 원문은 [나눔손글씨 펜 라이선스](../public/licenses/nanum-pen-script-OFL.txt), [SUIT 라이선스](../public/licenses/suit-OFL.txt)에 보존합니다. 글꼴 바이너리는 수정하지 않았으며 라이선스와 저작권 고지를 배포물에 함께 제공합니다. 이전 작업에 사용했던 나눔명조의 라이선스 기록도 `public/licenses/`에 보존합니다.

화면 아이콘과 이주은 성함 옆의 국화꽃은 이 프로젝트에서 작성한 SVG입니다. 약도는 공식 안내에서 확인한 위치 관계를 자체 도형으로 표현했습니다. 현재 약도는 홍대입구 방향을 왼쪽, 합정역을 오른쪽에 배치하며 우리은행은 식장 왼쪽에 표시합니다. 업체의 로고·사진·약도 이미지를 복제하지 않았습니다. `N`은 네이버지도 링크를 구분하는 일반 텍스트입니다.
