interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: File[];
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  message?: string;
  error?: string;
}

/**
 * Send email with optional file attachments
 * @param data - Email data including recipient, subject, content, and optional attachments
 * @returns Promise with response indicating success or failure
 */
export async function sendEmail(data: EmailData): Promise<EmailResponse> {
  try {
    const formData = new FormData();

    // Add basic email data
    formData.append("to", data.to);
    formData.append("subject", data.subject);

    if (data.text) {
      formData.append("text", data.text);
    }

    if (data.html) {
      formData.append("html", data.html);
    }

    // Add file attachments
    if (data.attachments && data.attachments.length > 0) {
      console.log(
        `📎 Preparing ${data.attachments.length} attachments for sending`
      );
      data.attachments.forEach((file, index) => {
        console.log(
          `📎 Adding attachment: ${file.name} (${file.size} bytes, ${file.type})`
        );
        formData.append(`attachment_${index}`, file);
      });
    }

    console.log("📤 Sending email request...");
    const response = await fetch("/api/send-email", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to send email");
    }

    return result;
  } catch (error) {
    console.error("Email sending error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Validate email address format
 * @param email - Email address to validate
 * @returns boolean indicating if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get file size in human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Check if file type is allowed for email attachment
 * @param file - File to check
 * @returns boolean indicating if file type is allowed
 */
export function isAllowedFileType(file: File): boolean {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/zip",
    "application/x-rar-compressed",
  ];

  return allowedTypes.includes(file.type);
}

/**
 * Maximum file size for attachments (25MB)
 */
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes
