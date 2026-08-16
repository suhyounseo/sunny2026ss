from __future__ import annotations

import base64
import textwrap
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw, ImageFont

from .settings import settings


ProgressCallback = Callable[[int, int, str], None]


class ProviderConfigurationError(RuntimeError):
    pass


class ImageProvider(ABC):
    name = "base"

    @abstractmethod
    def generate_candidates(self, job_id: str, prompt: str, image_paths: list[Path], output_dir: Path, candidate_count: int, progress: ProgressCallback) -> list[Path]:
        raise NotImplementedError


class OpenAIImageProvider(ImageProvider):
    name = "openai"

    def generate_candidates(self, job_id: str, prompt: str, image_paths: list[Path], output_dir: Path, candidate_count: int, progress: ProgressCallback) -> list[Path]:
        if not settings.openai_api_key:
            raise ProviderConfigurationError("OPENAI_API_KEY가 설정되지 않았습니다. modelcut-workflow/.env를 확인하세요.")
        try:
            from openai import OpenAI
        except ImportError as error:
            raise ProviderConfigurationError("OpenAI Python 패키지가 없습니다. server/requirements.txt를 설치하세요.") from error
        client = OpenAI(api_key=settings.openai_api_key)
        output_dir.mkdir(parents=True, exist_ok=True)
        results: list[Path] = []
        for index in range(1, candidate_count + 1):
            handles = [path.open("rb") for path in image_paths]
            try:
                variation_prompt = f"{prompt}\n\n후보 {index}: 같은 제품 일치 규칙을 유지하되 자연스러운 포즈와 표정에만 미세한 변화를 준다."
                response = client.images.edit(
                    model=settings.image_model,
                    image=handles,
                    prompt=variation_prompt,
                    size=settings.image_size,
                    quality=settings.image_quality,
                    n=1,
                )
            finally:
                for handle in handles:
                    handle.close()
            encoded = response.data[0].b64_json
            if not encoded:
                raise RuntimeError("이미지 provider가 이미지 데이터를 반환하지 않았습니다.")
            target = output_dir / f"candidate_{index:02d}.png"
            target.write_bytes(base64.b64decode(encoded))
            results.append(target)
            progress(index, candidate_count, f"후보 {index}/{candidate_count} 생성 완료")
        return results


class TestImageProvider(ImageProvider):
    """End-to-end diagnostics only. Outputs are visibly marked and are never presented as AI model cuts."""

    name = "test"

    def generate_candidates(self, job_id: str, prompt: str, image_paths: list[Path], output_dir: Path, candidate_count: int, progress: ProgressCallback) -> list[Path]:
        output_dir.mkdir(parents=True, exist_ok=True)
        results: list[Path] = []
        for index in range(1, candidate_count + 1):
            canvas = Image.new("RGB", (1024, 1536), "#f4efe7")
            draw = ImageDraw.Draw(canvas)
            draw.rectangle((34, 34, 990, 1502), outline="#304a40", width=8)
            draw.text((70, 70), "MODELCUT TEST PROVIDER", fill="#8e3c32", font=ImageFont.load_default())
            draw.text((70, 100), f"{job_id} / candidate {index}", fill="#181715", font=ImageFont.load_default())
            x, y = 70, 160
            for source in image_paths[:6]:
                with Image.open(source) as image:
                    thumb = image.convert("RGB")
                    thumb.thumbnail((280, 360))
                    canvas.paste(thumb, (x, y))
                x += 310
                if x > 800:
                    x, y = 70, y + 400
            lines = textwrap.wrap("DIAGNOSTIC ONLY - configure OPENAI_API_KEY for real generation", width=55)
            draw.multiline_text((70, 1400), "\n".join(lines), fill="#8e3c32", font=ImageFont.load_default(), spacing=6)
            target = output_dir / f"candidate_{index:02d}.png"
            canvas.save(target, "PNG")
            results.append(target)
            progress(index, candidate_count, f"진단 후보 {index}/{candidate_count} 생성 완료")
        return results


def get_provider() -> ImageProvider:
    if settings.provider == "openai":
        return OpenAIImageProvider()
    if settings.provider == "test":
        return TestImageProvider()
    raise ProviderConfigurationError(f"지원하지 않는 MODELCUT_PROVIDER입니다: {settings.provider}")
