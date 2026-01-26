import { useCallback, useState, useRef } from "react";
import { continueRender, delayRender, staticFile, cancelRender } from "remotion";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfPageProps {
  src: string;
  pageNumber: number;
  width?: number;
  height?: number;
  renderScale?: number;
  onLoadSuccess?: (numPages: number) => void;
}

export const PdfPage: React.FC<PdfPageProps> = ({
  src,
  pageNumber,
  width = 400,
  height,
  renderScale = 1,
  onLoadSuccess,
}) => {
  const [handle] = useState(() => delayRender(`Loading PDF page ${pageNumber}`));
  const [isVisible, setIsVisible] = useState(false);
  const renderCompleted = useRef(false);

  const handleDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      onLoadSuccess?.(numPages);
    },
    [onLoadSuccess]
  );

  const handlePageRenderSuccess = useCallback(() => {
    // Delay to ensure canvas content is fully rendered (including images)
    setTimeout(() => {
      if (!renderCompleted.current) {
        renderCompleted.current = true;
        setIsVisible(true);
        continueRender(handle);
      }
    }, 100);
  }, [handle]);

  const handleError = useCallback((error: Error) => {
    console.error("PDF error:", error);
    if (!renderCompleted.current) {
      renderCompleted.current = true;
      cancelRender(error);
    }
  }, []);

  const pdfSrc = src.startsWith("/") ? staticFile(src.slice(1)) : src;

  // Use devicePixelRatio to improve render resolution while keeping layout size unchanged
  return (
    <div style={{ opacity: isVisible ? 1 : 0 }}>
      <Document
        file={pdfSrc}
        onLoadSuccess={handleDocumentLoadSuccess}
        onLoadError={handleError}
        loading={null}
      >
        <Page
          pageNumber={pageNumber}
          width={width}
          height={height}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          onRenderSuccess={handlePageRenderSuccess}
          onRenderError={handleError}
          devicePixelRatio={renderScale}
        />
      </Document>
    </div>
  );
};
