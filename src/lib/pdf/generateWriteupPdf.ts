import PDFDocument from 'pdfkit';
import { supabaseAdmin } from '../supabase';

interface PdfWriteupData {
  slug: string;
  title: string;
  platform: string;
  difficulty: string;
  os: string;
  datePublished: string;
  summary: string;
  initialAccessVector?: string;
  privEscVector?: string;
  content: string;
}

/**
 * Generates a cyberpunk dark-mode styled PDF for a writeup.
 * Returns a Buffer of the generated PDF.
 */
export async function generateWriteupPdfBuffer(data: PdfWriteupData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `${data.title} - ${data.platform} Penetration Testing Report`,
          Author: "Max 'Nulbyt3'",
          Subject: `${data.platform} ${data.difficulty} Machine Exploitation Walkthrough`,
          Keywords: `${data.platform}, CTF, Offensive Security, Red Team, ${data.os}`,
          Creator: 'Nulbyt3 Cybersec Vault Engine',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // Function to draw dark background
      const drawDarkBackground = () => {
        doc.save();
        doc.rect(0, 0, pageWidth, pageHeight).fill('#050708');
        doc.restore();
      };

      // Draw initial page background
      drawDarkBackground();

      // Whenever a page is added, paint the dark background
      doc.on('pageAdded', () => {
        drawDarkBackground();
      });

      // ── Header Box ──
      doc.rect(40, 40, pageWidth - 80, 110)
        .fillAndStroke('#0a0f14', '#1b2631');

      // Operator Tag
      doc.fontSize(8).fillColor('#00ff66').text('NULBYT3 // OFFENSIVE SECURITY VAULT', 55, 52);
      
      // Title
      doc.fontSize(22).fillColor('#ffffff').text(data.title.toUpperCase(), 55, 68);

      // Meta pills
      const metaText = `${data.platform}  •  ${data.difficulty.toUpperCase()}  •  ${data.os.toUpperCase()}  •  PUBLISHED: ${data.datePublished}`;
      doc.fontSize(9).fillColor('#9ca3af').text(metaText, 55, 96);

      // Author / Verified
      doc.fontSize(8).fillColor('#00ff66').text('STATUS: COMPROMISED // ROOT / SYSTEM ATTAINED', 55, 120);

      let currentY = 170;

      // ── Summary & Vectors Matrix ──
      if (data.summary) {
        doc.fontSize(10).fillColor('#00ff66').text('EXECUTIVE SYNOPSIS', 40, currentY);
        currentY += 16;
        doc.fontSize(9).fillColor('#d1d5db').text(data.summary, 40, currentY, {
          width: pageWidth - 80,
          lineGap: 3,
        });
        currentY = doc.y + 16;
      }

      // ── Attack Vector Matrix ──
      if (data.initialAccessVector || data.privEscVector) {
        const boxWidth = (pageWidth - 90) / 2;

        // Foothold box
        doc.rect(40, currentY, boxWidth, 55)
          .fillAndStroke('#0a1015', '#17222c');
        doc.fontSize(8).fillColor('#00ff66').text('INITIAL ACCESS VECTOR', 50, currentY + 10);
        doc.fontSize(8).fillColor('#e5e7eb').text(data.initialAccessVector || 'N/A', 50, currentY + 24, {
          width: boxWidth - 20,
          lineGap: 2,
        });

        // PrivEsc box
        doc.rect(40 + boxWidth + 10, currentY, boxWidth, 55)
          .fillAndStroke('#0a1015', '#17222c');
        doc.fontSize(8).fillColor('#f59e0b').text('PRIVILEGE ESCALATION CHAIN', 50 + boxWidth + 10, currentY + 10);
        doc.fontSize(8).fillColor('#e5e7eb').text(data.privEscVector || 'N/A', 50 + boxWidth + 10, currentY + 24, {
          width: boxWidth - 20,
          lineGap: 2,
        });

        currentY += 75;
      }

      // ── Content Parsing (Markdown lines) ──
      const lines = data.content.split('\n');
      let inCodeBlock = false;
      let codeLines: string[] = [];
      let codeLang = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if page end reached
        if (doc.y > pageHeight - 60) {
          doc.addPage();
        }

        if (line.trim().startsWith('```')) {
          if (!inCodeBlock) {
            inCodeBlock = true;
            codeLang = line.trim().replace(/^```/, '') || 'bash';
            codeLines = [];
          } else {
            // End of code block - render terminal container
            inCodeBlock = false;
            const codeText = codeLines.join('\n');
            const codeBoxHeight = Math.min(codeLines.length * 12 + 25, 200);

            if (doc.y + codeBoxHeight > pageHeight - 50) {
              doc.addPage();
            }

            const boxY = doc.y;
            doc.rect(40, boxY, pageWidth - 80, codeBoxHeight)
              .fillAndStroke('#06090c', '#1b2631');

            // Terminal bar
            doc.rect(40, boxY, pageWidth - 80, 16).fill('#0d141b');
            doc.fontSize(7).fillColor('#9ca3af').text(`TERMINAL // ${codeLang.toUpperCase()}`, 50, boxY + 4);

            // Code text
            doc.font('Courier')
              .fontSize(8)
              .fillColor('#00ff66')
              .text(codeText, 50, boxY + 22, {
                width: pageWidth - 100,
                lineGap: 2,
              });

            doc.font('Helvetica');
            doc.y = boxY + codeBoxHeight + 12;
          }
          continue;
        }

        if (inCodeBlock) {
          codeLines.push(line);
          continue;
        }

        // Section Headings
        if (line.startsWith('## ')) {
          doc.y += 10;
          if (doc.y > pageHeight - 60) doc.addPage();
          doc.fontSize(12).fillColor('#00ff66').text(line.replace('## ', '').toUpperCase());
          doc.y += 4;
        } else if (line.startsWith('### ')) {
          doc.y += 6;
          if (doc.y > pageHeight - 60) doc.addPage();
          doc.fontSize(10).fillColor('#ffffff').text(line.replace('### ', ''));
          doc.y += 2;
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          doc.fontSize(8.5).fillColor('#d1d5db').text(`•  ${line.substring(2)}`, {
            indent: 10,
            lineGap: 2,
          });
        } else if (line.trim().length > 0 && !line.startsWith('---')) {
          doc.fontSize(8.5).fillColor('#d1d5db').text(line, {
            width: pageWidth - 80,
            lineGap: 3,
          });
          doc.y += 4;
        }
      }

      // Footer
      try {
        const range = doc.bufferedPageRange();
        for (let p = range.start; p < range.start + range.count; p++) {
          try {
            doc.switchToPage(p);
            doc.fontSize(7).fillColor('#4b5563').text(
              `Nulbyt3 Offensive Security Vault  •  Page ${p - range.start + 1} of ${range.count}  •  Classified Lab Walkthrough`,
              40,
              pageHeight - 25,
              { align: 'center', width: pageWidth - 80 }
            );
          } catch (e) {}
        }
      } catch (footerErr) {
        console.warn('PDF footer numbering skipped:', footerErr);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generates and uploads the writeup PDF directly to Supabase Storage bucket 'writeup-pdfs'.
 * Returns the public URL of the uploaded PDF.
 */
export async function uploadWriteupPdfToSupabase(data: PdfWriteupData): Promise<string | null> {
  try {
    if (!supabaseAdmin) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for PDF uploads');
    const pdfBuffer = await generateWriteupPdfBuffer(data);
    const fileName = `${data.slug}/${data.slug}-report.pdf`;

    const { error } = await supabaseAdmin.storage
      .from('writeup-pdfs')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      console.error(`Failed to upload PDF for ${data.slug}:`, error.message);
      return null;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('writeup-pdfs')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error(`Error generating/uploading PDF for ${data.slug}:`, err);
    return null;
  }
}
