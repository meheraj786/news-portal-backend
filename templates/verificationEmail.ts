export const verificationEmailTemplate = (otp: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>NewsPortal - Email Verification</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
        @media screen and (max-width: 600px) {
            .email-container { width: 100% !important; max-width: 100% !important; padding: 0 10px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: 'Poppins', sans-serif;">
    <center style="width: 100%; background-color: #f7f7f7;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;" class="email-container">
            <tr>
                <td bgcolor="#ffffff" style="padding: 40px 30px; border-radius: 12px; text-align: center;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td style="color: #333333; font-family: 'Poppins', sans-serif; font-size: 24px; font-weight: 700; line-height: 1.2;">
                                Your Verification Code
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 15px 0;"></td>
                        </tr>
                        <tr>
                            <td style="color: #777777; font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 400; line-height: 1.5;">
                                Please use the code below to complete your verification. This code is only valid for the next 5 minutes.
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 0;"></td>
                        </tr>
                        <tr>
                            <td align="center">
                                <div style="background-color: #2a2a2a; border-radius: 8px; padding: 15px 25px; display: inline-block; border: 1px solid #333333;">
                                    <h2 style="margin: 0; color: #ffffff; font-family: 'Poppins', sans-serif; font-size: 42px; font-weight: 600; letter-spacing: 10px; line-height: 1;">
                                        ${otp}
                                    </h2>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 0;"></td>
                        </tr>
                        <tr>
                            <td style="color: #c79500ff; font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 500; line-height: 1.5;">
                                This code will expire in 5 minutes.
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-top: 25px; color: #777777; font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 400; line-height: 1.5;">
                                If you did not request this verification code, please ignore this email.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td style="padding: 40px 10px; width: 100%; font-size: 12px; font-family: 'Poppins', sans-serif; line-height: 1.5; text-align: center; color: #666666;">
                    <p style="margin: 0 0 5px 0;">&copy; ${new Date().getFullYear()} NewsPortal. All Rights Reserved.</p>
                    <p style="margin: 0;">123 Innovation Drive, Tech City, 12345</p>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>

  `;
