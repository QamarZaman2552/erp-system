using System.Text.Json;
using ERP.Application.Interfaces;
using ERP.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ERP.API.Filters;

/// <summary>
/// Automatically logs every successful mutation (POST/PUT/PATCH/DELETE) to the audit trail.
/// Auth endpoints are excluded (AuthService writes explicit Login/Logout/LoginFailed logs).
/// Fail-safe: logging errors never break the request.
/// </summary>
public class AuditActionFilter : IAsyncActionFilter
{
    private static readonly JsonSerializerOptions JsonOpts = new() { DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull };

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executed = await next();

        try
        {
            var http = context.HttpContext;
            var method = http.Request.Method.ToUpperInvariant();
            if (method != "POST" && method != "PUT" && method != "PATCH" && method != "DELETE") return;

            var path = http.Request.Path.Value ?? "";
            if (path.Contains("/auth/") || path.Contains("/notifications")) return; // noisy / handled elsewhere

            if (executed.Exception != null) return; // failed requests not audited as actions
            if (http.Response.StatusCode >= 400) return;

            var services = http.RequestServices;
            var db = services.GetRequiredService<AppDbContext>();
            var currentUser = services.GetService<ICurrentUserService>();

            var controller = context.RouteData.Values["controller"]?.ToString() ?? "Unknown";
            var action = context.RouteData.Values["action"]?.ToString() ?? "";
            var auditAction = method switch
            {
                "POST" => "Create",
                "DELETE" => "Delete",
                _ => "Update"
            };

            string? newValues = null;
            if (context.ActionArguments.Count > 0)
            {
                try { newValues = JsonSerializer.Serialize(context.ActionArguments, JsonOpts); }
                catch { newValues = "(unserializable payload)"; }
            }

            var ip = http.Connection.RemoteIpAddress?.ToString();
            var ua = http.Request.Headers["User-Agent"].ToString();

            var actingUser = currentUser?.UserName
                ?? currentUser?.UserEmail
                ?? currentUser?.UserId
                ?? "System";

            db.ActivityLogs.Add(new ERP.Domain.Entities.ActivityLog
            {
                UserId = currentUser?.UserId ?? "System",
                UserName = actingUser,
                Action = $"{auditAction} {controller}.{action}",
                EntityType = controller,
                EntityId = context.RouteData.Values["id"]?.ToString(),
                NewValues = newValues != null && newValues.Length > 4000 ? newValues[..4000] : newValues,
                IpAddress = ip,
                UserAgent = ua.Length > 300 ? ua[..300] : ua,
                Timestamp = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }
        catch
        {
            // Never break the API because of audit logging
        }
    }
}
