# Cloudflare Workers 배포와 직접 운영

확인 날짜: **2026-10-05, Asia/Seoul**. 이 프로젝트는 Vite가 만든 `dist/`를 **Workers Static Assets**로 제공한다. GitHub `main` 업로드와 `honbongmarry.co.kr` 구매는 완료했고, 사용자는 Worker **`honbongwedding`**에 Git 자동배포를 연결했다. 기존 Pages용 설정으로 배포가 실패해 Workers용 설정으로 교체했다. 실제 재배포 성공·DNS·인증서·공개 주소 접속은 아직 확인하지 않았다.

## Git 자동배포 설정

Cloudflare 대시보드의 **Workers & Pages > honbongwedding > Settings > Build**에서 다음 값을 사용한다.

| 항목 | 값 |
| --- | --- |
| 운영 브랜치 | `main` |
| 빌드 명령 | `npm run build` |
| 배포 명령 | `npx wrangler deploy` |
| 루트 디렉터리 | 빈 값 — 저장소 최상위 |
| Node.js | `24.21.0` — 저장소의 `.node-version`; 별도 지정이 필요하면 빌드 변수 `NODE_VERSION=24.21.0` |
| API 토큰 | Cloudflare가 자동 생성하는 기본 토큰 |
| 공개 주소의 Access 로그인 보호 | 꺼짐 — 하객과 공유 미리보기 크롤러가 로그인 없이 접근 |

Git에 올린 변경을 대상으로 빌드한 뒤 Wrangler가 배포한다. 자동 API 토큰을 README·소스·공유 대화에 적을 필요가 없다. 빌드/배포 명령·브랜치·루트 설정은 [Workers Builds 공식 안내](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), Node 버전 파일은 [빌드 이미지 공식 안내](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)를 확인했다. 공개·버전 주소에 로그인 보호를 적용하는 기능은 [Cloudflare 공식 버전 URL 안내](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/#manage-access-to-version-urls)에 설명되어 있다. 계정의 실제 토글 상태는 별도 확인 대상이다.

이번 Workers 설정 변경이 `main`에 반영된 후 새 커밋의 자동빌드를 확인한다. 수동으로 배포를 시작할 때도 이번 수정이 들어 있는 커밋을 선택한다. 로그에서 빌드 성공과 Wrangler 배포 성공을 각각 확인하고 출력된 실제 `workers.dev` 주소로 접속한다.

## 저장소의 배포 설정

`wrangler.jsonc`는 아래 값을 사용한다.

- Worker 이름: `honbongwedding`
- 호환 날짜: `2026-10-05`
- 정적 파일 디렉터리: `assets.directory: './dist'`
- 경로 처리: `assets.not_found_handling: 'single-page-application'`
- Workers 주소·버전 URL: `workers_dev: true`, `preview_urls: true`
- 브랜치 미리보기 설정: `previews: {}`

서버 진입 파일 `main` 없이 정적 파일을 배포한다. Wrangler는 프로젝트에 고정한 의존성을 사용하고, 사진 원본·작업 폴더 대신 `dist/`의 공개용 사본을 제공한다. 공개 페이지의 사진·계좌와 BACKROOM 자료는 배포물에 포함된다.

## 준비 경고와 수동 검사

일반 `npm run build`는 타입 검사와 Vite 빌드를 마친 뒤 준비 상태를 확인한다. 현재 다음 **4개 경고는 비차단**이다.

- 데모 모드가 남아 있음
- A 음악의 웹 게시·재생 이용 권한 확인
- B 음악의 웹 게시·재생 이용 권한 확인
- 개인정보·사진 공개 동의 최종 확인

Git 자동배포의 `npm run build` → `npx wrangler deploy` 경로는 `check:publish`를 호출하지 않는다. 이 4개 경고가 출력되어도 일반 빌드와 자동배포를 중단시키지는 않는다.

엄격한 `npm run check:publish`는 준비 항목이 남으면 종료 코드 1로 실패한다. 수동 `npm run deploy:workers`는 **엄격 검사 → 빌드 → Wrangler 배포** 순서이며 기존 검사를 유지한다. 현재 준비 경고가 남은 상태에서는 이 수동 명령이 배포 전에 멈춘다.

외부 업로드 없이 배포 구성을 검사하려면 다음을 실행한다.

```bash
npm ci
npm run build
npm run deploy:check
```

`deploy:check`는 `wrangler deploy --dry-run --outdir .wrangler/dry-run`이며 Worker를 외부에 배포하지 않는다. 실제 수동 배포 명령은 `npm run deploy:workers`다.

## 구매한 도메인 연결

Cloudflare의 활성 도메인 영역에 구매한 도메인이 있어야 한다. 대시보드에서 **Workers & Pages > honbongwedding > Settings > Domains & Routes > Add > Custom Domain**을 연다. `honbongmarry.co.kr`를 입력하고 **Add Custom Domain**을 선택한다. Cloudflare가 필요한 DNS 레코드와 인증서를 생성한다. 같은 호스트에 기존 CNAME이 있으면 바로 연결할 수 없으므로 기존 용도를 먼저 확인한다. [Workers Custom Domains 공식 절차](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

추가 후 `https://honbongmarry.co.kr/` 접속과 사진·A/B 음악·영상·지도·계좌 복사·공유를 확인한다. 현재 설정의 `share.siteUrl`은 이 대표 주소를 사용하며, 빌드 시 canonical·`og:url`·절대 주소의 `og:image`에 반영된다. 카카오 브라우저 키·도메인 등록은 [연동 안내](./INTEGRATIONS.md)를 따른다. 도메인 구매만으로 Worker 연결·HTTPS 검증이 완료되는 것은 아니다.

## 수정과 운영 종료

설정·사진을 수정한 뒤 `main`에 반영하면 연결된 Git 자동배포가 새 빌드를 실행한다. 배포 로그와 실제 주소에서 변경 내용을 확인한다. 검색 제외용 `noindex`는 접근을 제한하지 않는다.

예식 후 감사 화면으로 바꾸거나 계좌·개인정보를 제거하려면 설정 데이터에서 제거하고 재빌드·재배포한다. 이전 Workers 버전·미리보기 주소·Git 기록도 함께 관리한다. 완전 종료 시 Worker의 공개 주소와 사용자 지정 도메인 연결을 모두 확인하고 도메인 자동 갱신 여부를 정한다. 공개 시작일이 미정이므로 1년 운영의 종료일도 아직 확정하지 않았다.
