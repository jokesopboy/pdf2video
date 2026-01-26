import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneType } from "./GridBackground";

interface PersistentTitleProps {
  title: string;
  subtitle?: string;
  sceneType: SceneType;
  firstFocusFrame: number;
}

export const PersistentTitle: React.FC<PersistentTitleProps> = ({
  title,
  subtitle,
  sceneType,
  firstFocusFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 80, stiffness: 100 },
  });

  const moveProgress = spring({
    frame: frame - firstFocusFrame,
    fps,
    config: { damping: 60, stiffness: 80 },
  });

  const currentMoveProgress = frame < firstFocusFrame ? 0 : moveProgress;

  // Center position
  const centerX = width / 2;
  const centerY = height / 2;

  // Corner position (top right, 50px margin, consistent with bottom)
  const cornerX = width - 50;
  const cornerY = 50;

  const titleOpacity = interpolate(enterProgress, [0, 1], [0, 1]);
  const titleY = interpolate(enterProgress, [0, 1], [50, 0]);

  const subtitleProgress = spring({
    frame: frame - 8,
    fps,
    config: { damping: 80, stiffness: 100 },
  });
  const subtitleY = interpolate(subtitleProgress, [0, 1], [30, 0]);
  const subtitleOpacity = interpolate(subtitleProgress, [0, 1], [0, 1]);
  const subtitleFadeOut = frame < firstFocusFrame ? 1 : interpolate(moveProgress, [0, 0.5], [1, 0], {
    extrapolateRight: "clamp",
  });

  const overlayOpacity = interpolate(enterProgress, [0, 1], [0, 0.4]) * (frame < firstFocusFrame ? 1 : interpolate(moveProgress, [0, 0.5], [1, 0], {
    extrapolateRight: "clamp",
  }));

  // Center title opacity (fades out when moving)
  const centerTitleFadeOut = frame < firstFocusFrame ? 1 : interpolate(moveProgress, [0, 0.4], [1, 0], {
    extrapolateRight: "clamp",
  });

  // Corner title opacity (fades in when moving)
  const cornerTitleFadeIn = frame < firstFocusFrame ? 0 : interpolate(moveProgress, [0.3, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Corner card slide-in animation
  const cornerSlideX = interpolate(cornerTitleFadeIn, [0, 1], [30, 0]);

  return (
    <>
      <AbsoluteFill
        style={{
          backgroundColor: "#000000",
          opacity: overlayOpacity,
          pointerEvents: "none",
        }}
      />

      {/* Center title - fades out when moving */}
      <div
        style={{
          position: "absolute",
          left: centerX,
          top: centerY,
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          opacity: centerTitleFadeOut,
        }}
      >
        <h1
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: "#ffffff",
            fontFamily: "system-ui, -apple-system, sans-serif",
            margin: 0,
            textShadow: "0 4px 30px rgba(0, 0, 0, 0.5)",
            transform: `translateY(${frame < firstFocusFrame ? titleY : 0}px)`,
            opacity: titleOpacity,
            textAlign: "center",
            maxWidth: 1400,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: 32,
              fontWeight: 500,
              color: "#ffffff",
              fontFamily: "system-ui, -apple-system, sans-serif",
              margin: 0,
              transform: `translateY(${frame < firstFocusFrame ? subtitleY : 0}px)`,
              opacity: subtitleOpacity * subtitleFadeOut,
              backgroundColor: "#6366f1",
              padding: "10px 28px",
              borderRadius: 0,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Top right corner title - fades in when moving, style matches bottom */}
      <div
        style={{
          position: "absolute",
          top: cornerY,
          right: cornerY,
          pointerEvents: "none",
          opacity: cornerTitleFadeIn,
          transform: `translateX(${cornerSlideX}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            padding: "12px 20px 12px 16px",
            borderRadius: 6,
          }}
        >
          <div
            style={{
              width: 5,
              height: 28,
              backgroundColor: "rgba(99, 102, 241, 0.9)",
              borderRadius: 2,
            }}
          />
          <span
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#ffffff",
              fontFamily: "system-ui, -apple-system, sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </span>
        </div>
      </div>
    </>
  );
};
