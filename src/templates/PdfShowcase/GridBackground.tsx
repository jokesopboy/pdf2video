import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export type SceneType = "stack" | "focus" | "switch" | "fan";

interface GridBackgroundProps {
  gridSize?: number;
  sceneType?: SceneType;
  sceneStartFrame?: number;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({
  gridSize = 60,
  sceneType = "stack",
  sceneStartFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const cols = Math.ceil(width / gridSize) + 2;
  const rows = Math.ceil(height / gridSize) + 2;

  const breathe = interpolate(Math.sin(frame * 0.02), [-1, 1], [0.6, 1]);

  const offsetX = interpolate(frame, [0, 600], [0, gridSize], {
    extrapolateRight: "wrap",
  });

  const offsetY = interpolate(frame, [0, 800], [0, gridSize], {
    extrapolateRight: "wrap",
  });

  const sceneFrame = frame - sceneStartFrame;

  const sceneProgress = spring({
    frame: sceneFrame,
    fps,
    config: { damping: 80, stiffness: 100 },
  });

  const focusFade = sceneType === "focus" || sceneType === "switch" || sceneType === "fan"
    ? interpolate(sceneProgress, [0, 1], [1, 0.3])
    : 1;

  const glowIntensity = sceneType === "focus" || sceneType === "switch" || sceneType === "fan"
    ? interpolate(sceneProgress, [0, 1], [0.08, 0.15])
    : 0.08;

  const pulseRadius = sceneType === "switch"
    ? interpolate(sceneFrame, [0, 30], [0, Math.max(width, height)], {
        extrapolateRight: "clamp",
      })
    : 0;

  const pulseOpacity = sceneType === "switch"
    ? interpolate(sceneFrame, [0, 10, 30], [0, 0.3, 0], {
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)",
        overflow: "hidden",
      }}
    >
      {/* Grid lines */}
      <svg
        width={width}
        height={height}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          opacity: breathe * focusFade,
        }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * gridSize - offsetX}
            y1={0}
            x2={i * gridSize - offsetX}
            y2={height}
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: rows }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={i * gridSize - offsetY}
            x2={width}
            y2={i * gridSize - offsetY}
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth={1}
          />
        ))}
      </svg>

      {/* Intersection dots */}
      <svg
        width={width}
        height={height}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {Array.from({ length: cols }).map((_, colIndex) =>
          Array.from({ length: rows }).map((_, rowIndex) => {
            const x = colIndex * gridSize - offsetX;
            const y = rowIndex * gridSize - offsetY;

            const distanceFromCenter = Math.sqrt(
              Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2)
            );
            const maxDistance = Math.sqrt(
              Math.pow(width / 2, 2) + Math.pow(height / 2, 2)
            );
            const normalizedDistance = distanceFromCenter / maxDistance;

            let dotOpacity = interpolate(
              normalizedDistance,
              [0, 0.5, 1],
              [0.4, 0.15, 0.05]
            ) * breathe;

            if (sceneType === "focus" || sceneType === "switch" || sceneType === "fan") {
              const fadeByDistance = interpolate(
                normalizedDistance,
                [0, 0.3, 0.6],
                [1, 0.5, 0.1]
              );
              dotOpacity *= interpolate(sceneProgress, [0, 1], [1, fadeByDistance]);
            }

            const dotSize = interpolate(normalizedDistance, [0, 1], [3, 1.5]);

            return (
              <circle
                key={`dot-${colIndex}-${rowIndex}`}
                cx={x}
                cy={y}
                r={dotSize}
                fill="rgba(255, 255, 255, 0.15)"
                opacity={dotOpacity}
              />
            );
          })
        )}
      </svg>

      {/* Pulse ripple on switch */}
      {sceneType === "switch" && pulseOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: pulseRadius * 2,
            height: pulseRadius * 2,
            borderRadius: "50%",
            border: `2px solid rgba(99, 102, 241, ${pulseOpacity})`,
            boxShadow: `0 0 30px rgba(99, 102, 241, ${pulseOpacity * 0.5})`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Center glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(99, 102, 241, ${glowIntensity * breathe}) 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Extra glow when focused */}
      {(sceneType === "focus" || sceneType === "switch" || sceneType === "fan") && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 1200,
            height: 1200,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(99, 102, 241, ${0.05 * sceneProgress}) 0%, transparent 50%)`,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
