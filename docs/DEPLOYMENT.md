# Cloudflare Pages 배포와 직접 운영

확인 날짜: **2026-10-04, Asia/Seoul**. Vite + React + TypeScript의 빌드 결과 `dist/`를 Cloudflare Pages에 **Direct Upload**하는 방법이다. 서버·데이터베이스 없이 정적 파일로 운영한다. 이 문서는 실행 절차를 준비한 것이며, **외부 배포·도메인 구매·DNS 변경·인증서 연결은 아직 수행하지 않았다.** 사용자가 최종 결과와 공개 범위를 확인한 뒤 계정 작업을 진행한다.

## 무료 범위와 선택 이유

Pages의 정적 파일 요청은 무료이며 요청 수 제한이 없다. Functions를 사용하면 Workers 요금·할당량이 적용된다. 이 청첩장에는 Functions가 필요하지 않다. [Cloudflare 공식 과금 안내](https://developers.cloudflare.com/pages/functions/pricing/)

| 무료 플랜 주요 항목 | 확인한 제한 |
| --- | --- |
| Cloudflare에서 수행하는 Git 연동 빌드 | 월 500회, 동시 1개, 최대 20분 |
| 사이트 파일 | 최대 20,000개, 파일 하나 최대 25 MiB |
| 사용자 도메인 | 프로젝트당 최대 100개 |
| 계정 프로젝트 | 100개, 신규 계정 첫 48시간에는 생성 제한 가능 |

위 수치는 [Pages 공식 제한 문서](https://developers.cloudflare.com/pages/platform/limits/) 기준이다. 로컬에서 `npm run build`하는 작업과 Cloudflare의 Git 빌드 할당량은 구분한다. 직접 업로드 제한은 Wrangler 20,000개, 대시보드 드래그 업로드 1,000개이며 두 방법 모두 개별 파일 25 MiB까지다. [Direct Upload 공식 문서](https://developers.cloudflare.com/pages/get-started/direct-upload/)

개별 사진과 음악을 25 MiB보다 작게 최적화하면 이 청첩장 규모에 적합하다. 호스팅이 무료여도 도메인 신규·갱신비는 별도다. [도메인 비교와 가격 확인](./DOMAIN_RESEARCH.md)

## 1. 도메인 선택과 계정 준비

1. 두 사람의 영문 이름 표기와 후보 주소를 정한다.
2. [공식 도메인 검색·구매 링크](./DOMAIN_RESEARCH.md)에서 등록 가능 여부와 첫해/갱신 총액을 확인한다.
3. 사용자가 구매를 확인한 뒤 직접 등록한다.
4. [Cloudflare 대시보드](https://dash.cloudflare.com/)에서 본인 계정을 준비하고 무료 플랜을 선택한다.

계정 비밀번호·OTP·카드번호는 공유하지 않는다. 도메인 계정의 소유자 이메일, 만료일, 자동연장 여부를 기록한다. Direct Upload 프로젝트는 나중에 같은 프로젝트를 Git 자동배포 방식으로 바꿀 수 없으므로, 원하면 별도의 Git 연동 프로젝트를 새로 만들게 된다. 이번 방식은 로컬 소스와 파일을 직접 관리하기에 단순하다. [Direct Upload 공식 문서](https://developers.cloudflare.com/pages/get-started/direct-upload/)

## 2. 로컬 빌드와 공개 전 검사

프로젝트 폴더의 PowerShell에서 실행한다.

```powershell
npm ci
npm run typecheck
npm run lint
npm run check:release
npm run build
npm run preview -- --host 127.0.0.1
```

`preview`가 출력한 로컬 주소에서 확인한다. `check:release`는 임시 정보·미설정 항목을 경고하면서 초안 검토를 허용한다. **실제 공개 전에는 `npm run check:publish`를 실행한다.** 이 검사는 공개 준비가 부족하면 실패하며, 데모 초안에서 실패하는 것이 정상이다. `dist/index.html`, 사진, 음악, OG 이미지가 만들어졌는지 확인한다. 이름·예식 날짜·장소·연락처·계좌·사진 사용권·음원 사용권·공개 동의를 검수한다. 데모 모드와 임시 안내를 끄기 전에 실제 정보가 모두 맞는지 확인한다.

배포 대상은 **`dist/`만**이다. 사진 원본, `.env`, 비공개 키, 배포 토큰, 원본 작업 폴더를 업로드하지 않는다. 전화번호·계좌처럼 사이트에서 보여줄 정보는 최종 빌드에 포함되므로 데이터 파일이나 환경변수에 넣어도 숨겨지지 않는다. 카카오 JavaScript 키처럼 공개 가능한 브라우저 키와 Cloudflare API 토큰·카카오 Admin 키는 다르게 취급한다.

## 3. 테스트용 주소 배포 — 공개 확인 후

아래 명령은 Cloudflare에 프로젝트를 만들고 외부 주소에 파일을 공개한다. **이번 제작 중에는 실행하지 않았다.** 외부 공개 확인을 받은 뒤 사용자의 브라우저에서 Wrangler 로그인 과정을 완료한다.

```powershell
npx wrangler login
npx wrangler pages project create hojeong-sojeong-invitation --production-branch main
npx wrangler pages deploy ./dist --project-name hojeong-sojeong-invitation --branch preview
```

`hojeong-sojeong-invitation`은 프로젝트 이름 예시다. 실제 계정에서 사용할 이름을 정하고 설정 파일과 명령 모두 동일하게 바꾼다. 프로젝트 생성 명령은 처음 한 번 실행한다. 배포가 출력한 실제 `*.pages.dev` 주소에서 검수하며, 이름이 중복되면 주소가 달라질 수 있다. `--branch preview`는 운영 주소를 갱신하지 않는 preview 배포다. [Wrangler Pages 명령](https://developers.cloudflare.com/workers/wrangler/commands/pages/)

Preview URL도 기본적으로 **공개**된다. 필요하면 Pages > Settings > General > Enable access policy로 preview 인증을 설정할 수 있으나, 이것만으로 운영 `프로젝트.pages.dev`나 사용자 도메인이 보호되지는 않는다. 예전 해시 preview URL은 재배포 후에도 남을 수 있다. [Preview 공식 안내](https://developers.cloudflare.com/pages/configuration/preview-deployments/)

Wrangler를 쓰지 않는 방법은 Workers & Pages > Create application > Get started > Drag and drop your files에서 `dist/` 폴더 또는 그 내용의 ZIP을 올리는 것이다. 소스 폴더 전체를 올리지 않는다. 대시보드 표기는 업데이트에 따라 조금 달라질 수 있다. [직접 업로드 공식 절차](https://developers.cloudflare.com/pages/get-started/direct-upload/)

검수가 끝나고 공개를 확인한 뒤 프로젝트가 준비한 운영 배포 스크립트를 사용한다. 이 스크립트는 엄격한 공개 전 검사 → 빌드 → Wrangler 업로드 순서로 실행한다.

```powershell
npm run deploy:pages
```

내부의 실제 업로드 명령은 `npx wrangler pages deploy dist --project-name hojeong-sojeong-invitation --branch main`이다. 준비되지 않은 상태에서 검사를 우회해 직접 업로드하지 않는다. `wrangler.jsonc`의 프로젝트 이름과 `pages_build_output_dir: "./dist"`가 이 명령과 일치한다.

## 4. 사용자 도메인 연결과 DNS — 변경 확인 후

먼저 Pages 프로젝트 > Custom domains > Set up a domain에서 사용할 주소를 등록한다. DNS에 CNAME만 먼저 추가하고 Pages에 도메인을 연결하지 않으면 522 오류가 생길 수 있다. [사용자 도메인 공식 문서](https://developers.cloudflare.com/pages/configuration/custom-domains/)

| 주소 형태 | DNS 연결 방식 |
| --- | --- |
| 루트 주소 `example.com` | 같은 Cloudflare 계정에 도메인 zone을 추가하고, 등록업체에서 네임서버를 Cloudflare가 지정한 값으로 변경한다. Pages 연결 과정이 CNAME을 만든다. |
| 하위 주소 `invite.example.com` | 기존 DNS 업체를 유지할 수 있다. Pages에 먼저 주소를 연결한 뒤 `invite` CNAME → 실제 `프로젝트.pages.dev`를 추가한다. |

이 표는 [Cloudflare 공식 apex/subdomain 구분](https://developers.cloudflare.com/pages/configuration/custom-domains/)을 요약한 것이다. `example.com`은 설명용 예약 주소이며 최종 도메인이 아니다.

기존 도메인을 사용한다면 네임서버 변경 전에 A·AAAA·CNAME·MX·TXT·CAA 등 현재 레코드를 기록하고 Cloudflare에 필요한 레코드가 모두 옮겨졌는지 확인한다. 이메일·다른 사이트용 레코드를 임의로 삭제하지 않는다. 기존 서비스를 보존해야 하면 하위 주소 방식이 덜 복잡할 수 있다. 실제 변경 대상과 값을 사용자에게 보여주고 확인받는다.

## 5. HTTPS와 대표 주소

Pages Custom domains 상태가 Active가 될 때까지 기다린다. 브라우저에서 `https://최종주소/`에 인증서 경고 없이 접속되는지, 모든 사진·음악이 HTTPS로 로딩되는지 확인한다. Pages는 SSL을 기본 지원한다. [Cloudflare Pages 서비스 안내](https://www.cloudflare.com/products/pages/)

CAA 레코드가 이미 있으면 인증서 발급을 방해할 수 있다. 자동으로 삭제하지 말고 [공식 CAA 문제 안내](https://developers.cloudflare.com/pages/configuration/custom-domains/#caa-records)에 따라 필요한 변경만 확인한다.

대표 주소는 예를 들어 `https://선택한도메인.com/` 하나로 정한다. 구매 전에는 실제 이름으로 확정하지 않는다. Cloudflare Bulk Redirects에서 운영 `프로젝트.pages.dev` → 대표 주소의 301 리디렉션을 만들고 경로·쿼리를 보존한다. 도메인이 정상 연결된 후 적용한다. [Pages 주소를 사용자 도메인으로 이동](https://developers.cloudflare.com/pages/how-to/redirect-to-custom-domain/)

`www`도 필요하면 같은 대표 주소로 301 이동시킨다. 공식 가이드의 프록시 DNS 및 Bulk Redirect 조건을 확인하고, 기존 `www` 레코드의 용도를 먼저 검토한다. [www를 루트 주소로 이동](https://developers.cloudflare.com/pages/how-to/www-redirect/)

공개 확인 후 다음처럼 응답 상태와 `Location`, `X-Robots-Tag`를 검수할 수 있다. 아래 주소는 실제 구매 주소로 바꾼다.

```powershell
curl.exe -I https://example.com/
curl.exe -I https://www.example.com/
```

## 6. 검색 제외와 카카오톡 미리보기

초기 HTML의 `<meta name="robots" content="noindex, nofollow">`와 Pages의 `X-Robots-Tag`를 유지한다. `_headers`는 정적 파일 응답에 적용되며 Vite의 `public/`에 두면 빌드 결과로 복사된다. [Pages 헤더 공식 문서](https://developers.cloudflare.com/pages/configuration/headers/)

`noindex`는 검색 제외 요청이고, 접근 제한이나 완전한 비공개를 뜻하지 않는다. 링크를 아는 사람은 사진·연락처·계좌에 접근할 수 있다. 계좌를 접어둬도 보안 기능이 되지 않는다. `robots.txt`의 전면 `Disallow`는 봇이 noindex를 확인하지 못하게 만들 수 있으므로 함께 막는 방식으로 변경하지 않는다. [Google의 noindex 공식 설명](https://developers.google.com/search/docs/crawling-indexing/block-indexing)

최종 주소를 설정에 반영하고 다시 빌드한다. 최초 HTML에 canonical, `og:url`, `og:title`, `og:description`, **절대 HTTPS 주소의 `og:image`**가 포함됐는지 확인한다. 대표 이미지 파일이 로그인 없이 열리는지도 확인한다. 카카오 앱의 Web 사이트 도메인에 최종 주소를 등록하고 공개 브라우저 JavaScript 키만 설정한다. 카카오 설정·캐시 확인 절차는 프로젝트의 연동 안내를 따른다. 도메인이나 대표 이미지가 바뀌면 OG와 앱 도메인 등록도 함께 수정한다.

## 7. 수정 후 재배포

설정·사진을 수정하고 로컬 검증, 공개 전 검사를 다시 수행한다. 이어 `npm run build` 후 검수용 preview를 배포하고 검수가 끝나면 `npm run deploy:pages`로 운영 배포한다. 업로드 후 실제 주소에서 날짜·지도·복사·음악·공유를 재확인한다. 파일만 바뀌고 설정이나 OG가 남지 않았는지 확인한다.

## 8. 예식 이후와 운영 종료

유지 기간을 미리 정한다. 감사 화면으로 전환할 때는 연락처·계좌를 화면에서 숨기는 것뿐 아니라 설정 데이터에서도 제거한 뒤 빌드한다. 유지할 사진도 두 사람이 함께 정한다. 새 빌드에서 제거했더라도 예전 배포 파일이나 이미 내려받은 파일이 자동 회수되는 것은 아니다.

이전 preview 배포는 대시보드 또는 다음 명령으로 목록을 확인해 삭제한다. 배포 ID는 목록의 실제 값으로 바꾸며, 최신 브랜치 배포는 삭제할 수 없으므로 먼저 개인정보 없는 버전을 배포한다. [Preview 배포 삭제 공식 문서](https://developers.cloudflare.com/pages/configuration/preview-deployments/#delete-preview-deployments)

```powershell
npx wrangler pages deployment list --project-name hojeong-sojeong-invitation
npx wrangler pages deployment delete DEPLOYMENT_ID --project-name hojeong-sojeong-invitation
```

완전히 종료할 때는 소스·설정·필요한 사진 사본을 먼저 보관하고 종료 확인을 받는다. 청첩장용 CNAME을 삭제하고 Pages Custom domains에서 해당 주소를 Remove domain한다. **도메인 연결만 지우면 `pages.dev`로는 여전히 접근할 수 있다.** [사용자 도메인 제거 공식 절차](https://developers.cloudflare.com/pages/configuration/custom-domains/#delete-a-custom-domain)

외부 주소까지 종료하려면 Pages 프로젝트를 삭제하고 운영·preview URL 접근이 끝났는지 확인한다. 이전 배포가 많은 프로젝트에서 삭제 오류가 나면 배포들을 먼저 정리한다. [Wrangler 프로젝트 삭제](https://developers.cloudflare.com/workers/wrangler/commands/pages/#pages-project-delete), [Pages 알려진 문제](https://developers.cloudflare.com/pages/platform/known-issues/)

```powershell
npx wrangler pages project delete hojeong-sojeong-invitation
```

이 삭제 명령은 실제 종료를 확인한 뒤에만 실행한다. 도메인을 계속 소유하려면 연장하고, 유지하지 않을 계획이면 등록업체에서 자동연장을 해제한다. 만료로 도메인이 타인에게 넘어갈 수 있으므로 공유했던 링크의 향후 처리도 함께 결정한다. 관련 없는 DNS 레코드나 서비스는 그대로 보존한다.
