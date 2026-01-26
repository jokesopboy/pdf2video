import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfPreloaderProps {
  src: string;
  pages: number[];
  children: React.ReactNode;
}

/**
 * Preloads all specified PDF pages before rendering children.
 * This ensures all pages are cached before the video rendering starts.
 */
export const PdfPreloader: React.FC<PdfPreloaderProps> = ({
  src,
  pages,
  children,
}) => {
  const [handle] = useState(() => delayRender("Preloading PDF pages"));
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [isReady, setIsReady] = useState(false);

  const pdfSrc = src.startsWith("/") ? staticFile(src.slice(1)) : src;

  useEffect(() => {
    if (loadedPages.size >= pages.length && !isReady) {
      setIsReady(true);
      continueRender(handle);
    }
  }, [loadedPages, pages.length, handle, isReady]);

  const handlePageRenderSuccess = (pageNum: number) => {
    setLoadedPages((prev) => new Set([...prev, pageNum]));
  };

  return (
    <>
      {/* Hidden preloader - renders all pages off-screen to cache them */}
      <div
        style={{
          position: "absolute",
          left: -9999,
          top: -9999,
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        <Document file={pdfSrc} loading={null}>
          {pages.map((pageNum) => (
            <Page
              key={pageNum}
              pageNumber={pageNum}
              width={500}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onRenderSuccess={() => handlePageRenderSuccess(pageNum)}
            />
          ))}
        </Document>
      </div>
      {/* Only render children after all pages are preloaded */}
      {isReady && children}
    </>
  );
};
