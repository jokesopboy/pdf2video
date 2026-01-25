import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface TitleCardProps {
  title: string;
  subtitle?: string;
  exitFrame?: number;
}

export const TitleCard: React.FC<TitleCardProps> = ({
  title,
  subtitle,
  exitFrame = 45,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 80, stiffness: 100 },
  });

  const exitProgress = spring({
    frame: frame - exitFrame,
    fps,
    config: { damping: 100, stiffness: 150 },
  });

  const titleY = interpolate(enterProgress, [0, 1], [50, 0]);
  const titleOpacity = interpolate(enterProgress, [0, 1], [0, 1]);

  const subtitleY = interpolate(
    spring({ frame: frame - 8, fps, config: { damping: 80, stiffness: 100 } }),
    [0, 1],
    [30, 0]
  );
  const subtitleOpacity = interpolate(
    spring({ frame: frame - 8, fps, config: { damping: 80, stiffness: 100 } }),
    [0, 1],
    [0, 1]
  );

  const exitOpacity = frame >= exitFrame ? interpolate(exitProgress, [0, 1], [1, 0]) : 1;
  const exitScale = frame >= exitFrame ? interpolate(exitProgress, [0, 1], [1, 0.95]) : 1;

  const overlayOpacity = interpolate(enterProgress, [0, 1], [0, 0.4]) * exitOpacity;

  return (
    <>
      <AbsoluteFill
        style={{
          backgroundColor: "#000000",
          opacity: overlayOpacity,
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none",
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 16,
        }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#ffffff",
            fontFamily: "system-ui, -apple-system, sans-serif",
            margin: 0,
            textShadow: "0 4px 30px rgba(0, 0, 0, 0.5)",
            transform: `translateY(${titleY}px)`,
            opacity: titleOpacity,
            textAlign: "right",
            maxWidth: 1200,
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: "#ffffff",
              fontFamily: "system-ui, -apple-system, sans-serif",
              margin: 0,
              transform: `translateY(${subtitleY}px)`,
              opacity: subtitleOpacity,
              backgroundColor: "#6366f1",
              padding: "8px 20px",
              borderRadius: 0,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      </AbsoluteFill>
    </>
  );
};
