import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PdfPage } from "./PdfPage";

interface StackSceneProps {
  src: string;
  pages: number[];
  maxVisibleLayers?: number;
  onPagesLoaded?: (numPages: number) => void;
  isEnding?: boolean;
}

export const StackScene: React.FC<StackSceneProps> = ({
  src,
  pages,
  maxVisibleLayers = 6,
  onPagesLoaded,
  isEnding = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const visiblePages = pages.slice(0, maxVisibleLayers);
  const reversedPages = [...visiblePages].reverse();

  // Ending scene gather animation
  const gatherProgress = isEnding
    ? spring({
        frame,
        fps,
        config: { damping: 60, stiffness: 80 },
      })
    : 0;

  // Ending scene: slightly scale down and move to left
  const endingScale = isEnding
    ? interpolate(gatherProgress, [0, 1], [1, 0.85])
    : 1;

  // Move to left
  const endingOffsetX = isEnding
    ? interpolate(gatherProgress, [0, 1], [0, -300])
    : 0;

  const endingOpacity = 1; // No longer fades out

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        perspective: "1200px",
        opacity: endingOpacity,
      }}
    >
      {reversedPages.map((pageNum, index) => {
        // Opening entry animation
        const entryProgress = isEnding
          ? 1
          : spring({
              frame: frame - index * 4,
              fps,
              config: { damping: 100, stiffness: 200 },
            });

        const stackIndex = reversedPages.length - 1 - index;
        const baseY = stackIndex * -8;
        const baseX = stackIndex * 4;
        const baseRotation = (stackIndex - reversedPages.length / 2) * 1.5;
        const baseScale = 1 - stackIndex * 0.02;

        // Ending: cards maintain staggered look and move to left
        const endingY = stackIndex * -6; // Keep vertical stagger
        const endingX = stackIndex * 8;  // More horizontal stagger
        const endingRotation = (stackIndex - reversedPages.length / 2) * 2; // Keep slight rotation

        const targetY = isEnding ? interpolate(gatherProgress, [0, 1], [baseY, endingY]) : baseY;
        const targetX = isEnding ? interpolate(gatherProgress, [0, 1], [baseX, endingX]) + endingOffsetX : baseX;
        const targetRotation = isEnding ? interpolate(gatherProgress, [0, 1], [baseRotation, endingRotation]) : baseRotation;

        const translateY = isEnding
          ? targetY
          : interpolate(entryProgress, [0, 1], [300, baseY]);
        const translateX = isEnding
          ? targetX
          : interpolate(entryProgress, [0, 1], [0, baseX]);
        const rotation = isEnding ? targetRotation : baseRotation;
        const opacity = isEnding ? 1 : interpolate(entryProgress, [0, 0.3, 1], [0, 0.8, 1]);
        const scale = baseScale * endingScale;

        return (
          <div
            key={pageNum}
            style={{
              position: "absolute",
              transform: `
                translateY(${translateY}px)
                translateX(${translateX}px)
                rotateZ(${rotation}deg)
                scale(${scale})
              `,
              opacity,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              borderRadius: 8,
              overflow: "hidden",
              zIndex: index,
            }}
          >
            <PdfPage
              src={src}
              pageNumber={pageNum}
              width={500}
              onLoadSuccess={pageNum === visiblePages[0] ? onPagesLoaded : undefined}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
