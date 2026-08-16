from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ImageInput(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str = ""
    name: str = "image.png"
    role: str = ""
    type: str = "image/png"
    size: int = 0
    dataUrl: str = ""
    src: str = ""


class ImageGroups(BaseModel):
    top: list[ImageInput] = Field(default_factory=list)
    bottom: list[ImageInput] = Field(default_factory=list)
    reference: list[ImageInput] = Field(default_factory=list)
    candidate: list[ImageInput] = Field(default_factory=list)


class JobPayload(BaseModel):
    model_config = ConfigDict(extra="allow")
    schemaVersion: int = 3
    jobId: str
    topCode: str
    bottomCode: str
    topName: str = ""
    bottomName: str = ""
    topColor: str = ""
    bottomColor: str = ""
    allowedColors: list[str] = Field(default_factory=list)
    analysis: dict[str, Any] = Field(default_factory=dict)
    prompt: str = ""
    generationRequest: dict[str, Any] = Field(default_factory=dict)
    referenceImagesManifest: dict[str, Any] = Field(default_factory=dict)
    images: ImageGroups
    candidateCount: int = Field(default=3, ge=1, le=3)
    regenerationMemo: str = ""
    referenceApproved: bool = False


class RegenerateRequest(BaseModel):
    regenerationMemo: str = Field(min_length=1, max_length=2000)
    candidateCount: int = Field(default=3, ge=1, le=3)


class GenerationStartResponse(BaseModel):
    jobId: str
    status: str
    message: str


class CandidateItem(BaseModel):
    index: int
    fileName: str
    url: str
