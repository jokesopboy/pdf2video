import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PdfAnnotation } from "./usePdfAnnotations";

interface AnnotationOverlayProps {
  annotations: PdfAnnotation[];
  pdfWidth: number;
  pdfHeight: number;
  scale: number;
  startFrame?: number;
}

export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  annotations,
  pdfWidth,
  pdfHeight,
  scale,
  startFrame = 30,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (annotations.length === 0) return null;

  // Calculate position info for each annotation
  const annotationRects = annotations.map((annot) => {
    const [x1, y1, x2, y2] = annot.rect;
    const scaleX = pdfWidth / annot.pageWidth;
    const scaleY = pdfHeight / annot.pageHeight;
    const left = x1 * scaleX;
    const bottom = y1 * scaleY;
    const width = (x2 - x1) * scaleX;
    const height = (y2 - y1) * scaleY;
    const top = pdfHeight - bottom - height;
    return { left, top, width, height };
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: pdfWidth,
        height: pdfHeight,
        pointerEvents: "none",
      }}
    >
      {/* Highlight animation: uses border and glow only, doesn't cover original content */}
      {annotations.map((annot, index) => {
        const rect = annotationRects[index];
        const animationDelay = startFrame + index * 5;

        const progress = spring({
          frame: frame - animationDelay,
          fps,
          config: { damping: 80, stiffness: 200 },
        });

        const scaleAnim = interpolate(progress, [0, 1], [1.1, 1]);
        const opacity = interpolate(progress, [0, 1], [0, 1]);

        // Use dark border to contrast with original highlight color
        const borderColor = annot.color
          ? `rgb(${Math.max(0, annot.color.r - 80)}, ${Math.max(0, annot.color.g - 80)}, ${Math.max(0, annot.color.b - 80)})`
          : "rgb(200, 150, 0)";

        const glowColor = annot.color
          ? `rgba(${annot.color.r}, ${annot.color.g}, ${annot.color.b}, 0.8)`
          : "rgba(255, 200, 0, 0.8)";

        // Pulsing glow effect
        const pulsePhase = (frame - animationDelay) * 0.15;
        const glowIntensity = progress > 0.5 ? 15 + Math.sin(pulsePhase) * 8 : 15 * progress;

        return (
          <div
            key={annot.id}
            style={{
              position: "absolute",
              left: rect.left - 3,
              top: rect.top - 3,
              width: rect.width + 6,
              height: rect.height + 6,
              border: `3px solid ${borderColor}`,
              borderRadius: 6,
              backgroundColor: "transparent",
              opacity,
              transform: `scale(${scaleAnim})`,
              transformOrigin: "center",
              boxShadow: `0 0 ${glowIntensity}px ${glowColor}, inset 0 0 ${glowIntensity * 0.5}px ${glowColor}`,
            }}
          />
        );
      })}
    </div>
  );
};
