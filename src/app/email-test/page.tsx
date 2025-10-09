"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Send, ExternalLink, Mail, TestTube, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function EmailTestPage() {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    message: '',
    html: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const sendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      setLastResponse(result);

      if (result.success) {
        toast.success(result.message);
        
        // If there's a preview URL (development mode), show it
        if (result.previewUrl) {
          toast.success(
            <div className="flex items-center gap-2">
              <span>Email sent! Preview available</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(result.previewUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          );
        }
      } else {
        toast.error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
      setLastResponse({ success: false, error: 'Network error' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuickTest = () => {
    setFormData({
      to: 'test@example.com',
      subject: 'CompuCar Email Test',
      message: 'This is a test email from CompuCar e-commerce platform. If you receive this, the email system is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">🚗 CompuCar Email Test</h1>
          <p>This is a test email from your CompuCar e-commerce platform.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>✅ Email System Status: Working</h3>
            <p>Your email infrastructure is properly configured and ready for production!</p>
          </div>
          <p>Features tested:</p>
          <ul>
            <li>📧 Basic email sending</li>
            <li>🎨 HTML email content</li>
            <li>🔗 Link handling</li>
            <li>📱 Mobile-friendly formatting</li>
          </ul>
          <hr style="margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Sent from CompuCar Email System<br>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://compucar.pro'}" style="color: #2563eb;">Visit CompuCar</a>
          </p>
        </div>
      `,
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <TestTube className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Email Testing Center</h1>
            <p className="text-muted-foreground">Test your CompuCar email infrastructure</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            Development Mode: Ethereal Email
          </Badge>
          <Badge variant="secondary">
            API Route: /api/send-email
          </Badge>
        </div>

        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Development Mode Active</p>
                <p className="text-blue-700">
                  Emails are sent via Ethereal Email (test service). In production, switch to real SMTP credentials.
                  You'll receive a preview URL to see how your emails look.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Test Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={sendTestEmail} className="space-y-4">
              <div>
                <Label htmlFor="to">Recipient Email</Label>
                <Input
                  id="to"
                  name="to"
                  type="email"
                  value={formData.to}
                  onChange={handleInputChange}
                  placeholder="test@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Test Email Subject"
                  required
                />
              </div>

              <div>
                <Label htmlFor="message">Message (Plain Text)</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Your email message..."
                  required
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="html">HTML Content (Optional)</Label>
                <Textarea
                  id="html"
                  name="html"
                  value={formData.html}
                  onChange={handleInputChange}
                  placeholder="<h1>HTML email content...</h1>"
                  rows={6}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={loadQuickTest}>
                  Quick Test
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Response Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              API Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastResponse ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={lastResponse.success ? "default" : "destructive"}>
                    {lastResponse.success ? "✅ Success" : "❌ Failed"}
                  </Badge>
                  {lastResponse.messageId && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {lastResponse.messageId}
                    </Badge>
                  )}
                </div>

                {lastResponse.previewUrl && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 mb-2">📧 Email Preview Available</p>
                    <Button
                      size="sm"
                      onClick={() => window.open(lastResponse.previewUrl, '_blank')}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Email Preview
                    </Button>
                  </div>
                )}

                <div className="bg-gray-50 p-3 rounded-lg">
                  <Label className="text-xs font-medium text-gray-600">Raw Response:</Label>
                  <pre className="text-xs mt-1 overflow-auto max-h-40">
                    {JSON.stringify(lastResponse, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Send an email to see the API response</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Examples */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🚀 Production Integration Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">📧 Order Confirmation</h4>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap">{`{
  "to": "customer@email.com",
  "subject": "Order Confirmation #12345",
  "message": "Thank you for your order...",
  "html": "<h1>Order Confirmed!</h1>..."
}`}</pre>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">🔐 Password Reset</h4>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap">{`{
  "to": "user@email.com",
  "subject": "Reset Your Password",
  "message": "Click the link to reset...",
  "html": "<a href='...'>Reset Password</a>"
}`}</pre>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">🔧 Next Steps for Production:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Set up SMTP credentials in your .env.local file</li>
              <li>Test with real email addresses</li>
              <li>Integrate with your contact form and order system</li>
              <li>Add email templates for different types of notifications</li>
              <li>Monitor email delivery and add error handling</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
