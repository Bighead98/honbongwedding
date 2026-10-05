"""원본을 보존하고 메타데이터 없는 웹용 사진을 만드는 보조 도구.

python scripts/optimize-images.py assets/user-originals/YUP_0070.JPG wedding-0070 --og og-cover-actual.jpg
python scripts/optimize-images.py assets/user-originals/YUP_1065.JPG wedding-1065
python scripts/optimize-images.py assets/my-original.jpg hero

모든 사진에 480/960/1440px WebP를 생성합니다. 원본 파일과 색조는 바꾸지 않습니다.
--og는 사진 전체를 아이보리 바탕에 담은 공유 이미지를 만듭니다.
기존 hero 명령은 --og를 생략해도 og-cover.jpg를 생성합니다.
Pillow 필요: python -m pip install Pillow
"""
import argparse
from pathlib import Path
from PIL import Image, ImageOps


def jpeg_basename(value: str) -> str:
    """공유 이미지는 폴더 경로를 포함하지 않은 JPEG 파일 이름만 받습니다."""
    if (
        not value
        or any(character in value for character in '/\\:\0<>"|?*\r\n')
        or any(ord(character) < 32 for character in value)
        or Path(value).name != value
        or Path(value).suffix.lower() not in {".jpg", ".jpeg"}
    ):
        raise argparse.ArgumentTypeError(
            "--og에는 폴더를 포함하지 않은 .jpg 또는 .jpeg 파일 이름을 지정하세요."
        )
    return value


def report(target: Path, image: Image.Image) -> None:
    print(f"{target.name}: {image.width}×{image.height}, {target.stat().st_size:,} bytes")


def main() -> None:
    parser = argparse.ArgumentParser(description="청첩장 웹용 이미지 생성")
    parser.add_argument("source", type=Path)
    parser.add_argument("name", help="wedding-0070, hero, gallery-01, closing 등 파일 이름")
    parser.add_argument("--og", type=jpeg_basename, metavar="FILE.jpg", help="공유 이미지 파일 이름")
    args = parser.parse_args()
    if not args.name.replace("-", "").isalnum():
        parser.error("파일 이름에는 문자·숫자·하이픈만 사용하세요.")
    if not args.source.is_file():
        parser.error(f"원본 사진을 찾을 수 없습니다: {args.source}")

    destination = Path(__file__).resolve().parent.parent / "public" / "images"
    og_name = args.og or ("og-cover.jpg" if args.name == "hero" else None)
    targets = [destination / f"{args.name}-{width}.webp" for width in (480, 960, 1440)]
    if og_name:
        targets.append(destination / og_name)
    source = args.source.resolve()
    if any(
        target.resolve() == source or (target.is_file() and target.samefile(source))
        for target in targets
    ):
        parser.error("원본 사진과 출력 파일의 경로가 같습니다. 다른 출력 이름을 지정하세요.")

    destination.mkdir(parents=True, exist_ok=True)
    with Image.open(args.source) as original:
        oriented = ImageOps.exif_transpose(original).convert("RGB")
        # 새 픽셀 이미지에는 원본의 EXIF/GPS/XMP 등 메타데이터를 넘기지 않습니다.
        clean = Image.new("RGB", oriented.size)
        clean.paste(oriented)

    for width in (480, 960, 1440):
        height = max(1, round(clean.height * width / clean.width))
        copy = clean.resize((width, height), Image.Resampling.LANCZOS)
        target = destination / f"{args.name}-{width}.webp"
        copy.save(target, "WEBP", quality=84, method=6)
        report(target, copy)

    if og_name:
        # 원본 전체를 담고 남는 공간은 아이보리 바탕으로 채웁니다.
        cover = Image.new("RGB", (1200, 630), "#f7f4eb")
        image = clean.copy()
        image.thumbnail((1160, 610), Image.Resampling.LANCZOS)
        cover.paste(image, ((1200 - image.width) // 2, (630 - image.height) // 2))
        target = destination / og_name
        cover.save(target, "JPEG", quality=92, optimize=True)
        report(target, cover)


if __name__ == "__main__":
    main()
