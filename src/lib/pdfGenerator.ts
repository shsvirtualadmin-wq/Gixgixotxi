import { Question } from '../types';
import { getWatermarkHtmlOverlay, getActiveLogoUrl, WATERMARK_LOGO_BASE64 } from './pdfWatermark';

interface PdfOptions {
  subject: string;
  gradeOrPath?: string;
  questions: Question[];
  includeAnswers?: boolean;
  studentName?: string;
}

/**
 * Checks if a string contains Urdu or Arabic script characters
 */
function containsUrdu(text: string): boolean {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

/**
 * Helper to asynchronously pre-load an image element for canvas drawing
 */
function loadImageAsync(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, 2500);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(img);
      }
    };
    img.onerror = () => {
      if (settled) return;
      // Fallback to embedded transparent PNG
      const fallback = new Image();
      fallback.onload = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(fallback);
        }
      };
      fallback.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(null);
        }
      };
      fallback.src = WATERMARK_LOGO_BASE64;
    };
    img.src = src;
  });
}

/**
 * Generates and downloads a clean, branded PDF worksheet or study guide
 * with full Unicode UTF-8 Urdu font support (Noto Nastaliq Urdu / Noto Sans Arabic)
 */
export async function downloadQuizPdf({
  subject,
  gradeOrPath = 'General Practice',
  questions,
  includeAnswers = false,
  studentName,
}: PdfOptions): Promise<void> {
  let container: HTMLDivElement | null = null;
  let measureContainer: HTMLDivElement | null = null;

  try {
    const generatePdfPromise = (async () => {
      // Create temporary container for rendering HTML to Canvas
      container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '0';
      container.style.top = '0';
      container.style.width = '794px'; // A4 width at 96DPI
      container.style.backgroundColor = 'transparent';
      container.style.color = '#0f172a'; // slate-900
      container.style.fontFamily = "'Noto Nastaliq Urdu', 'Noto Sans Arabic', 'Inter', -apple-system, sans-serif";
      container.style.padding = '0px'; // 0px padding so child 794px page divs align exactly at x=0
      container.style.boxSizing = 'border-box';
      container.style.zIndex = '-9999';
      container.style.opacity = '1';
      container.style.visibility = 'visible';
      container.style.pointerEvents = 'none';

      const dateStr = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const isUrduOrIslamiat =
        ['urdu', 'islam', 'din'].some((term) => (subject || '').toLowerCase().includes(term)) ||
        questions.some((q) => containsUrdu(q.q) || q.options.some((opt) => containsUrdu(opt)));

      const mainFont = "'Noto Nastaliq Urdu', 'Noto Sans Arabic', 'Inter', sans-serif";
      const urduChoiceLabels = ['الف', 'ب', 'ج', 'د'];

      const customLogoUrl = typeof window !== 'undefined' ? localStorage.getItem('boardly_logo_url') : null;
      const activeLogo = getActiveLogoUrl(customLogoUrl);

      // Preload logos & ensure web fonts are ready before measuring element heights
      const [watermarkLogoImage, headerLogoImage] = await Promise.all([
        loadImageAsync(WATERMARK_LOGO_BASE64),
        loadImageAsync(activeLogo),
      ]);

      if (document.fonts && document.fonts.ready) {
        try {
          await Promise.race([
            document.fonts.ready,
            new Promise((r) => setTimeout(r, 1000)),
          ]);
        } catch {}
      }
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Hidden offscreen container for measuring exact DOM element heights before rendering
      measureContainer = document.createElement('div');
      measureContainer.style.position = 'fixed';
      measureContainer.style.left = '-9999px';
      measureContainer.style.top = '-9999px';
      measureContainer.style.width = '794px'; // Exact A4 width at 96 DPI
      measureContainer.style.padding = '32px 32px 48px 32px';
      measureContainer.style.boxSizing = 'border-box';
      measureContainer.style.fontFamily = mainFont;
      measureContainer.style.fontSize = '13px';
      measureContainer.style.lineHeight = '1.8';
      measureContainer.style.visibility = 'hidden';
      measureContainer.style.pointerEvents = 'none';
      document.body.appendChild(measureContainer);

      const measureSnippetHeight = (htmlSnippet: string): number => {
        if (!measureContainer) return 0;
        measureContainer.innerHTML = htmlSnippet;
        const child = measureContainer.firstElementChild as HTMLElement;
        if (!child) return 0;
        const style = window.getComputedStyle(child);
        const marginTop = parseFloat(style.marginTop) || 0;
        const marginBottom = parseFloat(style.marginBottom) || 0;
        return child.getBoundingClientRect().height + marginTop + marginBottom;
      };

      // 1. Build Header Masthead HTML
      const mastheadHtml = `
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2.5px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 34px; height: 34px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background-color: #0A1330; border-radius: 8px; border: 1.5px solid #1E5AFF; padding: 2px; box-sizing: border-box;">
              <img src="${activeLogo}" crossorigin="anonymous" onerror="this.src='${WATERMARK_LOGO_BASE64}'" style="width: 100%; height: 100%; object-fit: contain; border-radius: 6px;" />
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h1 style="font-size: 16px; font-weight: 900; color: #0A1330; margin: 0; letter-spacing: 0.5px; font-family: 'Inter', -apple-system, sans-serif; line-height: 1;">
                  BOARDLY
                </h1>
                <span style="display: inline-flex; align-items: center; justify-content: center; height: 18px; padding: 0 7px; font-size: 9.5px; font-weight: 800; color: #1E5AFF; background-color: #eff6ff; border-radius: 4px; border: 1px solid #bfdbfe; text-transform: uppercase; font-family: 'Inter', -apple-system, sans-serif; line-height: 18px; box-sizing: border-box;">
                  SHS Virtual Academy
                </span>
              </div>
              <p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0; font-weight: 600;">
                ${isUrduOrIslamiat ? `آفیشل امتحانی مشق ورک شیٹ • ${subject}` : `Official Exam Practice Worksheet • ${subject}`}
              </p>
            </div>
          </div>
          <div style="text-align: right; font-size: 10px; color: #64748b; font-weight: 700;">
            <div>${dateStr}</div>
            <div style="color: #1E5AFF; font-weight: 800;">VERIFIED TEST PAPER</div>
          </div>
        </div>
      `;

      // 2. Build Metadata Box HTML
      const metadataHtml = `
        <div style="background-color: rgba(248, 250, 252, 0.85); border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 8px; font-size: 11px; color: #334155; text-align: ${isUrduOrIslamiat ? 'right' : 'left'}; box-sizing: border-box; width: 100%;">
          <div style="width: calc(33.333% - 6px); box-sizing: border-box;"><strong>${isUrduOrIslamiat ? 'مضمون:' : 'Subject:'}</strong> ${subject}</div>
          <div style="width: calc(33.333% - 6px); box-sizing: border-box;"><strong>${isUrduOrIslamiat ? 'کل سوالات:' : 'Total Questions:'}</strong> ${questions.length}</div>
          <div style="width: calc(33.333% - 6px); box-sizing: border-box;"><strong>${isUrduOrIslamiat ? 'طالب علم:' : 'Student:'}</strong> ${studentName || '_________________'}</div>
          <div style="width: calc(33.333% - 6px); box-sizing: border-box;"><strong>${isUrduOrIslamiat ? 'کلاس / گروہ:' : 'Path/Grade:'}</strong> ${gradeOrPath}</div>
          <div style="width: calc(33.333% - 6px); box-sizing: border-box;"><strong>${isUrduOrIslamiat ? 'تاریخ:' : 'Date:'}</strong> ${dateStr}</div>
          <div style="width: calc(33.333% - 6px); box-sizing: border-box;"><strong>${isUrduOrIslamiat ? 'رول نمبر:' : 'Roll No:'}</strong> _________________</div>
        </div>
      `;

      // Measure masthead & metadata heights
      const mastheadHeight = measureSnippetHeight(mastheadHtml);
      const metadataHeight = measureSnippetHeight(metadataHtml);

      // Constants for A4 page sizing @ 96 DPI
      const PAGE_WIDTH_PX = 794;
      const PAGE_HEIGHT_PX = 1123;
      const PAGE_PADDING_TOP = 32;
      const PAGE_PADDING_BOTTOM = 48; // Footer reserve
      const PAGE_USABLE_HEIGHT = PAGE_HEIGHT_PX - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM; // 1043px
      const TOP_HEADER_RESERVED = 68; // Reserved space on Page 2+ for header banner

      // Helper to build atomic question HTML snippet
      const getQuestionHtmlSnippet = (q: Question, idx: number): string => {
        const isUrduQ = isUrduOrIslamiat || containsUrdu(q.q);
        const qDir = isUrduQ ? 'rtl' : 'ltr';
        const qAlign = isUrduQ ? 'right' : 'left';
        const qFont = isUrduQ ? "'Noto Nastaliq Urdu', 'Noto Sans Arabic', serif" : "'Inter', sans-serif";

        let optionsHtml = '';
        q.options.forEach((opt, oIdx) => {
          const isUrduOpt = isUrduOrIslamiat || containsUrdu(opt);
          const optDir = isUrduOpt ? 'rtl' : 'ltr';
          const optAlign = isUrduOpt ? 'right' : 'left';
          const optFont = isUrduOpt ? "'Noto Nastaliq Urdu', 'Noto Sans Arabic', serif" : "'Inter', sans-serif";
          const letter = isUrduOpt ? urduChoiceLabels[oIdx] || String.fromCharCode(65 + oIdx) : String.fromCharCode(65 + oIdx);

          optionsHtml += `
            <div dir="${optDir}" style="box-sizing: border-box; width: 48.5%; font-size: 11px; color: #334155; text-align: ${optAlign}; font-family: ${optFont}; display: flex; align-items: flex-start; gap: 6px; line-height: 1.5; background-color: rgba(250, 250, 250, 0.85); border: 1px solid #e2e8f0; padding: 6px 10px; border-radius: 6px; word-break: break-word; overflow-wrap: anywhere; min-width: 0;">
              <span style="font-weight: 700; color: #475569; font-family: ${isUrduOpt ? "'Noto Nastaliq Urdu', 'Noto Sans Arabic', serif" : "'Inter', sans-serif"}; flex-shrink: 0; white-space: nowrap;">${letter}.</span>
              <span style="flex: 1; min-width: 0; word-break: break-word; overflow-wrap: anywhere; font-weight: 500;">${opt}</span>
            </div>
          `;
        });

        const optionsIndentStyle = isUrduQ
          ? 'margin-right: 8px; width: calc(100% - 8px);'
          : 'margin-left: 8px; width: calc(100% - 8px);';

        return `
          <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 16px; box-sizing: border-box; width: 100%;">
            <div dir="${qDir}" style="font-size: 13px; font-weight: 700; color: #0f172a; text-align: ${qAlign}; font-family: ${qFont}; line-height: 1.8; margin-bottom: 8px; word-break: break-word; overflow-wrap: anywhere;">
              <span style="color: #1E5AFF; font-family: 'Inter', sans-serif; font-weight: 800; ${isUrduQ ? 'margin-left: 6px;' : 'margin-right: 6px;'}">${isUrduQ ? `سوال ${idx + 1}.` : `Q${idx + 1}.`}</span>
              ${q.q}
            </div>
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; row-gap: 8px; ${optionsIndentStyle} box-sizing: border-box;">
              ${optionsHtml}
            </div>
          </div>
        `;
      };

      // Helper to build atomic answer explanation snippet
      const getAnswerHtmlSnippet = (q: Question, idx: number): string => {
        const isUrduAns = isUrduOrIslamiat || containsUrdu(q.options[q.correct] || '') || containsUrdu(q.explain || '');
        const correctLetter = isUrduAns ? urduChoiceLabels[q.correct] || String.fromCharCode(65 + q.correct) : String.fromCharCode(65 + q.correct);
        const correctOptText = q.options[q.correct] || '';
        const ansDir = isUrduAns ? 'rtl' : 'ltr';
        const ansAlign = isUrduAns ? 'right' : 'left';
        const ansFont = isUrduAns ? "'Noto Nastaliq Urdu', 'Noto Sans Arabic', serif" : "'Inter', sans-serif";

        return `
          <div style="background-color: rgba(248, 250, 252, 0.85); border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font-size: 11px; margin-bottom: 12px; box-sizing: border-box; width: 100%; word-break: break-word; overflow-wrap: anywhere;">
            <div dir="${ansDir}" style="font-weight: 700; color: #0f172a; text-align: ${ansAlign}; font-family: ${ansFont}; margin-bottom: 4px; word-break: break-word; overflow-wrap: anywhere;">
              <span style="color: #10b981;">${isUrduAns ? `سوال ${idx + 1}. صحیح جواب:` : `Q${idx + 1}. Correct Answer:`}</span>
              ${isUrduAns ? `آپشن (${correctLetter}) - ${correctOptText}` : `Option ${correctLetter} (${correctOptText})`}
            </div>
            <div dir="${ansDir}" style="color: #475569; text-align: ${ansAlign}; font-family: ${ansFont}; font-size: 10.5px; line-height: 1.6; word-break: break-word; overflow-wrap: anywhere;">
              <strong>${isUrduAns ? 'وضاحت:' : 'Explanation:'}</strong> ${q.explain || (isUrduAns ? 'کوئی تفصیل فراہم نہیں کی گئی۔' : 'No detailed explanation provided.')}
            </div>
          </div>
        `;
      };

      // Calculate atomic page allocation
      const pageChunks: string[][] = [ [] ];
      let currentPageIdx = 0;
      let currentRemainingSpace = PAGE_USABLE_HEIGHT - mastheadHeight - metadataHeight;

      // Process Questions
      questions.forEach((q, idx) => {
        const snippet = getQuestionHtmlSnippet(q, idx);
        const snippetHeight = measureSnippetHeight(snippet);

        // Check if entire question block fits on current page (with 16px safety margin)
        if (snippetHeight <= currentRemainingSpace - 16) {
          pageChunks[currentPageIdx].push(snippet);
          currentRemainingSpace -= snippetHeight;
        } else {
          // Move whole atomic question block to start of next page
          currentPageIdx++;
          pageChunks[currentPageIdx] = [snippet];
          currentRemainingSpace = PAGE_USABLE_HEIGHT - TOP_HEADER_RESERVED - snippetHeight;
        }
      });

      // Process Optional Answer Key & Explanations Page
      if (includeAnswers) {
        const ansHeaderHtml = `
          <div style="text-align: center; margin-bottom: 16px; padding-top: 12px; border-top: 2px dashed #cbd5e1;" dir="${isUrduOrIslamiat ? 'rtl' : 'ltr'}">
            <h2 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; font-family: ${mainFont};">
              ${isUrduOrIslamiat ? 'جوابات اور اہم وضاحت' : 'Official Answer Key & Explanations'}
            </h2>
            <p style="font-size: 10px; color: #64748b; margin: 4px 0 0 0; font-family: ${mainFont};">
              ${isUrduOrIslamiat ? 'ایس ایچ ایس ورچوئل اکیڈمی راہنمائی حل' : 'Detailed guidance solutions provided by SHS Virtual Academy'}
            </p>
          </div>
        `;
        const ansHeaderHeight = measureSnippetHeight(ansHeaderHtml);

        // If remaining space on current page is tight (< header + 1 answer), start answer key on fresh page
        if (currentRemainingSpace < ansHeaderHeight + 100) {
          currentPageIdx++;
          pageChunks[currentPageIdx] = [ansHeaderHtml];
          currentRemainingSpace = PAGE_USABLE_HEIGHT - TOP_HEADER_RESERVED - ansHeaderHeight;
        } else {
          pageChunks[currentPageIdx].push(ansHeaderHtml);
          currentRemainingSpace -= ansHeaderHeight;
        }

        questions.forEach((q, idx) => {
          const ansSnippet = getAnswerHtmlSnippet(q, idx);
          const ansHeight = measureSnippetHeight(ansSnippet);

          if (ansHeight <= currentRemainingSpace - 16) {
            pageChunks[currentPageIdx].push(ansSnippet);
            currentRemainingSpace -= ansHeight;
          } else {
            currentPageIdx++;
            pageChunks[currentPageIdx] = [ansSnippet];
            currentRemainingSpace = PAGE_USABLE_HEIGHT - TOP_HEADER_RESERVED - ansHeight;
          }
        });
      }

      // Assemble final HTML using explicit fixed-height A4 page containers
      let finalHtml = `<div style="position: relative; width: ${PAGE_WIDTH_PX}px; background-color: transparent;">`;

      pageChunks.forEach((chunkItems, pIdx) => {
        const isFirstPage = pIdx === 0;

        finalHtml += `
          <div style="width: ${PAGE_WIDTH_PX}px; height: ${PAGE_HEIGHT_PX}px; box-sizing: border-box; padding: ${PAGE_PADDING_TOP}px 32px ${PAGE_PADDING_BOTTOM}px 32px; position: relative; overflow: hidden; background-color: transparent;">
            <div dir="${isUrduOrIslamiat ? 'rtl' : 'ltr'}" style="position: relative; z-index: 1; font-family: ${mainFont}; text-align: ${isUrduOrIslamiat ? 'right' : 'left'}; line-height: 1.8;">
        `;

        if (isFirstPage) {
          finalHtml += mastheadHtml;
          finalHtml += metadataHtml;
        } else {
          // Top spacer for Page 2+ header banner
          finalHtml += `<div style="height: ${TOP_HEADER_RESERVED}px; width: 100%;"></div>`;
        }

        chunkItems.forEach((itemHtml) => {
          finalHtml += itemHtml;
        });

        finalHtml += `
            </div>
          </div>
        `;
      });

      finalHtml += `</div>`;

      container.innerHTML = finalHtml;
      document.body.appendChild(container);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const [html2canvasModule, jspdfModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const html2canvas = (html2canvasModule.default || html2canvasModule) as (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;
      const PDFConstructor = (jspdfModule.jsPDF || jspdfModule.default) as any;
      if (!PDFConstructor) {
        throw new Error('PDF export library unavailable — please try again');
      }

      const canvas = await html2canvas(container, {
        scale: 1.6, // Optimal crispness
        useCORS: true,
        logging: false,
        backgroundColor: null, // Transparent background so watermark behind shows through
        allowTaint: true,
        foreignObjectRendering: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: Math.max(1200, container.scrollHeight + 100),
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas rendering failed to capture layout.');
      }

      const pdf = new PDFConstructor('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // Slice master canvas into clean A4 height pages matching pageChunks count
      const totalPages = pageChunks.length;
      const pageCanvasHeight = Math.round(canvas.height / totalPages);
      const totalCanvasHeight = canvas.height;
      let renderedHeight = 0;
      let pageNumber = 0;

      while (pageNumber < totalPages) {
        if (pageNumber > 0) {
          pdf.addPage();
        }

        const currentSliceHeight = Math.min(pageCanvasHeight, totalCanvasHeight - renderedHeight);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = currentSliceHeight;

        const ctx = sliceCanvas.getContext('2d');
        if (ctx) {
          // 1. Crisp White Background for paper page
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);

          // 2. Large Centered Transparent Boardly Watermark Logo on EVERY Page
          const wmImg = watermarkLogoImage || headerLogoImage;
          if (wmImg) {
            ctx.save();
            ctx.globalAlpha = 0.09;
            const wmSize = Math.min(sliceCanvas.width * 0.65, currentSliceHeight * 0.65);
            const wmX = (sliceCanvas.width - wmSize) / 2;
            const wmY = (currentSliceHeight - wmSize) / 2;
            ctx.drawImage(wmImg, wmX, wmY, wmSize, wmSize);
            ctx.restore();
          }

          // 3. Draw Captured HTML Content Slice on top of watermark
          ctx.drawImage(
            canvas,
            0,
            renderedHeight,
            canvas.width,
            currentSliceHeight,
            0,
            0,
            canvas.width,
            currentSliceHeight
          );

          // 4. Crisp Header/Masthead Bar on Page 2+
          if (pageNumber > 0) {
            ctx.save();

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, sliceCanvas.width, 68);

            // Styled logo box (identical 34px x 34px container as Page 1)
            ctx.fillStyle = '#0A1330';
            ctx.strokeStyle = '#1E5AFF';
            ctx.lineWidth = 1;
            ctx.beginPath();
            if (typeof (ctx as any).roundRect === 'function') {
              (ctx as any).roundRect(32, 12, 34, 34, 8);
            } else {
              ctx.rect(32, 12, 34, 34);
            }
            ctx.fill();
            ctx.stroke();

            const topLogo = headerLogoImage || watermarkLogoImage;
            if (topLogo) {
              ctx.drawImage(topLogo, 34, 14, 30, 30);
            }

            // Title "BOARDLY"
            ctx.font = '900 16px Inter, sans-serif';
            ctx.fillStyle = '#0A1330';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('BOARDLY', 78, 24);

            const boardlyWidth = ctx.measureText('BOARDLY').width;

            // Badge pill box for "SHS VIRTUAL ACADEMY" (placed dynamically 8px after BOARDLY)
            const badgeX = 78 + boardlyWidth + 8;
            const badgeText = 'SHS VIRTUAL ACADEMY';
            ctx.font = '800 9.5px Inter, sans-serif';
            const badgeTextWidth = ctx.measureText(badgeText).width;
            const badgeWidth = badgeTextWidth + 14; // 7px padding left & right
            const badgeHeight = 18;
            const badgeY = 15; // vertically centered with baseline at y=24

            ctx.fillStyle = '#eff6ff';
            ctx.strokeStyle = '#bfdbfe';
            ctx.lineWidth = 1;
            ctx.beginPath();
            if (typeof (ctx as any).roundRect === 'function') {
              (ctx as any).roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 4);
            } else {
              ctx.rect(badgeX, badgeY, badgeWidth, badgeHeight);
            }
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#1E5AFF';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, badgeX + 7, badgeY + (badgeHeight / 2));

            const subTitleText = isUrduOrIslamiat
              ? `آفیشل امتحانی مشق ورک شیٹ • ${subject}`
              : `Official Exam Practice Worksheet • ${subject}`;
            ctx.font = isUrduOrIslamiat
              ? '600 11px "Noto Nastaliq Urdu", "Noto Sans Arabic", Inter, sans-serif'
              : '600 11px Inter, sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(subTitleText, 78, 44);

            ctx.textAlign = 'right';
            ctx.font = '800 11px Inter, sans-serif';
            ctx.fillStyle = '#1E5AFF';
            ctx.fillText(`PAGE ${pageNumber + 1} OF ${totalPages}`, sliceCanvas.width - 32, 32);

            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(32, 62);
            ctx.lineTo(sliceCanvas.width - 32, 62);
            ctx.stroke();

            ctx.restore();
          }

          // 5. Crisp Page Footer on Every Page
          ctx.save();
          ctx.font = '500 9px Inter, sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.textAlign = 'center';
          ctx.fillText(`Boardly Official Exam Practice • Page ${pageNumber + 1} of ${totalPages}`, sliceCanvas.width / 2, sliceCanvas.height - 12);
          ctx.restore();
        }

        const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.92);
        const sliceImgHeight = (currentSliceHeight * pdfWidth) / canvas.width;

        pdf.addImage(sliceImgData, 'JPEG', 0, 0, pdfWidth, sliceImgHeight);

        renderedHeight += pageCanvasHeight;
        pageNumber++;
      }

      const cleanSubject = (subject || 'Quiz').replace(/[^a-zA-Z0-9]/g, '_');
      const cleanGrade = (gradeOrPath || 'Practice').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Boardly_${cleanSubject}_${cleanGrade}_Quiz.pdf`;

      pdf.save(fileName);
    })();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('PDF generation timed out (~15s). Please try again or use the Print button.'));
      }, 15000);
    });

    await Promise.race([generatePdfPromise, timeoutPromise]);
  } catch (err: any) {
    console.error('PDF Generation Error:', err);
    throw err;
  } finally {
    if (measureContainer && document.body.contains(measureContainer)) {
      document.body.removeChild(measureContainer);
    }
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
