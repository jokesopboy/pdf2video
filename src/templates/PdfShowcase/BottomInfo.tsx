import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface BottomInfoProps {
  title: string;
  description?: string;
  enterDelay?: number;
  currentIndex?: number;
  totalCount?: number;
}

export const BottomInfo: React.FC<BottomInfoProps> = ({
  title,
  description,
  enterDelay = 20,
  currentIndex = 1,
  totalCount = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Overall entry animation
  const enterProgress = spring({
    frame: frame - enterDelay,
    fps,
    config: { damping: 80, stiffness: 120 },
  });

  const slideY = interpolate(enterProgress, [0, 1], [40, 0]);
  const opacity = interpolate(enterProgress, [0, 1], [0, 1]);

  // Typewriter effect
  const charsPerFrame = 1.8;
  const typingStartFrame = enterDelay + 20;
  const typedChars = Math.floor((frame - typingStartFrame) * charsPerFrame);
  const displayText = description
    ? frame < typingStartFrame
      ? ""
      : description.slice(0, Math.min(typedChars, description.length))
    : "";

  const isTypingComplete = description ? displayText.length >= description.length : true;

  // Cursor blink (while typing)
  const cursorVisible =
    description &&
    Math.floor(frame / 8) % 2 === 0 &&
    !isTypingComplete;


  return (
    <div
      style={{
        position: "absolute",
        bottom: 50,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        opacity,
        transform: `translateY(${slideY}px)`,
        zIndex: 1000,
      }}
    >
      {/* Unified card container */}
      <div
        style={{
          display: "flex",
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          borderRadius: 8,
          overflow: "hidden",
          maxWidth: 800,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Left vertical line decoration */}
        <div
          style={{
            width: 5,
            backgroundColor: "rgba(99, 102, 241, 0.9)",
            flexShrink: 0,
          }}
        />

        {/* Content area */}
        <div
          style={{
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* Title row: title + progress indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span
              style={{
                fontSize: 26,
                fontWeight: 600,
                color: "#ffffff",
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
            >
              {title}
            </span>

            {/* Progress indicator */}
            {totalCount > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: "rgba(99, 102, 241, 0.3)",
                  padding: "4px 12px",
                  borderRadius: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "rgba(255, 255, 255, 0.9)",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}
                >
                  {currentIndex} / {totalCount}
                </span>
              </div>
            )}
          </div>

          {/* Description (typewriter effect) */}
          {description && (
            <p
              style={{
                fontSize: 18,
                fontWeight: 400,
                color: "rgba(255, 255, 255, 0.95)",
                fontFamily: "system-ui, -apple-system, sans-serif",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {displayText}
              {cursorVisible && (
                <span
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: 18,
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    marginLeft: 2,
                    verticalAlign: "middle",
                  }}
                />
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
