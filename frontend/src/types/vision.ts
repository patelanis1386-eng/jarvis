export interface VisionAnalysis {
  description: string;
  tags: string[];
  confidence: number;
  objects: Detection[];
  text?: OCRResult[];
  faces?: Face[];
  colors?: ColorAnalysis[];
  quality?: ImageQuality;
  labels?: Label[];
  safeSearch?: SafeSearchResult;
}

export interface Detection {
  label: string;
  confidence: number;
  boundingBox: BoundingBox;
  attributes?: Record<string, string>;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  language?: string;
}

export interface Face {
  age?: number;
  gender?: string;
  emotion?: string;
  confidence: number;
  boundingBox: BoundingBox;
  landmarks?: FaceLandmarks;
}

export interface FaceLandmarks {
  leftEye: Point;
  rightEye: Point;
  nose: Point;
  leftMouth: Point;
  rightMouth: Point;
}

export interface Point {
  x: number;
  y: number;
}

export interface ColorAnalysis {
  hex: string;
  name: string;
  percentage: number;
}

export interface ImageQuality {
  blur: number;
  noise: number;
  brightness: number;
  contrast: number;
  sharpness: number;
}

export interface Label {
  name: string;
  confidence: number;
  categories: string[];
}

export interface SafeSearchResult {
  adult: ContentModerationLevel;
  violence: ContentModerationLevel;
  racy: ContentModerationLevel;
  hate: ContentModerationLevel;
}

export type ContentModerationLevel =
  | "very_unlikely"
  | "unlikely"
  | "possible"
  | "likely"
  | "very_likely";

export interface VideoAnalysis {
  duration: number;
  frames: number;
  fps: number;
  scenes: Scene[];
  objects: Detection[];
  transcript?: TranscriptionResult[];
  summary: string;
}

export interface Scene {
  start: number;
  end: number;
  label: string;
  confidence: number;
  keyframe: string;
}

export interface TranscriptionResult {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

export type VisionInput = File | Blob | string;

export interface VisionRequestOptions {
  input: VisionInput;
  features?: VisionFeature[];
  maxResults?: number;
  language?: string;
}

export type VisionFeature =
  | "label_detection"
  | "object_detection"
  | "text_detection"
  | "face_detection"
  | "color_analysis"
  | "quality_assessment"
  | "safe_search";
