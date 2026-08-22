using ERP.Application.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace ERP.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    private async Task SendAsync(string to, string subject, string htmlBody)
    {
        var username = _config["EmailSettings:Username"];
        if (string.IsNullOrWhiteSpace(username))
        {
            _logger.LogWarning("SMTP not configured. Skipped email '{Subject}' to {To}", subject, to);
            return;
        }

        try
        {
            var email = new MimeMessage();
            email.From.Add(new MailboxAddress(_config["EmailSettings:FromName"] ?? "Enterprise ERP", username));
            email.To.Add(MailboxAddress.Parse(to));
            email.Subject = subject;
            email.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(_config["EmailSettings:Host"], int.Parse(_config["EmailSettings:Port"] ?? "587"), SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(username, _config["EmailSettings:Password"]);
            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email '{Subject}' to {To}. Continuing without email.", subject, to);
        }
    }

    public async Task SendEmailAsync(string to, string subject, string htmlBody)
        => await SendAsync(to, subject, htmlBody);

    public async Task SendEmailWithAttachmentAsync(string to, string subject, string htmlBody, string fileName, byte[] fileBytes, string contentType = "application/pdf")
    {
        var username = _config["EmailSettings:Username"];
        if (string.IsNullOrWhiteSpace(username))
        {
            _logger.LogWarning("SMTP not configured. Skipped email '{Subject}' to {To}", subject, to);
            return;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_config["EmailSettings:FromName"] ?? "Enterprise ERP", username));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;

            var builder = new BodyBuilder { HtmlBody = htmlBody };
            var parts = contentType.Split('/');
            builder.Attachments.Add(fileName, fileBytes, new ContentType(parts[0], parts.Length > 1 ? parts[1] : "octet-stream"));
            message.Body = builder.ToMessageBody();

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(_config["EmailSettings:Host"], int.Parse(_config["EmailSettings:Port"] ?? "587"), SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(username, _config["EmailSettings:Password"]);
            await smtp.SendAsync(message);
            await smtp.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email '{Subject}' to {To}. Continuing without email.", subject, to);
        }
    }

    public async Task SendPasswordResetEmailAsync(string to, string resetLink)
    {
        var html = $"""
            <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:16px">
              <h2 style="color:#6366f1;margin-bottom:16px">🔑 Password Reset</h2>
              <p>Click the button below to reset your password. This link expires in 1 hour.</p>
              <a href="{resetLink}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;margin:24px 0;font-weight:600">Reset Password</a>
              <p style="color:#94a3b8;font-size:13px">If you didn't request a password reset, ignore this email.</p>
            </div>
            """;
        await SendAsync(to, "Enterprise ERP — Password Reset", html);
    }

    public async Task SendPayslipEmailAsync(string to, string employeeName, byte[] payslipPdf)
    {
        var username = _config["EmailSettings:Username"];
        if (string.IsNullOrWhiteSpace(username))
        {
            _logger.LogWarning("SMTP not configured. Skipped payslip email to {To}", to);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_config["EmailSettings:FromName"] ?? "Enterprise ERP", username));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = "Your Payslip";

        var builder = new BodyBuilder
        {
            HtmlBody = $"<p>Dear {employeeName},</p><p>Please find your payslip attached.</p>"
        };
        builder.Attachments.Add("payslip.pdf", payslipPdf, new ContentType("application", "pdf"));
        message.Body = builder.ToMessageBody();

        try
        {
            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(_config["EmailSettings:Host"], int.Parse(_config["EmailSettings:Port"] ?? "587"), SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(username, _config["EmailSettings:Password"]);
            await smtp.SendAsync(message);
            await smtp.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send payslip email to {To}. Continuing without email.", to);
        }
    }

    public async Task SendLeaveApprovalEmailAsync(string to, string employeeName, bool isApproved)
    {
        var status = isApproved ? "Approved ✅" : "Rejected ❌";
        var html = $"<p>Dear {employeeName},</p><p>Your leave request has been <strong>{status}</strong>.</p>";
        await SendAsync(to, $"Leave Request {status}", html);
    }
}
