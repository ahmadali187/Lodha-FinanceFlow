import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BudgetAlertRequest {
  email: string;
  category: string;
  spent: number;
  limit: number;
  percentage: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, category, spent, limit, percentage }: BudgetAlertRequest = await req.json();

    console.log("Sending budget alert to:", email, "for category:", category);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "FinanceFlow <onboarding@resend.dev>",
        to: [email],
        subject: `⚠️ Budget Alert: ${category} - ${percentage}% Used`,
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Budget Alert</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Hello! This is an automated alert from FinanceFlow.
                </p>
                
                <div style="background: ${percentage >= 90 ? '#fee2e2' : '#fef3c7'}; border-left: 4px solid ${percentage >= 90 ? '#dc2626' : '#f59e0b'}; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <h2 style="color: ${percentage >= 90 ? '#991b1b' : '#92400e'}; margin: 0 0 10px 0; font-size: 20px;">
                    ${percentage >= 90 ? '🚨 Critical Alert' : '⚠️ Warning'}
                  </h2>
                  <p style="margin: 0; color: ${percentage >= 90 ? '#7f1d1d' : '#78350f'}; font-size: 15px;">
                    You've used <strong>${percentage}%</strong> of your <strong>${category}</strong> budget.
                  </p>
                </div>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
                  <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 18px;">Budget Summary</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Category:</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #111827;">${category}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Spent:</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #dc2626;">$${spent.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Budget Limit:</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #059669;">$${limit.toFixed(2)}</td>
                    </tr>
                    <tr style="border-top: 2px solid #d1d5db;">
                      <td style="padding: 8px 0; color: #6b7280;">Remaining:</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold; color: ${spent > limit ? '#dc2626' : '#059669'};">
                        $${(limit - spent).toFixed(2)}
                      </td>
                    </tr>
                  </table>
                </div>
                
                ${percentage >= 90 ? `
                  <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px;">
                      <strong>Action Required:</strong> You've reached a critical spending level. Consider reviewing your expenses or adjusting your budget.
                    </p>
                  </div>
                ` : ''}
                
                <p style="color: #6b7280; font-size: 14px; margin: 25px 0 0 0;">
                  Best regards,<br>
                  <strong style="color: #374151;">The FinanceFlow Team</strong>
                </p>
              </div>
              
              <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
                This is an automated message. You can manage your email preferences in your profile settings.
              </p>
            </div>
          </body>
        </html>
        `,
      }),
    });

    const data = await emailResponse.json();

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-budget-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
