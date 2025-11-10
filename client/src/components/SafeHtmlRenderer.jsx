import { useMemo } from 'react';

const SafeHtmlRenderer = ({ htmlContent, className = '' }) => {
  const sanitizedHtml = useMemo(() => {
    if (!htmlContent) return '';
    
    // Remove potentially dangerous elements and attributes
    let cleaned = htmlContent
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove iframe tags (common source of ads)
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      // Remove object and embed tags
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      // Remove form tags (potential security risk)
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
      // Remove link tags that might load external stylesheets
      .replace(/<link\b[^>]*>/gi, '')
      // Remove meta tags
      .replace(/<meta\b[^>]*>/gi, '')
      // Remove style tags with external imports
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove javascript: protocols
      .replace(/javascript:/gi, '')
      // Remove on* event handlers
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove data: URLs (can contain scripts)
      .replace(/data:/gi, '')
      // Remove external domain references that might be ads
      .replace(/https?:\/\/(?!localhost|127\.0\.0\.1)[^"'\s>]+/gi, '#')
      // Remove any remaining external scripts or suspicious content
      .replace(/document\./gi, '')
      .replace(/window\./gi, '')
      .replace(/eval\(/gi, '')
      .replace(/setTimeout\(/gi, '')
      .replace(/setInterval\(/gi, '');
    
    return cleaned;
  }, [htmlContent]);

  // If the content is empty after sanitization, show a message
  if (!sanitizedHtml.trim()) {
    return (
      <div className={`p-4 bg-gray-50 border border-gray-200 rounded-lg text-center ${className}`}>
        <p className="text-gray-500 text-sm">No safe content to display</p>
      </div>
    );
  }

  return (
    <div 
      className={`safe-html-content ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default SafeHtmlRenderer;