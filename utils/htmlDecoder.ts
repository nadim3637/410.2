
export const decodeHtml = (content: string | undefined | null): string => {
  if (!content) return '';

  let processed = content.trim();

  // 1. Remove surrounding quotes if present (artifact of JSON stringification)
  if (processed.startsWith('"') && processed.endsWith('"')) {
      processed = processed.slice(1, -1);
  }

  // 2. Decode Base64 if applicable
  // Check for Data URI
  if (processed.startsWith('data:text/html;base64,')) {
      try {
          const base64 = processed.split(',')[1];
          processed = decodeURIComponent(escape(atob(base64)));
      } catch (e) {
          console.warn('Failed to decode Data URI', e);
      }
  } 
  // Check for raw Base64 (No spaces, has < or > implies NOT Base64)
  else if (/^[A-Za-z0-9+/=]+$/.test(processed)) {
      try {
          const decoded = decodeURIComponent(escape(atob(processed)));
          // Validation: If it looks like HTML or meaningful text, accept it.
          if (decoded.includes('<') || decoded.includes(' ') || decoded.length > 0) {
              processed = decoded;
          }
      } catch (e) {
          // Not Base64, ignore
      }
  }

  // 3. Unescape HTML Entities (The likely cause of "showing HTML code")
  // e.g. "&lt;h1&gt;" -> "<h1>"
  if (processed.includes('&lt;') || processed.includes('&gt;') || processed.includes('&amp;') || processed.includes('&quot;')) {
      try {
          const textarea = document.createElement('textarea');
          textarea.innerHTML = processed;
          const unescaped = textarea.value;
          
          // Double check: if unescaping reveals MORE entities, do it again? (Recursion limit 2)
          if (unescaped !== processed) {
             processed = unescaped;
          }
      } catch (e) {
          // document not available (SSR), use basic replace
          processed = processed
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'");
      }
  }

  return processed;
};
