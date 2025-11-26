"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  sendEmail,
  isValidEmail,
  isAllowedFileType,
  formatFileSize,
  MAX_FILE_SIZE,
} from "@/lib/email";
import {
  Mail,
  Paperclip,
  X,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DashboardPage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        setResult({
          type: "error",
          message: `File ${
            file.name
          } is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`,
        });
        return false;
      }
      if (!isAllowedFileType(file)) {
        setResult({
          type: "error",
          message: `File type ${file.type} is not allowed for ${file.name}.`,
        });
        return false;
      }
      return true;
    });

    setAttachments((prev) => [...prev, ...validFiles]);
    e.target.value = ""; // Reset input
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!to.trim() || !subject.trim() || !message.trim()) {
      setResult({
        type: "error",
        message: "Please fill in all required fields.",
      });
      return;
    }

    if (!isValidEmail(to)) {
      setResult({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await sendEmail({
        to: to.trim(),
        subject: subject.trim(),
        text: message.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (response.success) {
        setResult({ type: "success", message: "Email sent successfully!" });
        // Clear form
        setTo("");
        setSubject("");
        setMessage("");
        setAttachments([]);
      } else {
        setResult({
          type: "error",
          message: response.error || "Failed to send email.",
        });
      }
    } catch (error) {
      setResult({ type: "error", message: "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-muted-foreground">
          Email Sender ... { process.env.NEXT_PUBLIC_TOKEN_EXPIRE}
        </h1>
        <p className="text-muted-foreground">
          Send emails with optional file attachments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email
          </CardTitle>
          <CardDescription>
            Compose and send emails with file attachments. Make sure to
            configure your SMTP settings in .env.local
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="to">To *</Label>
                <Input
                  id="to"
                  type="email"
                  placeholder="recipient@example.com"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Email subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Enter your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="attachments">Attachments (Optional)</Label>
                <div className="mt-2">
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Label htmlFor="attachments">
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer"
                      asChild
                    >
                      <span>
                        <Paperclip className="h-4 w-4 mr-2" />
                        Add Attachments
                      </span>
                    </Button>
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Supported formats: PDF, Word, Excel, PowerPoint, Text, CSV,
                  Images, ZIP. Max size: {formatFileSize(MAX_FILE_SIZE)} per
                  file
                </p>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  <Label>Attached Files:</Label>
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {result && (
              <Alert
                variant={result.type === "success" ? "default" : "destructive"}
              >
                {result.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Create a small test text file
                  const testFile = new File(
                    ["This is a test attachment file."],
                    "test.txt",
                    { type: "text/plain" }
                  );
                  setAttachments([testFile]);
                }}
                className="flex-1"
              >
                Add Test File
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Configure SMTP Settings</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Update the following variables in your <code>.env.local</code>{" "}
              file:
            </p>
            <div className="bg-muted p-3 rounded-md font-mono text-sm">
              SMTP_HOST=smtp.gmail.com
              <br />
              SMTP_PORT=587
              <br />
              SMTP_USER=your-email@gmail.com
              <br />
              SMTP_PASS=your-app-password
              <br />
              FROM_EMAIL=your-email@gmail.com
              <br />
              FROM_NAME=Your Name
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">
              2. Gmail Setup (if using Gmail)
            </h4>
            <p className="text-sm text-muted-foreground">
              For Gmail, you need to generate an "App Password":
            </p>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1 mt-2">
              <li>Go to Google Account settings</li>
              <li>Enable 2-Factor Authentication</li>
              <li>Go to Security → App passwords</li>
              <li>Generate a password for "Mail"</li>
              <li>Use this password as SMTP_PASS</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
