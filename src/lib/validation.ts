import type { Invitation } from "../config/invitation";
import { validDateTime } from "./date";
import { validPhone } from "./actions";
export interface ReleaseIssue {
  field: string;
  message: string;
}
export function releaseIssues(config: Invitation): ReleaseIssue[] {
  const issues: ReleaseIssue[] = [];
  const add = (field: string, message: string) =>
    issues.push({ field, message });
  if (config.mode !== "live") add("mode", "데모 모드가 남아 있습니다.");
  if (!config.couple.namesConfirmed)
    add("couple.namesConfirmed", "두 사람의 이름 표기와 순서를 확인해 주세요.");
  if (!config.couple.groom.trim() || !config.couple.bride.trim())
    add("couple", "두 사람의 이름이 필요합니다.");
  if (config.stage === "invitation") {
    if (!config.wedding.confirmed || !validDateTime(config.wedding.dateTime))
      add("wedding", "예식 일시를 확정하고 +09:00 형식으로 입력해 주세요.");
    if (
      !config.venue.confirmed ||
      !config.venue.name.trim() ||
      !config.venue.address.trim()
    )
      add("venue", "예식장명과 도로명 주소를 확정해 주세요.");
    config.families
      .filter((f) => f.visible)
      .forEach((f) => {
        if (!f.confirmed || !f.names.trim() || !f.relation.trim())
          add(
            `families.${f.id}`,
            "가족 표기를 확인하거나 visible: false로 숨겨 주세요.",
          );
      });
    if (config.privacy.showContacts)
      config.contacts.forEach((c) => {
        if (!validPhone(c.phone))
          add(
            `contacts.${c.id}`,
            "연락처를 입력하거나 해당 항목을 제거/숨겨 주세요.",
          );
        if (!c.consent)
          add(`contacts.${c.id}.consent`, "연락처 공개 동의를 확인해 주세요.");
      });
    if (config.privacy.showAccounts)
      config.accounts.forEach((group) =>
        group.items.forEach((a) => {
          if (
            a.sample ||
            !a.number?.trim() ||
            !/[0-9]/.test(a.number) ||
            !a.bank.trim() ||
            !a.holder.trim() ||
            /예시|미입력/.test(`${a.bank}${a.holder}`)
          )
            add(`accounts.${a.id}`, "샘플 계좌를 교체하거나 제거/숨겨 주세요.");
          if (!a.consent)
            add(`accounts.${a.id}.consent`, "계좌 공개 동의를 확인해 주세요.");
        }),
      );
  }
  const photos = [
    config.photos.hero,
    ...config.photos.gallery,
    config.photos.closing,
    ...(config.backroom?.photos ?? []),
  ].filter((p) => p !== null);
  photos.forEach((p) => {
    if (p.sample)
      add(`photos.${p.id}`, "임시 스톡 사진을 실제 사진으로 교체해 주세요.");
  });
  if (config.music.src && !config.music.rightsConfirmed)
    add(
      "music.rightsConfirmed",
      "웹 게시 및 재생에 대한 음원 이용 권한을 확인해 주세요.",
    );
  if (config.backroom) {
    if (!config.backroom.code.trim())
      add("backroom.code", "BACKROOM 입장 코드를 입력하거나 기능을 제거해 주세요.");
    if (config.backroom.music.src && !config.backroom.music.rightsConfirmed)
      add("backroom.music.rightsConfirmed", "BACKROOM 음원의 웹 게시 및 재생 이용 권한을 확인해 주세요.");
  }
  if (!config.privacy.consentConfirmed)
    add(
      "privacy.consentConfirmed",
      "공개할 개인정보와 사진의 동의를 최종 확인해 주세요.",
    );
  if (
    !/^https:\/\/[^\s/]+\/?$/.test(config.share.siteUrl) ||
    /localhost|example\.|실제주소|your-domain/i.test(config.share.siteUrl)
  )
    add("share.siteUrl", "최종 HTTPS 대표 도메인을 입력해 주세요.");
  if (!config.share.image || config.share.imageSample)
    add("share.image", "공유 대표 이미지를 확정해 주세요.");
  if (/임시|예시|미정/.test(config.share.description + config.share.title))
    add("share", "공유 제목·설명의 임시 안내를 수정해 주세요.");
  return issues;
}
