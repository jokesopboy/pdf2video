import { useCallback, useState, useRef, useEffect } from "react";
import { continueRender, delayRender, staticFile, cancelRender } from "remotion";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Global PDF document cache to avoid repeated loading
const pdfDocumentCache = new Map<string, Promise<pdfjs.PDFDocumentProxy>>();

function getPdfDocument(src: string): Promise<pdfjs.PDFDocumentProxy> {
  if (!pdfDocumentCache.has(src)) {
    const loadingTask = pdfjs.getDocument({
      url: src,
      cMapUrl: "https://unpkg.com/pdfjs-dist@4.4.168/cmaps/",
      cMapPacked: true,
    });
    pdfDocumentCache.set(src, loadingTask.promise);
  }
  return pdfDocumentCache.get(src)!;
}

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
  const [handle] = useState(() => delayRender(`Loading PDF page ${pageNumber}`, { timeoutInMilliseconds: 60000 }));
  const [isVisible, setIsVisible] = useState(false);
  const [pdfDocument, setPdfDocument] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const renderCompleted = useRef(false);

  const pdfSrc = src.startsWith("/") ? staticFile(src.slice(1)) : src;

  // Pre-load PDF document using cache
  useEffect(() => {
    getPdfDocument(pdfSrc)
      .then((doc) => {
        setPdfDocument(doc);
        onLoadSuccess?.(doc.numPages);
      })
      .catch((error) => {
        console.error("PDF load error:", error);
        if (!renderCompleted.current) {
          renderCompleted.current = true;
          cancelRender(error);
        }
      });
  }, [pdfSrc, onLoadSuccess]);

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
    console.error("PDF page render error:", error);
    if (!renderCompleted.current) {
      renderCompleted.current = true;
      cancelRender(error);
    }
  }, []);

  // Wait for PDF document to load
  if (!pdfDocument) {
    return null;
  }

  // Use devicePixelRatio to improve render resolution while keeping layout size unchanged
  return (
    <div style={{ opacity: isVisible ? 1 : 0 }}>
      <Document
        file={pdfSrc}
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
