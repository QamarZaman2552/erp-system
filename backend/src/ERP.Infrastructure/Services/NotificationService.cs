using ERP.Application.Common;
using ERP.Application.DTOs.Business;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Enums;
using ERP.Infrastructure.Data;
using ERP.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ERP.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    private readonly IHubContext<NotificationHub> _hub;

    public NotificationService(AppDbContext db, IHubContext<NotificationHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    public async Task CreateAsync(string userId, string title, string message, NotificationType type = NotificationType.Info, string? actionUrl = null)
    {
        if (string.IsNullOrEmpty(userId)) return;

        _db.Notifications.Add(new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            ActionUrl = actionUrl
        });
        await _db.SaveChangesAsync();

        await _hub.Clients.User(userId).SendAsync("ReceiveNotification", title, message);
    }

    public async Task CreateForRolesAsync(IEnumerable<string> roles, string title, string message, NotificationType type = NotificationType.Info, string? actionUrl = null, string? excludeUserId = null)
    {
        var roleIds = await _db.Roles.Where(r => roles.Contains(r.Name!)).Select(r => r.Id).ToListAsync();
        var userIds = await _db.UserRoles
            .Where(ur => roleIds.Contains(ur.RoleId))
            .Select(ur => ur.UserId)
            .Distinct()
            .ToListAsync();

        var activeIds = await _db.Users
            .Where(u => userIds.Contains(u.Id) && u.IsActive && u.Id != excludeUserId)
            .Select(u => u.Id)
            .ToListAsync();

        foreach (var uid in activeIds)
            await CreateAsync(uid, title, message, type, actionUrl);
    }

    public async Task CreateForAllAsync(string title, string message, NotificationType type = NotificationType.System, string? actionUrl = null)
    {
        var userIds = await _db.Users.Where(u => u.IsActive).Select(u => u.Id).ToListAsync();

        _db.Notifications.AddRange(userIds.Select(uid => new Notification
        {
            UserId = uid,
            Title = title,
            Message = message,
            Type = type,
            ActionUrl = actionUrl
        }));
        await _db.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("ReceiveBroadcast", title, message);
    }

    public async Task<List<NotificationDto>> GetMyAsync(string userId, bool unreadOnly, int limit)
    {
        var query = _db.Notifications.AsNoTracking().Where(n => n.UserId == userId);
        if (unreadOnly) query = query.Where(n => !n.IsRead);

        return await query.OrderByDescending(n => n.CreatedAt)
            .Take(limit > 0 ? limit : 50)
            .Select(n => new NotificationDto(n.Id, n.Title, n.Message, n.Type.ToString(), n.IsRead, n.ActionUrl, n.CreatedAt))
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(string userId)
    {
        return await _db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task<ApiResponse<string>> MarkReadAsync(Guid id, string userId)
    {
        var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
        if (n == null) return ApiResponse<string>.Fail("Notification not found");

        n.IsRead = true;
        n.ReadAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ApiResponse<string>.Ok("Marked as read");
    }

    public async Task MarkAllReadAsync(string userId)
    {
        var unread = await _db.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
        foreach (var n in unread)
        {
            n.IsRead = true;
            n.ReadAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
    }

    public async Task ClearAllAsync(string userId)
    {
        var mine = await _db.Notifications.Where(n => n.UserId == userId).ToListAsync();
        foreach (var n in mine) n.IsDeleted = true;
        await _db.SaveChangesAsync();
    }
}
