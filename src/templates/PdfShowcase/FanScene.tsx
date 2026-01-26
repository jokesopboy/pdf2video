import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PdfPage } from "./PdfPage";

interface FanSceneProps {
  src: string;
  pages: number[];
  currentPage: number;
  previousPage?: number;
  focusWidth?: number;
  pdfAspectRatio?: number;
}

export const FanScene: React.FC<FanSceneProps> = ({
  src,
  pages,
  currentPage,
  previousPage,
  focusWidth = 900,
  pdfAspectRatio = 9 / 16,
}) => {
  const frame = useCurrentFrame();
  const { fps, height: videoHeight } = useVideoConfig();

  const currentIndex = pages.indexOf(currentPage);
  const previousIndex = previousPage ? pages.indexOf(previousPage) : currentIndex;

  // Entry animation: unfold like opening a fan
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 30, stiffness: 60, mass: 0.8 },
  });

  // Rotation animation progress (starts after entry completes)
  const rotateDelay = 20;
  const rotateProgress = spring({
    frame: frame - rotateDelay,
    fps,
    config: { damping: 60, stiffness: 80 },
  });

  // Focus page zoom animation (after rotation completes)
  const focusDelay = 40;
  const focusProgress = spring({
    frame: frame - focusDelay,
    fps,
    config: { damping: 80, stiffness: 100 },
  });

  // Fan parameters
  const fanRadius = 600; // Fan radius
  const anglePerCard = 18; // Angle between each card
  const totalAngle = (pages.length - 1) * anglePerCard;
  const startAngle = -totalAngle / 2; // Center display

  // Calculate rotation offset (from previous page to current page)
  const indexDiff = currentIndex - previousIndex;
  const rotationOffset = interpolate(rotateProgress, [0, 1], [0, -indexDiff * anglePerCard]);

  // Scroll starts after bottom description is shown
  const pdfHeight = focusWidth / pdfAspectRatio;
  // Top margin
  const topMargin = 80;
  const maxScrollDistance = Math.max(0, pdfHeight - videoHeight + 100 + topMargin);
  // Scroll starts when description reaches 60% (enterDelay=35 + typingStart=20 + 60% typing≈20)
  const scrollStartFrame = 70;

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

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        perspective: "1500px",
      }}
    >
      {/* Fan cards */}
      {pages.map((pageNum, index) => {
        const isCurrent = pageNum === currentPage;

        // Calculate card's final angle in the fan
        const baseAngle = startAngle + index * anglePerCard;
        const finalAngle = baseAngle + rotationOffset;

        // Entry animation: unfold from center like a fan
        // Angle spreads from 0 to target angle, forming fan shape
        const angleProgress = interpolate(
          enterProgress,
          [0, 0.7, 1],
          [0, 0.9, 1],
          { extrapolateRight: "clamp" }
        );
        const currentAngle = finalAngle * angleProgress;

        // Convert angle to position
        const radians = (currentAngle * Math.PI) / 180;
        const x = Math.sin(radians) * fanRadius;
        // Fan rises from bottom
        const riseProgress = interpolate(enterProgress, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
        const baseY = Math.cos(radians) * fanRadius - fanRadius + 100;
        const y = interpolate(riseProgress, [0, 1], [200, baseY]);

        // Card rotation follows angle
        const rotation = currentAngle * 0.8;

        // Entry scale: unfold from stack state
        const enterScale = interpolate(enterProgress, [0, 0.6], [0.85, 1], { extrapolateRight: "clamp" });
        const enterOpacity = interpolate(enterProgress, [0, 0.2], [0, 1], { extrapolateRight: "clamp" });

        // Calculate final scale and opacity based on angle (center cards are larger and clearer)
        const distanceFromCenter = Math.abs(finalAngle);
        const baseScale = interpolate(distanceFromCenter, [0, 40, 90], [1, 0.85, 0.7], {
          extrapolateRight: "clamp",
        }) * enterScale;
        const baseOpacity = interpolate(distanceFromCenter, [0, 30, 60], [1, 0.8, 0.4], {
          extrapolateRight: "clamp",
        }) * enterOpacity;

        // Focus animation: current page zooms in and moves to center
        let finalX = x;
        let finalY = y;
        let finalScale = baseScale;
        let finalRotation = rotation;
        let finalOpacity = baseOpacity;
        let zIndex = Math.round(100 - distanceFromCenter);

        if (isCurrent && focusProgress > 0) {
          const targetScale = focusWidth / 500;
          const scaledPdfHeight = (500 / pdfAspectRatio) * targetScale;
          // Base position + top margin
          const topPosition = (scaledPdfHeight - videoHeight) / 2 + topMargin;

          finalX = interpolate(focusProgress, [0, 1], [x, 0]);
          finalY = interpolate(focusProgress, [0, 1], [y, topPosition]) - scrollOffset + breatheOffset;
          finalScale = interpolate(focusProgress, [0, 1], [baseScale, targetScale]);
          finalRotation = interpolate(focusProgress, [0, 1], [rotation, 0]);
          finalOpacity = 1;
          zIndex = 200;
        } else if (focusProgress > 0) {
          // Non-current pages: keep fan shape but dim, move back slightly
          finalOpacity = interpolate(focusProgress, [0, 1], [baseOpacity, 0.25]);
          finalScale = interpolate(focusProgress, [0, 1], [baseScale, baseScale * 0.9]);
          // Move down slightly to make room
          finalY = interpolate(focusProgress, [0, 1], [y, y + 50]);
        }

        const pdfRenderWidth = 500;
        const renderScale = isCurrent ? 2 : 1;

        // Use center center when focused, center bottom for fan
        const origin = isCurrent && focusProgress > 0.5 ? "center center" : "center bottom";

        // Add dark filter to non-focused pages when focusing
        const filterStyle = !isCurrent && focusProgress > 0
          ? `brightness(${interpolate(focusProgress, [0, 1], [1, 0.4])})`
          : "none";

        return (
          <div
            key={pageNum}
            style={{
              position: "absolute",
              transform: `
                translateX(${finalX}px)
                translateY(${finalY}px)
                rotateZ(${finalRotation}deg)
                scale(${finalScale})
              `,
              opacity: finalOpacity,
              filter: filterStyle,
              boxShadow: isCurrent && focusProgress > 0.5
                ? "0 30px 80px rgba(0,0,0,0.6)"
                : "0 15px 40px rgba(0,0,0,0.4)",
              borderRadius: 8,
              overflow: "hidden",
              zIndex,
              transformOrigin: origin,
            }}
          >
            <PdfPage
              src={src}
              pageNumber={pageNum}
              width={pdfRenderWidth}
              renderScale={renderScale}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
