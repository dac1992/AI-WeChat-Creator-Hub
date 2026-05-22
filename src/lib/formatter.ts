import { FormattingTemplate } from "../types";

/**
 * Custom Markdown to WeChat-HTML Compiler
 * Conforms inline CSS styles directly to tags so they copy-paste safely into WeChat Editor
 */
export function compileMarkdownToWechatHTML(
  markdown: string,
  template: FormattingTemplate,
  ctaText?: string,
  articleImages: string[] = []
): string {
  if (!markdown) return "";

  // Split content by lines
  const lines = markdown.split("\n");
  let htmlResult = "";
  let inList = false;
  let listType: "ul" | "ol" | null = null;
  let inBlockquote = false;
  let blockquoteLines: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  // Helper to process inline formatting: bold, strong, highlights, inline-code
  const parseInline = (text: string): string => {
    let result = text;

    // Bold (**text** or __text__)
    result = result.replace(
      /\*\*(.*?)\*\*/g,
      `<strong style="${template.customStrongStyle}">$1</strong>`
    );
    result = result.replace(
      /__(.*?)__/g,
      `<strong style="${template.customStrongStyle}">$1</strong>`
    );

    // Code `code`
    const codeStyle = "font-family: monospace, Courier; background-color: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; word-break: break-all; color: #e83e8c;";
    result = result.replace(/`(.*?)`/g, `<code style="${codeStyle}">$1</code>`);

    // Underline
    result = result.replace(/~~(.*?)~~/g, "<del style=\"color: #a0aec0;\">$1</del>");

    return result;
  };

  const closeListIfOpen = (): string => {
    if (inList) {
      inList = false;
      const tag = listType;
      listType = null;
      return tag === "ul" ? "</ul>" : "</ol>";
    }
    return "";
  };

  const closeBlockquoteIfOpen = (): string => {
    if (inBlockquote) {
      inBlockquote = false;
      const blockContent = blockquoteLines.join("<br/>");
      blockquoteLines = [];
      return `<blockquote style="${template.customQuoteStyle}">${blockContent}</blockquote>`;
    }
    return "";
  };

  const closeTableIfOpen = (): string => {
    if (inTable) {
      inTable = false;
      const rows = tableRows;
      tableRows = [];
      const tableStyle = "width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px; text-align: left;";
      const thStyle = `background-color: ${template.primaryColor}; color: white; font-weight: bold; padding: 10px; border: 1px solid #e2e8f0;`;
      const tdStyle = "padding: 10px; border: 1px solid #e2e8f0;";

      let tableHtml = `<table style="${tableStyle}">`;
      rows.forEach((row, index) => {
        const columns = row.split("|").slice(1, -1).map(c => c.trim());
        tableHtml += "<tr>";
        columns.forEach(col => {
          if (index === 0) {
            tableHtml += `<th style="${thStyle}">${parseInline(col)}</th>`;
          } else {
            tableHtml += `<td style="${tdStyle}">${parseInline(col)}</td>`;
          }
        });
        tableHtml += "tr>";
      });
      tableHtml += "</table>";
      return tableHtml;
    }
    return "";
  };

  // Keep track of images inserted
  let imageCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // 1. Table support
    if (line.startsWith("|")) {
      htmlResult += closeListIfOpen();
      htmlResult += closeBlockquoteIfOpen();
      inTable = true;
      // Skip alignment separator lines like |---|---|
      if (!line.includes("---")) {
        tableRows.push(rawLine);
      }
      continue;
    } else {
      if (inTable) {
        htmlResult += closeTableIfOpen();
      }
    }

    // 2. Blockquote support
    if (line.startsWith(">")) {
      htmlResult += closeListIfOpen();
      inBlockquote = true;
      blockquoteLines.push(parseInline(line.substring(1).trim()));
      continue;
    } else {
      if (inBlockquote) {
        htmlResult += closeBlockquoteIfOpen();
      }
    }

    // 3. Headings support (## H2 or ### H3)
    if (line.startsWith("#")) {
      htmlResult += closeListIfOpen();
      const level = (line.match(/^#+/) || [""])[0].length;
      const headingText = line.substring(level).trim();
      if (level > 0 && headingText) {
        if (level === 2) {
          htmlResult += `<h2 style="${template.customHeadingStyle}">${parseInline(headingText)}</h2>`;
        } else {
          // Sub-heading style
          const subHeadingStyle = `color: ${template.primaryColor}; font-weight: bold; font-size: 17px; margin-top: 20px; margin-bottom: 12px; display: block; border-left: 3px solid ${template.primaryColor}; padding-left: 8px;`;
          htmlResult += `<h3 style="${subHeadingStyle}">${parseInline(headingText)}</h3>`;
        }
        continue;
      }
    }

    // 4. List Items
    const ulMatch = line.match(/^[\*\-]\s+(.*)/);
    const olMatch = line.match(/^\d+\.\s+(.*)/);

    if (ulMatch) {
      if (!inList || listType !== "ul") {
        htmlResult += closeListIfOpen();
        inList = true;
        listType = "ul";
        htmlResult += `<ul style="padding-left: 20px; margin: 12px 0; list-style-type: square; color: ${template.primaryColor};">`;
      }
      const liStyle = `color: #2D3748; margin-bottom: 6px; ${template.customTextStyle.replace(/margin-bottom:.*?;/, "")}`;
      htmlResult += `<li style="${liStyle}">${parseInline(ulMatch[1])}</li>`;
      continue;
    } else if (olMatch) {
      if (!inList || listType !== "ol") {
        htmlResult += closeListIfOpen();
        inList = true;
        listType = "ol";
        htmlResult += `<ol style="padding-left: 20px; margin: 12px 0; color: ${template.primaryColor};">`;
      }
      const liStyle = `color: #2D3748; margin-bottom: 6px; ${template.customTextStyle.replace(/margin-bottom:.*?;/, "")}`;
      htmlResult += `<li style="${liStyle}">${parseInline(olMatch[1])}</li>`;
      continue;
    } else {
      // Line is not a list item, close any active list tags
      htmlResult += closeListIfOpen();
    }

    // 5. Image Placeholder hook inside text
    // If the markdown itself has an image tag like ![image](...) or we want to allow users to trigger image embedding.
    const imgRegex = /!\[.*?\]\((.*?)\)/;
    const imgMatch = line.match(imgRegex);
    if (imgMatch) {
      const srcUrl = imgMatch[1];
      const imgWrapStyle = "text-align: center; margin: 20px 0; padding: 4px; background: transparent;";
      const imgStyle = "max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); display: block; margin: 0 auto;";
      htmlResult += `<div style="${imgWrapStyle}"><img src="${srcUrl}" style="${imgStyle}" referrerPolicy="no-referrer" /></div>`;
      continue;
    }

    // 6. Horizontal layout dividers
    if (line === "---" || line === "***") {
      const hrStyle = `height: 1.5px; border: none; background-color: ${template.secondaryColor}; margin: 24px auto; width: 80%; opacity: 0.7;`;
      htmlResult += `<hr style="${hrStyle}" />`;
      continue;
    }

    // Default: Normal Paragraph
    if (line !== "") {
      // Check if we want to sprinkle any automatic beautiful visual breaks for images if they exist
      htmlResult += `<p style="${template.customTextStyle}">${parseInline(line)}</p>`;
    } else {
      // Retain spacing for double list lines or empty lines
      htmlResult += "<div style=\"height: 8px;\"></div>";
    }
  }

  // Ensure everything leftover is closed
  htmlResult += closeListIfOpen();
  htmlResult += closeBlockquoteIfOpen();
  htmlResult += closeTableIfOpen();

  // 7. Append call to action (文末引导)
  if (ctaText) {
    const ctaWrapStyle = `margin: 32px 0 16px 0; padding: 20px; border-radius: 8px; border: 1px solid ${template.secondaryColor}; background-color: ${template.backgroundColor}; border-left: 6px solid ${template.primaryColor}; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);`;
    const cleanCta = ctaText
      .replace(/\*\*(.*?)\*\*/g, `<strong style="color: ${template.primaryColor}; font-weight: bold;">$1</strong>`)
      .replace(/\n/g, "<br/>");
    htmlResult += `
      <div style="${ctaWrapStyle}">
        <div style="font-size: 15px; line-height: 1.8; color: #4A5568;">
          ${cleanCta}
        </div>
      </div>
    `;
  }

  return `<div style="font-family: ${template.fontFamily}; max-width: 677px; margin: 0 auto; padding: 10px; background-color: #ffffff;">${htmlResult}</div>`;
}
