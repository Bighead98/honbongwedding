import { existsSync, readFileSync } from "node:fs";
import { invitation } from "../src/config/invitation";
import { releaseIssues } from "../src/lib/validation";

const issues = releaseIssues(invitation);
const media = [
  invitation.photos.hero,
  ...invitation.photos.gallery,
  invitation.photos.closing,
  ...(invitation.backroom?.photos ?? []),
]
  .filter((p) => p !== null)
  .flatMap((p) => [
    p.src,
    ...(p.srcSet?.split(",").map((s) => s.trim().split(" ")[0]) ?? []),
  ]);
media.push(invitation.share.image);
if (invitation.venue.mapImage) media.push(invitation.venue.mapImage);
if (invitation.music.src) media.push(invitation.music.src);
if (invitation.backroom?.music.src) media.push(invitation.backroom.music.src);
if (invitation.backroom?.video) {
  media.push(invitation.backroom.video.src);
  if (invitation.backroom.video.poster) media.push(invitation.backroom.video.poster);
}
for (const file of new Set(media)) {
  if (!file) continue;
  if (!file.startsWith("/") || !existsSync(`public${file}`))
    issues.push({
      field: "media",
      message: `로컬 파일을 확인해 주세요: ${file}`,
    });
}
if (process.argv.includes("--strict") && existsSync("dist/index.html")) {
  const html = readFileSync("dist/index.html", "utf8");
  if (!html.includes("noindex") || !html.includes("og:image"))
    issues.push({
      field: "html",
      message: "초기 HTML 메타태그를 확인해 주세요.",
    });
}
console.log(
  issues.length
    ? `\n공개 준비 미완료: ${issues.length}개 항목\n`
    : "\n설정 검사 통과. 실제 기기·동의·도메인·공유 미리보기는 별도 검수해 주세요.\n",
);
for (const issue of issues) console.log(`- ${issue.field}: ${issue.message}`);
if (process.argv.includes("--strict") && issues.length) process.exitCode = 1;
