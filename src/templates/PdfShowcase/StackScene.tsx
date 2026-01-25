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

  // 结尾场景的收拢动画
  const gatherProgress = isEnding
    ? spring({
        frame,
        fps,
        config: { damping: 60, stiffness: 80 },
      })
    : 0;

  // 结尾场景：稍微缩小并移动到左侧
  const endingScale = isEnding
    ? interpolate(gatherProgress, [0, 1], [1, 0.85])
    : 1;

  // 移动到左侧
  const endingOffsetX = isEnding
    ? interpolate(gatherProgress, [0, 1], [0, -300])
    : 0;

  const endingOpacity = 1; // 不再淡出

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
        // 开场入场动画
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

        // 结尾时卡片保持错落感并移动到左侧
        const endingY = stackIndex * -6; // 保持垂直错落
        const endingX = stackIndex * 8;  // 水平错落更明显
        const endingRotation = (stackIndex - reversedPages.length / 2) * 2; // 保持轻微旋转

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
