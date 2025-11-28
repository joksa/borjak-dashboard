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

interface EmailClientProps {
  config: {
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_SECURE?: string;
    SMTP_USER?: string;
    SMTP_PASS_SET: boolean;
    FROM_EMAIL?: string;
    FROM_NAME?: string;
  };
}

export default function EmailClient({ config }: EmailClientProps) {
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
        setResult({ type: "success", message: "Email poslat uspešno!" });
        // Clear form
        setTo("");
        setSubject("");
        setMessage("");
        setAttachments([]);
      } else {
        setResult({
          type: "error",
          message: response.error || "Email nije poslat.",
        });
      }
    } catch (error) {
      setResult({ type: "error", message: "Nepričekana greška." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Slanje emaila
        </h1>
        <p className="text-muted-secondary">
          Slanje emaila sa opcionalnim prilozima
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Slanje emaila
          </CardTitle>
          <CardDescription>
            Slanje emaila sa opcionalnim prilozima
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
                <Label htmlFor="subject">Naslov *</Label>
                <Input
                  id="subject"
                  placeholder="Naslov emaila"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Poruka *</Label>
              <Textarea
                id="message"
                placeholder="Unesite poruku"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="attachments">Prilozi (Opcionalno)</Label>
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
                        Dodaj prilozima
                      </span>
                    </Button>
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Podrzane formate: PDF, Word, Excel, PowerPoint, Text, CSV,
                  Slike, ZIP. Max velicina: {formatFileSize(MAX_FILE_SIZE)} po
                  fajlu
                </p>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  <Label>Prilozeni fajlovi:</Label>
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
                Dodaj fajl
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>Slanje...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Slanje emaila
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>      
    </div>
  );
}
