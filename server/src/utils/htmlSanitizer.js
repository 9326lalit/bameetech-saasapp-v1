// HTML Content Sanitizer (less aggressive, focused on external threats)
const sanitizeHtmlContent = (htmlContent) => {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return '';
  }

  // Only remove truly dangerous external content, allow local scripts and styles
  let cleaned = htmlContent
    // Remove external script sources (but allow inline scripts)
    .replace(/<script[^>]*src\s*=\s*["']https?:\/\/[^"']*["'][^>]*>.*?<\/script>/gi, '')
    // Remove external iframes (ads, tracking) but allow local ones
    .replace(/<iframe[^>]*src\s*=\s*["']https?:\/\/(?!localhost|127\.0\.0\.1)[^"']*["'][^>]*>.*?<\/iframe>/gi, '')
    // Remove external object and embed tags
    .replace(/<object[^>]*data\s*=\s*["']https?:\/\/[^"']*["'][^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*src\s*=\s*["']https?:\/\/[^"']*["'][^>]*>/gi, '')
    // Remove external form actions
    .replace(/(<form[^>]*action\s*=\s*["'])https?:\/\/[^"']*["']/gi, '$1#')
    // Remove external link stylesheets
    .replace(/<link[^>]*href\s*=\s*["']https?:\/\/[^"']*["'][^>]*>/gi, '')
    // Remove javascript: protocols in links
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')
    // Remove external URLs in src attributes (images, etc.) - replace with placeholder
    .replace(/src\s*=\s*["']https?:\/\/(?!localhost|127\.0\.0\.1)[^"']*["']/gi, 'src="#"')
    // Remove document cookie access
    .replace(/document\.cookie/gi, '/* document.cookie removed */')
    // Remove storage access
    .replace(/(localStorage\.|sessionStorage\.)/gi, '/* storage access removed */')
    // Remove external fetch/xhr calls
    .replace(/fetch\s*\(\s*["']https?:\/\/[^"']*["']/gi, 'fetch("#"')
    .replace(/XMLHttpRequest.*open.*["']https?:\/\/[^"']*["']/gi, '/* external request removed */');

  return cleaned.trim();
};

// Validate HTML content for safety (more flexible approach)
const validateHtmlContent = (htmlContent) => {
  if (!htmlContent) return { isValid: true, message: '' };

  // Only block truly dangerous patterns that could be used for attacks
  const reallyDangerous = [
    // External script sources
    /<script[^>]*src\s*=\s*["']https?:\/\//i,
    // External iframes (ads, tracking)
    /<iframe[^>]*src\s*=\s*["']https?:\/\/(?!localhost|127\.0\.0\.1)/i,
    // JavaScript protocols in links
    /href\s*=\s*["']javascript:/i,
    // External form actions
    /<form[^>]*action\s*=\s*["']https?:\/\//i,
    // External link stylesheets
    /<link[^>]*href\s*=\s*["']https?:\/\//i,
    // Document cookie access
    /document\.cookie/i,
    // Local storage access
    /localStorage\.|sessionStorage\./i,
    // XMLHttpRequest to external domains
    /XMLHttpRequest.*open.*https?:\/\//i,
    // Fetch to external domains
    /fetch\s*\(\s*["']https?:\/\//i
  ];

  for (const pattern of reallyDangerous) {
    if (pattern.test(htmlContent)) {
      return {
        isValid: false,
        message: 'HTML content contains external references or potentially dangerous elements. Please use local content only.'
      };
    }
  }

  return { isValid: true, message: '' };
};

module.exports = {
  sanitizeHtmlContent,
  validateHtmlContent
};