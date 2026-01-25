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

  // 阶段1：切换动画 - 上一页滑出，下一页滑入（使用平滑缓动）
  const switchDuration = 25;
  const switchProgress = interpolate(
    frame,
    [0, switchDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  // 阶段2：滚动（描述显示到 60% 时开始）
  const scrollStartFrame = 70;
  const scrollDuration = 50;
  const scrollOffset = interpolate(
    frame,
    [scrollStartFrame, scrollStartFrame + scrollDuration],
    [0, maxScrollDistance],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.2)) }
  );

  // 呼吸效果：滚动前轻微上下浮动
  const breatheOffset = frame < scrollStartFrame && frame > switchDuration
    ? Math.sin(frame * 0.06) * 8
    : 0;

  // 阶段3：收回动画 - 使用平滑缓动替代 spring
  const collapseStartFrame = duration - 20;
  const collapseDuration = 18;
  const collapseProgress = interpolate(
    frame,
    [collapseStartFrame, collapseStartFrame + collapseDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }
  );

  // 堆叠状态的目标位置（居中、缩小）
  const stackScale = 1;
  const stackY = 0;

  // 上一页：从聚焦位置向上滑出
  const fromPageY = interpolate(switchProgress, [0, 1], [topPosition, -videoHeight * 0.6]);
  const fromPageOpacity = interpolate(switchProgress, [0, 0.6, 1], [1, 0.5, 0]);

  // 下一页的位置和缩放（考虑收回动画）
  let toPageY: number;
  let toPageScale: number;

  if (frame < collapseStartFrame) {
    // 正常展示阶段
    toPageY = interpolate(switchProgress, [0, 1], [videoHeight * 0.6, topPosition]) - scrollOffset + breatheOffset;
    toPageScale = focusScale;
  } else {
    // 收回阶段：从当前滚动位置收回到居中堆叠状态
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
      {/* 上一页 - 向上滑出 */}
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

      {/* 下一页 - 从下方滑入，结束时收回 */}
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
