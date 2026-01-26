import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useMemo, useState, useCallback } from "react";
import { StackScene } from "./StackScene";
import { FocusScene } from "./FocusScene";
import { SwitchScene } from "./SwitchScene";
import { FanScene } from "./FanScene";
import { GridBackground, SceneType } from "./GridBackground";
import { PersistentTitle } from "./PersistentTitle";
import { BottomInfo } from "./BottomInfo";
import { PdfShowcaseProps, ScriptItem } from "./types";
import { EndingOverlay } from "./EndingOverlay";
import { PdfPreloader } from "./PdfPreloader";

export { PdfShowcaseSchema } from "./types";

function generateScript(highlights: number[]): ScriptItem[] {
  if (highlights.length === 0) {
    return [{ type: "stack", duration: 120 }];
  }

  const script: ScriptItem[] = [{ type: "stack", duration: 60 }];

  highlights.forEach((page, index) => {
    if (index === 0) {
      script.push({ type: "focus", page, duration: 120 });
    } else {
      script.push({ type: "switch", page, duration: 120 });
    }
  });

  // Add ending scene - return to stack state
  script.push({ type: "stack", duration: 60 });

  return script;
}


export const PdfShowcase: React.FC<PdfShowcaseProps> = ({
  src,
  title,
  subtitle,
  pages,
  highlights,
  pageTitles,
  pageDescriptions,
  script: customScript,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const [totalPages, setTotalPages] = useState<number>(10);

  const handlePagesLoaded = useCallback((numPages: number) => {
    setTotalPages(numPages);
  }, []);

  // Extract pages from script - computed once and cached
  const scriptExtractedPages = useMemo(() => {
    if (!customScript || customScript.length === 0) return null;
    const scriptPages = customScript
      .filter((item): item is typeof item & { page: number } => 'page' in item && typeof item.page === 'number')
      .map(item => item.page);
    return scriptPages.length > 0 ? [...new Set(scriptPages)] : null;
  }, [customScript]);

  const availablePages = useMemo(() => {
    // Priority 1: Explicit pages prop
    if (pages && pages.length > 0) {
      return pages;
    }
    // Priority 2: Pages extracted from script (before highlights!)
    if (scriptExtractedPages) {
      return scriptExtractedPages;
    }
    // Priority 3: Highlights
    if (highlights && highlights.length > 0) {
      return highlights;
    }
    // Fallback: All pages up to totalPages
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [pages, scriptExtractedPages, highlights, totalPages]);

  const script = useMemo(() => {
    if (customScript && customScript.length > 0) {
      return customScript;
    }
    if (highlights && highlights.length > 0) {
      return generateScript(highlights);
    }
    const defaultHighlights = availablePages.slice(0, 3);
    return generateScript(defaultHighlights);
  }, [customScript, highlights, availablePages]);

  // Calculate total highlight pages count (for progress indicator)
  const highlightCount = useMemo(() => {
    return script.filter(item => item.type === "focus" || item.type === "switch" || item.type === "fan").length;
  }, [script]);

  const sequences = useMemo(() => {
    let currentFrame = 0;
    let lastFocusedPage = availablePages[0];
    let highlightIndex = 0;

    return script.map((item, index) => {
      const from = currentFrame;
      const duration = item.duration ?? 90;
      currentFrame += duration;

      if (item.type === "focus" || item.type === "switch" || item.type === "fan") {
        highlightIndex++;
      }

      if (item.type === "focus" || item.type === "fan") {
        lastFocusedPage = item.page;
      }

      return {
        ...item,
        from,
        duration,
        index,
        highlightIndex: item.type === "focus" || item.type === "switch" || item.type === "fan" ? highlightIndex : 0,
        lastFocusedPage:
          item.type === "switch" || item.type === "fan" ? lastFocusedPage : undefined,
      };
    });
  }, [script, availablePages]);

  const currentScene = useMemo(() => {
    for (let i = sequences.length - 1; i >= 0; i--) {
      if (frame >= sequences[i].from) {
        return {
          type: sequences[i].type as SceneType,
          startFrame: sequences[i].from,
        };
      }
    }
    return { type: "stack" as SceneType, startFrame: 0 };
  }, [frame, sequences]);

  const firstFocusFrame = useMemo(() => {
    const firstNonStack = sequences.find((seq) => seq.type !== "stack");
    return firstNonStack?.from ?? 0;
  }, [sequences]);

  // Check if current scene is the ending stack
  const isEndingStack = useMemo(() => {
    const lastSeq = sequences[sequences.length - 1];
    return lastSeq?.type === "stack" && frame >= lastSeq.from;
  }, [sequences, frame]);

  // BGM fade in/out volume control
  const fadeInDuration = fps * 2; // 2 second fade in
  const fadeOutDuration = fps * 2; // 2 second fade out
  const bgmVolume = interpolate(
    frame,
    [0, fadeInDuration, durationInFrames - fadeOutDuration, durationInFrames],
    [0, 0.5, 0.5, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <PdfPreloader src={src} pages={availablePages}>
      <AbsoluteFill>
        {/* Background music - fade in/out */}
        <Audio src={staticFile("background.mp3")} volume={bgmVolume} />
        <GridBackground
          sceneType={currentScene.type}
          sceneStartFrame={currentScene.startFrame}
        />
        {sequences.map((seq, seqIndex) => {
        if (seq.type === "stack") {
          // Determine if this is opening or ending stack
          const isEnding = seqIndex === sequences.length - 1 && seqIndex > 0;
          return (
            <Sequence key={seq.index} from={seq.from} durationInFrames={seq.duration}>
              <StackScene
                src={src}
                pages={availablePages}
                onPagesLoaded={handlePagesLoaded}
                isEnding={isEnding}
              />
              {isEnding && (
                <EndingOverlay title={title} subtitle={subtitle} />
              )}
            </Sequence>
          );
        }

        if (seq.type === "focus") {
          const sceneTitle = seq.title || pageTitles?.[String(seq.page)] || `Page ${seq.page}`;
          const sceneDescription = pageDescriptions?.[String(seq.page)];

          return (
            <Sequence key={seq.index} from={seq.from} durationInFrames={seq.duration}>
              <FocusScene
                src={src}
                pages={availablePages}
                focusPage={seq.page}
                duration={seq.duration}
              />
              <BottomInfo
                title={sceneTitle}
                description={sceneDescription}
                currentIndex={seq.highlightIndex}
                totalCount={highlightCount}
              />
            </Sequence>
          );
        }

        if (seq.type === "switch") {
          const fromPage = seq.lastFocusedPage ?? availablePages[0];
          const sceneTitle = seq.title || pageTitles?.[String(seq.page)] || `Page ${seq.page}`;
          const sceneDescription = pageDescriptions?.[String(seq.page)];
          return (
            <Sequence key={seq.index} from={seq.from} durationInFrames={seq.duration}>
              <SwitchScene
                src={src}
                pages={availablePages}
                fromPage={fromPage}
                toPage={seq.page}
                duration={seq.duration}
              />
              <BottomInfo
                title={sceneTitle}
                description={sceneDescription}
                enterDelay={30}
                currentIndex={seq.highlightIndex}
                totalCount={highlightCount}
              />
            </Sequence>
          );
        }

        if (seq.type === "fan") {
          const previousPage = seq.lastFocusedPage;
          const sceneTitle = seq.title || pageTitles?.[String(seq.page)] || `Page ${seq.page}`;
          const sceneDescription = pageDescriptions?.[String(seq.page)];
          return (
            <Sequence key={seq.index} from={seq.from} durationInFrames={seq.duration}>
              <FanScene
                src={src}
                pages={availablePages}
                currentPage={seq.page}
                previousPage={previousPage}
              />
              <BottomInfo
                title={sceneTitle}
                description={sceneDescription}
                enterDelay={35}
                currentIndex={seq.highlightIndex}
                totalCount={highlightCount}
              />
            </Sequence>
          );
        }

        return null;
      })}
        {title && !isEndingStack && (
          <PersistentTitle
            title={title}
            subtitle={subtitle}
            sceneType={currentScene.type}
            firstFocusFrame={firstFocusFrame}
          />
        )}
      </AbsoluteFill>
    </PdfPreloader>
  );
};
