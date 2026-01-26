import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PdfPage } from "./PdfPage";

interface FocusSceneProps {
  src: string;
  pages: number[];
  focusPage: number;
  maxVisibleLayers?: number;
  focusWidth?: number;
  pdfAspectRatio?: number;
  duration?: number;
}

export const FocusScene: React.FC<FocusSceneProps> = ({
  src,
  pages,
  focusPage,
  maxVisibleLayers = 6,
  focusWidth = 900,
  pdfAspectRatio = 9 / 16,
  duration = 120,
}) => {
  const frame = useCurrentFrame();
  const { fps, height: videoHeight } = useVideoConfig();

  const visiblePages = pages.slice(0, maxVisibleLayers);
  const reversedPages = [...visiblePages].reverse();
  const focusIndexInReversed = reversedPages.indexOf(focusPage);

  // Focus page position in stack (0 = top layer)
  const focusStackIndex = reversedPages.length - 1 - focusIndexInReversed;
  const isTopCard = focusStackIndex === 0;

  // Phase 1: Extract animation (if not the top card)
  const extractDelay = 5;
  const extractProgress = spring({
    frame: frame - extractDelay,
    fps,
    config: { damping: 80, stiffness: 100 },
  });

  // Phase 2: Focus animation
  const focusDelay = isTopCard ? 10 : 25;
  const focusProgress = spring({
    frame: frame - focusDelay,
    fps,
    config: { damping: 60, stiffness: 80 },
  });

  const pdfHeight = focusWidth / pdfAspectRatio;
  // Top margin
  const topMargin = 80;
  const maxScrollDistance = Math.max(0, pdfHeight - videoHeight + 100 + topMargin);

  // Scroll starts when bottom description reaches 60%
  const scrollStartFrame = isTopCard ? 55 : 65;

  // Breathing effect: slight vertical float before scrolling
  const breatheOffset = frame < scrollStartFrame
    ? Math.sin(frame * 0.06) * 8
    : 0;

  // Scroll offset (shortened scroll time, leave pause at end, with bounce effect)
  const scrollDuration = 50;
  const scrollOffset = interpolate(
    frame,
    [scrollStartFrame, scrollStartFrame + scrollDuration],
    [0, maxScrollDistance],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.2)) }
  );

  // Phase 3: Collapse animation - starts 25 frames before end, returns to stack state
  const collapseStartFrame = duration - 25;
  const collapseProgress = spring({
    frame: frame - collapseStartFrame,
    fps,
    config: { damping: 80, stiffness: 120 },
  });

  const isCollapsing = frame >= collapseStartFrame;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        perspective: "1200px",
      }}
    >
      {reversedPages.map((pageNum, index) => {
        const isFocus = pageNum === focusPage;
        const stackIndex = reversedPages.length - 1 - index;

        // Base position for stack state (consistent with StackScene)
        const baseY = stackIndex * -8;
        const baseX = stackIndex * 4;
        const baseRotation = (stackIndex - reversedPages.length / 2) * 1.5;
        const baseScale = 1 - stackIndex * 0.02;

        let translateX: number;
        let translateY: number;
        let rotation: number;
        let currentScale: number;
        let opacity = 1;
        let zIndex = index;

        if (isFocus) {
          // Focus page animation
          const targetScale = focusWidth / 500;
          const scaledPdfHeight = (500 / pdfAspectRatio) * targetScale;
          // Base position + top margin (so page doesn't touch top)
          const topPosition = (scaledPdfHeight - videoHeight) / 2 + topMargin;

          if (isCollapsing) {
            // Collapse phase: return from scrolled position to stack state
            const scrolledPosition = topPosition - maxScrollDistance;
            translateX = interpolate(collapseProgress, [0, 1], [0, baseX]);
            translateY = interpolate(collapseProgress, [0, 1], [scrolledPosition, baseY]);
            rotation = interpolate(collapseProgress, [0, 1], [0, baseRotation]);
            currentScale = interpolate(collapseProgress, [0, 1], [targetScale, baseScale]);
          } else if (isTopCard) {
            // Top card: scale up directly to center
            translateX = interpolate(focusProgress, [0, 1], [baseX, 0]);
            translateY = interpolate(focusProgress, [0, 1], [baseY, topPosition]) - scrollOffset + breatheOffset;
            rotation = interpolate(focusProgress, [0, 1], [baseRotation, 0]);
            currentScale = interpolate(focusProgress, [0, 1], [baseScale, targetScale]);
          } else {
            // Non-top card: extract first, then focus
            // Phase 1: extract to upper right
            const extractX = interpolate(extractProgress, [0, 1], [baseX, 150]);
            const extractY = interpolate(extractProgress, [0, 1], [baseY, -100]);
            const extractRotation = interpolate(extractProgress, [0, 1], [baseRotation, -5]);

            // Phase 2: move to center and scale up
            translateX = interpolate(focusProgress, [0, 1], [extractX, 0]);
            translateY = interpolate(focusProgress, [0, 1], [extractY, topPosition]) - scrollOffset + breatheOffset;
            rotation = interpolate(focusProgress, [0, 1], [extractRotation, 0]);
            currentScale = interpolate(focusProgress, [0, 1], [baseScale, targetScale]);
          }
          zIndex = 100;
        } else {
          // Non-focus page animation
          if (isCollapsing) {
            // Collapse phase: return from spread position to stack state
            const relativeIndex = index - focusIndexInReversed;
            const isLeft = relativeIndex % 2 !== 0;
            const baseDirection = isLeft ? -1 : 1;
            const spreadDistance = 600 + Math.abs(relativeIndex) * 100;
            const verticalOffset = relativeIndex * 80;
            const rotationDirection = isLeft ? -1 : 1;
            const rotationAmount = 15 + Math.abs(relativeIndex) * 8;

            const spreadX = baseDirection * spreadDistance;
            const spreadY = verticalOffset + 50;
            const spreadRotation = rotationDirection * rotationAmount;

            translateX = interpolate(collapseProgress, [0, 1], [spreadX, baseX]);
            translateY = interpolate(collapseProgress, [0, 1], [spreadY, baseY]);
            rotation = interpolate(collapseProgress, [0, 1], [spreadRotation, baseRotation]);
            currentScale = interpolate(collapseProgress, [0, 1], [0.6, baseScale]);
            opacity = interpolate(collapseProgress, [0, 1], [0, 1]);
          } else {
            // Normal spread animation
            const isAboveFocus = stackIndex < focusStackIndex;
            const relativeIndex = index - focusIndexInReversed;

            const isLeft = relativeIndex % 2 !== 0;
            const baseDirection = isLeft ? -1 : 1;
            const spreadDistance = 600 + Math.abs(relativeIndex) * 100;
            const verticalOffset = relativeIndex * 80;
            const rotationDirection = isLeft ? -1 : 1;
            const rotationAmount = 15 + Math.abs(relativeIndex) * 8;

            if (!isTopCard && isAboveFocus) {
              const liftY = interpolate(extractProgress, [0, 1], [baseY, baseY - 50]);
              const liftX = interpolate(extractProgress, [0, 1], [baseX, baseX + 20]);

              const targetX = baseDirection * spreadDistance;
              const targetY = verticalOffset - 100;

              translateX = interpolate(focusProgress, [0, 1], [liftX, targetX]);
              translateY = interpolate(focusProgress, [0, 1], [liftY, targetY]);
              rotation = interpolate(focusProgress, [0, 1], [baseRotation, rotationDirection * rotationAmount]);
              currentScale = interpolate(focusProgress, [0, 1], [baseScale, 0.6]);
              opacity = interpolate(focusProgress, [0, 0.6, 1], [1, 0.5, 0]);
            } else {
              const targetX = baseDirection * spreadDistance;
              const targetY = verticalOffset + 50;

              translateX = interpolate(focusProgress, [0, 1], [baseX, targetX]);
              translateY = interpolate(focusProgress, [0, 1], [baseY, targetY]);
              rotation = interpolate(focusProgress, [0, 1], [baseRotation, rotationDirection * rotationAmount]);
              currentScale = interpolate(focusProgress, [0, 1], [baseScale, 0.6]);
              opacity = interpolate(focusProgress, [0, 0.6, 1], [1, 0.5, 0]);
            }
          }
        }

        const pdfRenderWidth = 500;
        const renderScale = isFocus ? 2 : 1;

        return (
          <div
            key={pageNum}
            style={{
              position: "absolute",
              transform: `
                translateX(${translateX}px)
                translateY(${translateY}px)
                rotateZ(${rotation}deg)
                scale(${currentScale})
              `,
              opacity,
              boxShadow: isFocus
                ? "0 30px 80px rgba(0,0,0,0.6)"
                : "0 20px 60px rgba(0,0,0,0.4)",
              borderRadius: 8,
              overflow: "hidden",
              zIndex,
            }}
          >
            <PdfPage src={src} pageNumber={pageNum} width={pdfRenderWidth} renderScale={renderScale} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
