const brevo = require('@getbrevo/brevo');
const apiInstance = new brevo.TransactionalEmailsApi();


  export async function sendCustomReply(
    recipientEmail: string,
    recipientName: string,
    subject: string,
    message: string
  ): Promise<void> {
    const apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    let sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); min-height: 100vh;">
        <div style="max-width: 850px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);">
            
            <!-- Header with Amoria Branding -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
                <!-- Decorative elements -->
                <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255, 255, 255, 0.05); border-radius: 50%;"></div>
                <div style="position: absolute; bottom: -30px; left: -30px; width: 60px; height: 60px; background: rgba(255, 255, 255, 0.05); border-radius: 50%;"></div>
                
                <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 12px; padding: 25px; display: inline-block; position: relative; z-index: 1;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Amoria</h1>
                    <div style="width: 40px; height: 2px; background: rgba(255, 255, 255, 0.7); margin: 10px auto; border-radius: 1px;"></div>
                    <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Professional Services</p>
                </div>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 45px 35px;">
                <!-- Personal Greeting -->
                <div style="margin-bottom: 35px;">
                    <h2 style="color: #2d3748; font-size: 24px; font-weight: 600; margin: 0 0 8px 0;">Hello ${recipientName},</h2>
                    <div style="width: 50px; height: 3px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 2px;"></div>
                </div>
                
                <!-- Custom Message Content -->
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border-radius: 12px; padding: 35px; margin-bottom: 35px; border: 1px solid #e2e8f0; position: relative; overflow: hidden;">
                    <!-- Subtle decorative element -->
                    <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
                    
                    <div style="color: #2d3748; font-size: 16px; line-height: 1.7; position: relative; z-index: 1;">
                        ${message.split('\n').map(paragraph => 
                          paragraph.trim() ? `<p style="margin: 0 0 16px 0; color: #2d3748;">${paragraph.trim()}</p>` : ''
                        ).join('').replace(/,<\/p>$/, '</p>')}
                    </div>
                </div>
                
                <!-- Call-to-Action or Contact Section -->
                <div style="background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; margin-bottom: 30px; text-align: center;">
                    <div style="margin-bottom: 20px;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; padding: 12px; margin-bottom: 15px;">
                            <div style="width: 24px; height: 24px; background: rgba(255, 255, 255, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
                            </div>
                        </div>
                    </div>
                    <h3 style="color: #2d3748; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">Have Questions?</h3>
                    <p style="color: #4a5568; font-size: 14px; margin: 0 0 20px 0; line-height: 1.6;">
                        We're here to help! Feel free to reach out if you need any clarification or have additional questions.
                    </p>
                    <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 12px 24px;">
                        <a href="mailto:support@amoria.com" style="color: #ffffff; text-decoration: none; font-weight: 500; font-size: 14px;">Contact Support</a>
                    </div>
                </div>
                
                <!-- Professional Signature -->
                <div style="border-top: 1px solid #e2e8f0; padding-top: 30px; text-align: left;">
                    <p style="color: #4a5568; font-size: 16px; margin: 0 0 5px 0; font-weight: 500;">Best regards,</p>
                    <p style="color: #2d3748; font-size: 18px; margin: 0 0 8px 0; font-weight: 600;">The Amoria Team</p>
                    <div style="display: flex; align-items: center; margin-top: 15px;">
                        <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                            <div style="width: 16px; height: 16px; background: rgba(255, 255, 255, 0.3); border-radius: 50%;"></div>
                        </div>
                        <div>
                            <p style="color: #4a5568; font-size: 12px; margin: 0; line-height: 1.2;">Professional Services & Solutions</p>
                            <p style="color: #667eea; font-size: 12px; margin: 0; font-weight: 500;">support@amoriaglobal.com</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                <div style="margin-bottom: 15px;">
                    <div style="display: inline-flex; align-items: center; background: #ffffff; border-radius: 25px; padding: 8px 16px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);">
                        <div style="width: 8px; height: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; margin-right: 8px;"></div>
                        <span style="color: #4a5568; font-size: 12px; font-weight: 500;">Amoria Global Tech</span>
                    </div>
                </div>
                
                <p style="color: #718096; font-size: 13px; margin: 0 0 8px 0; line-height: 1.4;">
                    This email was sent from Amoria. If you have any questions or concerns, 
                    please don't hesitate to contact our support team.
                </p>
                
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #cbd5e0;">
                    <p style="color: #a0aec0; font-size: 11px; margin: 0;">
                        © ${new Date().getFullYear()} Amoria. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>`;
    
    sendSmtpEmail.sender = { "name": "Amoria Team", "email": "support@amoriaglobal.com"};
    sendSmtpEmail.to = [
      { "email": recipientEmail, "name": recipientName }
    ];
    sendSmtpEmail.headers = { 
      "X-Amoria-Type": "custom-reply",
      "X-Amoria-Recipient": recipientName 
    };
    sendSmtpEmail.params = { 
      "recipient_name": recipientName,
      "custom_subject": subject,
      "response_type": "custom_reply"
    };
    
    try {
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('Custom reply email sent successfully to:', recipientEmail);
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to send custom reply email:', error);
      return Promise.reject(error);
    }
  }