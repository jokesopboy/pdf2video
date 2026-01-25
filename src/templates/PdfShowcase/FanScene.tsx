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

  // 入场动画：像打开扇子一样展开
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 30, stiffness: 60, mass: 0.8 },
  });

  // 旋转动画进度（入场完成后开始）
  const rotateDelay = 20;
  const rotateProgress = spring({
    frame: frame - rotateDelay,
    fps,
    config: { damping: 60, stiffness: 80 },
  });

  // 聚焦页面放大动画（旋转完成后）
  const focusDelay = 40;
  const focusProgress = spring({
    frame: frame - focusDelay,
    fps,
    config: { damping: 80, stiffness: 100 },
  });

  // 扇形参数
  const fanRadius = 600; // 扇形半径
  const anglePerCard = 18; // 每张卡片之间的角度
  const totalAngle = (pages.length - 1) * anglePerCard;
  const startAngle = -totalAngle / 2; // 居中显示

  // 计算旋转偏移（从上一个页面转到当前页面）
  const indexDiff = currentIndex - previousIndex;
  const rotationOffset = interpolate(rotateProgress, [0, 1], [0, -indexDiff * anglePerCard]);

  // 滚动在底部描述显示完成后开始
  const pdfHeight = focusWidth / pdfAspectRatio;
  // 顶部边距
  const topMargin = 80;
  const maxScrollDistance = Math.max(0, pdfHeight - videoHeight + 100 + topMargin);
  // 滚动在底部描述显示到 60% 时开始（enterDelay=35 + typingStart=20 + 60%打字时间≈20）
  const scrollStartFrame = 70;

  // 呼吸效果：滚动前轻微上下浮动
  const breatheOffset = frame < scrollStartFrame
    ? Math.sin(frame * 0.06) * 8
    : 0;

  // 滚动偏移（缩短滚动时间，留出结尾停顿，带回弹效果）
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
      {/* 扇形卡片 */}
      {pages.map((pageNum, index) => {
        const isCurrent = pageNum === currentPage;

        // 计算卡片在扇形中的最终角度
        const baseAngle = startAngle + index * anglePerCard;
        const finalAngle = baseAngle + rotationOffset;

        // 入场动画：像扇子一样从中心展开
        // 角度从 0 展开到目标角度，形成扇形
        const angleProgress = interpolate(
          enterProgress,
          [0, 0.7, 1],
          [0, 0.9, 1],
          { extrapolateRight: "clamp" }
        );
        const currentAngle = finalAngle * angleProgress;

        // 将角度转换为位置
        const radians = (currentAngle * Math.PI) / 180;
        const x = Math.sin(radians) * fanRadius;
        // 扇形从下方升起
        const riseProgress = interpolate(enterProgress, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
        const baseY = Math.cos(radians) * fanRadius - fanRadius + 100;
        const y = interpolate(riseProgress, [0, 1], [200, baseY]);

        // 卡片自身旋转跟随角度
        const rotation = currentAngle * 0.8;

        // 入场缩放：从堆叠状态展开
        const enterScale = interpolate(enterProgress, [0, 0.6], [0.85, 1], { extrapolateRight: "clamp" });
        const enterOpacity = interpolate(enterProgress, [0, 0.2], [0, 1], { extrapolateRight: "clamp" });

        // 根据角度计算最终缩放和透明度（中心的更大更清晰）
        const distanceFromCenter = Math.abs(finalAngle);
        const baseScale = interpolate(distanceFromCenter, [0, 40, 90], [1, 0.85, 0.7], {
          extrapolateRight: "clamp",
        }) * enterScale;
        const baseOpacity = interpolate(distanceFromCenter, [0, 30, 60], [1, 0.8, 0.4], {
          extrapolateRight: "clamp",
        }) * enterOpacity;

        // 聚焦动画：当前页面放大并移到中心
        let finalX = x;
        let finalY = y;
        let finalScale = baseScale;
        let finalRotation = rotation;
        let finalOpacity = baseOpacity;
        let zIndex = Math.round(100 - distanceFromCenter);

        if (isCurrent && focusProgress > 0) {
          const targetScale = focusWidth / 500;
          const scaledPdfHeight = (500 / pdfAspectRatio) * targetScale;
          // 基础位置 + 顶部边距
          const topPosition = (scaledPdfHeight - videoHeight) / 2 + topMargin;

          finalX = interpolate(focusProgress, [0, 1], [x, 0]);
          finalY = interpolate(focusProgress, [0, 1], [y, topPosition]) - scrollOffset + breatheOffset;
          finalScale = interpolate(focusProgress, [0, 1], [baseScale, targetScale]);
          finalRotation = interpolate(focusProgress, [0, 1], [rotation, 0]);
          finalOpacity = 1;
          zIndex = 200;
        } else if (focusProgress > 0) {
          // 非当前页面：保留扇形但压暗，稍微后退
          finalOpacity = interpolate(focusProgress, [0, 1], [baseOpacity, 0.25]);
          finalScale = interpolate(focusProgress, [0, 1], [baseScale, baseScale * 0.9]);
          // 稍微向下移动，让出空间
          finalY = interpolate(focusProgress, [0, 1], [y, y + 50]);
        }

        const pdfRenderWidth = 500;
        const renderScale = isCurrent ? 2 : 1;

        // 聚焦时使用 center center，扇形时使用 center bottom
        const origin = isCurrent && focusProgress > 0.5 ? "center center" : "center bottom";

        // 非聚焦页面在聚焦时添加暗色滤镜
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
