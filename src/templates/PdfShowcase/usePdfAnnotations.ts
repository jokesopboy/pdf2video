import { useCallback, useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { pdfjs } from "react-pdf";

export interface PdfAnnotation {
  id: string;
  pageNumber: number;
  subtype: string;
  rect: [number, number, number, number];
  color?: { r: number; g: number; b: number };
  contents?: string;
  quadPoints?: number[];
  pageWidth: number;
  pageHeight: number;
}

export interface PdfAnnotationsResult {
  annotations: PdfAnnotation[];
  pageAnnotations: Map<number, PdfAnnotation[]>;
  loading: boolean;
  error: Error | null;
}

export function usePdfAnnotations(src: string): PdfAnnotationsResult {
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [handle] = useState(() => delayRender("Loading PDF annotations"));

  const loadAnnotations = useCallback(async () => {
    try {
      const pdfSrc = src.startsWith("/") ? staticFile(src.slice(1)) : src;
      const loadingTask = pdfjs.getDocument(pdfSrc);
      const pdf = await loadingTask.promise;

      const allAnnotations: PdfAnnotation[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1 });
        const pageAnnotations = await page.getAnnotations();

        for (const annot of pageAnnotations) {
          if (
            annot.subtype === "Highlight" ||
            annot.subtype === "Underline" ||
            annot.subtype === "StrikeOut" ||
            annot.subtype === "Text" ||
            annot.subtype === "FreeText"
          ) {
            allAnnotations.push({
              id: annot.id || `${pageNum}-${allAnnotations.length}`,
              pageNumber: pageNum,
              subtype: annot.subtype,
              rect: annot.rect,
              color: annot.color
                ? {
                    r: Math.round(annot.color[0] * 255),
                    g: Math.round(annot.color[1] * 255),
                    b: Math.round(annot.color[2] * 255),
                  }
                : undefined,
              contents: annot.contents,
              quadPoints: annot.quadPoints,
              pageWidth: viewport.width,
              pageHeight: viewport.height,
            });
          }
        }
      }

      setAnnotations(allAnnotations);
      setLoading(false);
      continueRender(handle);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      continueRender(handle);
    }
  }, [src, handle]);

  useEffect(() => {
    loadAnnotations();
  }, [loadAnnotations]);

  const pageAnnotations = new Map<number, PdfAnnotation[]>();
  for (const annot of annotations) {
    const existing = pageAnnotations.get(annot.pageNumber) || [];
    existing.push(annot);
    pageAnnotations.set(annot.pageNumber, existing);
  }

  return {
    annotations,
    pageAnnotations,
    loading,
    error,
  };
}
