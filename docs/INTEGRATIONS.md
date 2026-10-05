# 지도와 공유 연동

공식 문서 확인일: **2026-10-04, Asia/Seoul**. 앱 키·장소·도메인이 없는 상태에서도 초안을 볼 수 있도록 외부 SDK는 필요한 기능에서만 사용한다. 아래 형식은 공식 문서 확인 결과이며 실제 모바일 앱 이동·카카오톡 발송은 별도 기기 확인이 필요하다.

## 네이버 지도

[네이버클라우드 공식 지도 앱 URL Scheme](https://guide.ncloud-docs.com/docs/ko/application-maps-url-scheme-vpc)을 확인했다. 앱 URL Scheme에는 `appname`이 필수이고, 모바일 웹에서는 웹페이지 URL을 넣는다. 이름과 검색어, `appname` 값은 URL 인코딩한다.

```text
nmap://search?query={검색어}&appname={웹페이지URL}
nmap://place?lat={위도}&lng={경도}&name={장소명}&appname={웹페이지URL}
nmap://route/public?dlat={위도}&dlng={경도}&dname={장소명}&appname={웹페이지URL}
```

`nmap://`은 네이버 지도 앱 설치가 필요하다. 공식 문서는 Android 모바일 웹의 `intent://...#Intent;scheme=nmap;...;package=com.nhn.android.nmap;end`, iOS의 App Store 분기를 설명한다. 인앱 브라우저의 Scheme 처리에는 해당 앱의 구현이 영향을 준다.

이번 초안에서는 네이버 웹 지도 링크를 우선 제공한다. 일반 검색 경로 `https://map.naver.com/p/search/{encodeURIComponent(검색어)}`를 사용할 수 있으나, 이 경로를 보장하는 별도 공식 API 계약은 이번 조사에서 확인하지 못했고 열람 도구에서도 직접 열리지 않았다. **실제 예식장이 확정되면 네이버 지도에서 해당 장소를 검색하고 ‘공유’로 받은 확정 장소 URL을 설정에 넣어 검증하는 것이 권장된다.** 주소나 장소가 없을 때는 임의 예식장 링크를 만들지 않는다.

## 카카오맵

[카카오 지도 공식 가이드의 지도 URL](https://apis.map.kakao.com/web/guide/#mapurl)을 확인했다. 아래 웹 링크는 지도 SDK나 앱 키 없이 사용할 수 있고 공식 가이드는 환경에 따라 PC 지도 또는 모바일 웹 지도로 연결된다고 설명한다.

```text
https://map.kakao.com/link/map/{장소명},{위도},{경도}
https://map.kakao.com/link/map/{장소ID}
https://map.kakao.com/link/to/{장소명},{위도},{경도}
https://map.kakao.com/link/search/{검색어}
```

장소명·검색어에는 `encodeURIComponent`를 적용한다. 좌표는 위도, 경도 순서다. 현재 `venue.kakaoUrl`에는 사용자가 제공한 [웨딩 시그니처 장소 링크](https://place.map.kakao.com/803348028)를 넣어 우선 사용한다. 이 설정이 없으면 기존 좌표 링크를 사용하고, 좌표도 없으면 확정한 이름·주소 검색을 사용한다. 앱 설치나 위치 권한을 초안 방문의 필수 조건으로 만들지 않는다.

## 카카오톡 공유

[공식 JavaScript 공유 가이드](https://developers.kakao.com/docs/ko/kakaotalk-share/js-link)는 `Kakao.Share.sendDefault()`를 통한 자체 버튼 구현을 지원한다. 로그인이나 REST 메시지 발송 서버가 필요한 흐름과 구분해서, 방문자의 탭으로 공유 화면을 연다.

### 운영자가 준비할 등록

1. [카카오디벨로퍼스](https://developers.kakao.com/)에 로그인하고 서비스 앱을 만든다.
2. [앱] → [플랫폼 키] → [JavaScript 키]에서 브라우저용 JavaScript 키를 확인한다.
3. 해당 키의 **JavaScript SDK 도메인**에 실제 사이트 도메인을 등록한다. 개발·미리보기 도메인은 필요한 경우 별도로 등록한다.
4. [앱] → [제품 링크 관리] → [웹 도메인]에도 공유 메시지가 이동할 실제 도메인을 등록하고 기본 웹 도메인을 선택한다. SDK 도메인 등록과 별도 설정이다.
5. 설정의 공유 URL·대표 이미지가 공개 HTTPS 절대 URL인지 확인한 뒤 JavaScript 키를 입력해 다시 빌드한다.
6. 실제 도메인에서 `Kakao.init(JavaScript키)`와 `Kakao.isInitialized()`를 확인하고 카카오톡 앱이 있는 기기에서 공유를 시험한다.

현재 메뉴 이름과 별도 도메인 등록 요구는 [공식 앱 설정 문서](https://developers.kakao.com/docs/ko/app-setting/app#platform-javascript)를 기준으로 확인했다. JavaScript 키는 브라우저에 전달되는 공개 키다. 어드민 키·클라이언트 시크릿·배포 토큰은 프런트엔드 설정에 넣지 않는다.

### SDK 버전과 무결성

[공식 다운로드 문서](https://developers.kakao.com/docs/ko/javascript/download)의 최신 Full SDK는 **2.8.3**, 배포일 **2026-09-03**이었다. 문서에 포함된 압축 SDK SRI 값을 읽고, 실제 CDN 파일의 SHA-384 계산 결과가 같은지 확인했다.

```html
<script
  src="https://t1.kakaocdn.net/kakao_js_sdk/2.8.3/kakao.min.js"
  integrity="sha384-oroumrnFVE0xtgqyDZJARgERibXg2C28380uaUZz2kHDS5CR7tu20eGiOU6GkTpy"
  crossorigin="anonymous"
></script>
```

설치·초기화 기준은 [공식 JavaScript 시작하기](https://developers.kakao.com/docs/ko/javascript/getting-started)를 따른다. 버전을 바꾸면 URL과 SRI를 함께 갱신한다. 로딩 오류는 화면 전체를 깨뜨리지 않고 소개말·예식 설명·대표 URL을 함께 복사하는 대안으로 처리한다.

### SDK 미설정·실패 시 대체 동작

카카오 버튼은 JavaScript SDK가 미설정이거나 로딩·공유 호출이 실패하면 **소개말·예식 설명·대표 URL**을 함께 복사하고 카카오톡 대화창에 붙여넣도록 안내한다. ‘링크 복사’ 버튼은 URL만 복사한다. 지원하는 기기에서는 `navigator.share()`로 기본 공유 화면을 열고, 기본 공유가 미지원·실패하면 URL을 복사한다. 사용자가 카카오톡을 공유 대상으로 선택할 수 있는지는 기기 환경에 달려 있으며 직접 카카오톡 공유 성공을 보장하지 않는다.

[Web Share 공식 개발자 문서](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)에 따라 HTTPS·기기 지원 여부·버튼 탭이 필요하며, 공유 취소는 실패 메시지로 몰아가지 않는다. [Clipboard 문서](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText)에 따라 복사 권한 거절이나 미지원 환경을 처리하고, 직접 선택할 수 있는 초대글/URL/은행명과 계좌번호/주소를 제공한다. 계좌 복사 값은 **`은행명 계좌번호`** 형식이며 예금주는 제외한다. SDK 메서드 호출만으로 메시지가 전송됐다고 확정하지 않는다.

## OG 미리보기

[Open Graph 규격](https://ogp.me/)과 [카카오 공식 메시지 템플릿 문서](https://developers.kakao.com/docs/ko/message-template/common#scrap)를 기준으로, 초기 HTML `<head>`에 `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`을 넣는다. 클라이언트 JavaScript로만 나중에 추가하지 않는다.

최종 도메인과 대표 이미지가 정해지면 canonical URL, `og:url`, `og:image`, 카카오 공유 `webUrl`·`mobileWebUrl`을 함께 변경해 다시 빌드한다. 대표 이미지는 외부에서 인증 없이 접근되는 절대 HTTPS URL이어야 한다. 아직 운영 도메인이 없으면 데모가 공개 완료됐다고 표시하지 않는다.

변경 후 예전 미리보기가 남으면 [공식 카카오 도구](https://developers.kakao.com/tool)의 ‘카카오톡 URL 메타정보 관리’를 이용한다. [공식 도구 설명](https://developers.kakao.com/docs/ko/tool/common#kakaotalk-url-metadata)에서 URL 입력 → 메타 정보 조회 → 캐시 초기화 → 재조회의 흐름을 확인했다. 운영 URL을 실제 채팅방에 붙여넣은 미리보기는 공개 전 기기에서 다시 확인해야 한다.

## 공개 전 실제 기기 확인

- iPhone Safari, Android Chrome, 카카오톡 인앱 브라우저에서 확정 장소가 열리는지 확인한다.
- 네이버·카카오 지도 앱 설치/미설치 상황을 모두 확인한다.
- 주소 복사 결과에 장소 이름 등 불필요한 문구가 섞이지 않는지 확인한다.
- 카카오 JavaScript SDK 도메인과 제품 링크 웹 도메인을 모두 확인한다.
- 카카오톡 공유 화면과 취소, SDK 미설정·로딩 실패·공유 호출 실패 시 소개말·예식 설명·대표 URL 복사, 별도 링크 복사 시 URL만 포함되는지 확인한다.
- 최종 운영 URL을 카카오톡에 붙여넣어 대표 사진·이름·일시·설명이 정확한지 확인한다.

이 문서는 등록·연동을 준비한 결과다. 실제 키 발급, 계정 생성, 도메인 등록, 카카오톡 발송, 지도 앱 전환을 완료한 결과가 아니다.
