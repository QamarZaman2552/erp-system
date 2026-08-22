using ERP.Application.Common;
using ERP.Domain.Enums;

namespace ERP.Application.Interfaces;

public interface INotificationService
{
    Task CreateAsync(string userId, string title, string message, NotificationType type = NotificationType.Info, string? actionUrl = null);
    Task CreateForRolesAsync(IEnumerable<string> roles, string title, string message, NotificationType type = NotificationType.Info, string? actionUrl = null, string? excludeUserId = null);
    Task CreateForAllAsync(string title, string message, NotificationType type = NotificationType.System, string? actionUrl = null);
    Task<List<ERP.Application.DTOs.Business.NotificationDto>> GetMyAsync(string userId, bool unreadOnly, int limit);
    Task<int> GetUnreadCountAsync(string userId);
    Task<ApiResponse<string>> MarkReadAsync(Guid id, string userId);
    Task MarkAllReadAsync(string userId);
    Task ClearAllAsync(string userId);
}
