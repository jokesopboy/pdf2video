import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface EndingOverlayProps {
  title?: string;
  subtitle?: string;
}

export const EndingOverlay: React.FC<EndingOverlayProps> = ({
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 延迟入场，等 PDF 移动到左侧后再显示
  const enterDelay = 25;
  const enterProgress = spring({
    frame: frame - enterDelay,
    fps,
    config: { damping: 60, stiffness: 80 },
  });

  const opacity = interpolate(enterProgress, [0, 1], [0, 1]);
  const translateX = interpolate(enterProgress, [0, 1], [50, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingRight: 150,
        pointerEvents: "none",
      }}
    >
      {/* 右侧文字区域 */}
      <div
        style={{
          opacity,
          transform: `translateX(${translateX}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          maxWidth: 600,
        }}
      >
        {/* 感谢观看 */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: "rgba(255, 255, 255, 0.6)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            marginBottom: 16,
            letterSpacing: 6,
          }}
        >
          感谢观看
        </div>

        {/* 标题 */}
        {title && (
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: "#ffffff",
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: 1.2,
              marginBottom: 20,
              textShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
            }}
          >
            {title}
          </div>
        )}

        {/* 副标题 */}
        {subtitle && (
          <div
            style={{
              fontSize: 24,
              fontWeight: 400,
              color: "rgba(255, 255, 255, 0.7)",
              fontFamily: "system-ui, -apple-system, sans-serif",
              textShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
            }}
          >
            {subtitle}
          </div>
        )}

        {/* 装饰线 */}
        <div
          style={{
            width: interpolate(enterProgress, [0, 1], [0, 120]),
            height: 4,
            backgroundColor: "rgba(99, 102, 241, 0.8)",
            marginTop: 30,
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
};
