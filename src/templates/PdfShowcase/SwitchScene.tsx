import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { PdfPage } from "./PdfPage";

interface SwitchSceneProps {
  src: string;
  pages: number[];
  fromPage: number;
  toPage: number;
  maxVisibleLayers?: number;
  focusWidth?: number;
  pdfAspectRatio?: number;
  duration?: number;
}

export const SwitchScene: React.FC<SwitchSceneProps> = ({
  src,
  fromPage,
  toPage,
  focusWidth = 900,
  pdfAspectRatio = 9 / 16,
  duration = 120,
}) => {
  const frame = useCurrentFrame();
  const { height: videoHeight } = useVideoConfig();

  const focusScale = focusWidth / 500;
  const pdfHeight = focusWidth / pdfAspectRatio;
  const topMargin = 80;
  const scaledPdfHeight = (500 / pdfAspectRatio) * focusScale;
  const topPosition = (scaledPdfHeight - videoHeight) / 2 + topMargin;
  const maxScrollDistance = Math.max(0, pdfHeight - videoHeight + 100 + topMargin);

  // Phase 1: Switch animation - previous page slides out, next page slides in (smooth easing)
  const switchDuration = 25;
  const switchProgress = interpolate(
    frame,
    [0, switchDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  // Phase 2: Scroll (starts when description reaches 60%)
  const scrollStartFrame = 70;
  const scrollDuration = 50;
  const scrollOffset = interpolate(
    frame,
    [scrollStartFrame, scrollStartFrame + scrollDuration],
    [0, maxScrollDistance],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.2)) }
  );

  // Breathing effect: slight vertical float before scrolling
  const breatheOffset = frame < scrollStartFrame && frame > switchDuration
    ? Math.sin(frame * 0.06) * 8
    : 0;

  // Phase 3: Collapse animation - using smooth easing instead of spring
  const collapseStartFrame = duration - 20;
  const collapseDuration = 18;
  const collapseProgress = interpolate(
    frame,
    [collapseStartFrame, collapseStartFrame + collapseDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }
  );

  // Target position for stack state (centered, scaled down)
  const stackScale = 1;
  const stackY = 0;

  // Previous page: slides up from focus position
  const fromPageY = interpolate(switchProgress, [0, 1], [topPosition, -videoHeight * 0.6]);
  const fromPageOpacity = interpolate(switchProgress, [0, 0.6, 1], [1, 0.5, 0]);

  // Next page position and scale (considering collapse animation)
  let toPageY: number;
  let toPageScale: number;

  if (frame < collapseStartFrame) {
    // Normal display phase
    toPageY = interpolate(switchProgress, [0, 1], [videoHeight * 0.6, topPosition]) - scrollOffset + breatheOffset;
    toPageScale = focusScale;
  } else {
    // Collapse phase: return from scrolled position to centered stack state
    const scrolledPosition = topPosition - maxScrollDistance;
    toPageY = interpolate(collapseProgress, [0, 1], [scrolledPosition, stackY]);
    toPageScale = interpolate(collapseProgress, [0, 1], [focusScale, stackScale]);
  }

  const toPageOpacity = interpolate(switchProgress, [0, 0.3, 1], [0, 0.9, 1]);

  const pdfRenderWidth = 500;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Previous page - slides up */}
      <div
        style={{
          position: "absolute",
          transform: `translateY(${fromPageY}px) scale(${focusScale})`,
          opacity: fromPageOpacity,
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          borderRadius: 8,
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        <PdfPage src={src} pageNumber={fromPage} width={pdfRenderWidth} renderScale={1} />
      </div>

      {/* Next page - slides in from bottom, collapses at end */}
      <div
        style={{
          position: "absolute",
          transform: `translateY(${toPageY}px) scale(${toPageScale})`,
          opacity: toPageOpacity,
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          borderRadius: 8,
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        <PdfPage src={src} pageNumber={toPage} width={pdfRenderWidth} renderScale={2} />
      </div>
    </AbsoluteFill>
  );
};
