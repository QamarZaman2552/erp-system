using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ERP.Infrastructure.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public async Task SendNotification(string userId, string title, string message)
    {
        await Clients.User(userId).SendAsync("ReceiveNotification", title, message);
    }

    public async Task BroadcastNotification(string title, string message)
    {
        await Clients.All.SendAsync("ReceiveBroadcast", title, message);
    }

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }
}
