import { chromium } from "playwright";
import { storage } from "../storage";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

const EXPORTS_DIR = "/data/exports";

interface PdfExportOptions {
  token: string;
  teamId?: string;
  brandLogo?: string;
  brandColor?: string;
}

export async function generatePdfExport(options: PdfExportOptions): Promise<{
  filePath: string;
  fileName: string;
  bytesSize: number;
}> {
  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();

    const publicReport = await storage.getPublicReportByToken(options.token);
    if (!publicReport) {
      throw new Error("Public report not found");
    }

    const domain = await storage.getDomain(publicReport.domainId);
    if (!domain) {
      throw new Error("Domain not found");
    }

    const scanRun = await storage.getScanRun(publicReport.runId);
    if (!scanRun) {
      throw new Error("Scan run not found");
    }
    
    const runDate = scanRun
      ? new Date(scanRun.createdAt).toISOString().split("T")[0].replace(/-/g, "")
      : new Date().toISOString().split("T")[0].replace(/-/g, "");

    let brandLogo = options.brandLogo;
    let brandColor = options.brandColor;

    if (options.teamId) {
      const team = await storage.getTeamById(options.teamId);
      if (team) {
        brandLogo = team.brandLogo || brandLogo;
        brandColor = team.brandColor || brandColor;
      }
    }

    let url = `http://localhost:5000/r/${options.token}?pdf=1`;
    
    if (options.teamId) {
      url += `&brand=${options.teamId}`;
    }

    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await page.waitForSelector("#report-ready", { timeout: 10000 }).catch(() => {
      console.log("Report ready element not found, proceeding anyway");
    });

    if (brandLogo || brandColor) {
      await page.evaluate(
        ({ logo, color }) => {
          if (color) {
            document.documentElement.style.setProperty("--brand-primary", color);
          }
          if (logo) {
            const logoEl = document.querySelector("[data-brand-logo]");
            if (logoEl) {
              (logoEl as HTMLImageElement).src = logo;
            }
          }
        },
        { logo: brandLogo, color: brandColor }
      );
    }

    await mkdir(EXPORTS_DIR, { recursive: true });

    const fileName = `${domain.name}-${runDate}.pdf`;
    const filePath = join(EXPORTS_DIR, fileName);

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "12mm",
        right: "12mm",
        bottom: "12mm",
        left: "12mm",
      },
      printBackground: true,
      preferCSSPageSize: false,
    });

    await writeFile(filePath, pdfBuffer);

    return {
      filePath,
      fileName,
      bytesSize: pdfBuffer.length,
    };
  } finally {
    await browser.close();
  }
}
