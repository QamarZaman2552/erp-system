using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace ERP.IntegrationTests;

[CollectionDefinition("api")]
public class ErpApiFactoryCollection : ICollectionFixture<ErpApiFactory>;

[Collection("api")]
public class AuthFlowTests(ErpApiFactory factory)
{
    [Fact]
    public async Task ProtectedEndpoint_WithoutToken_Returns401()
    {
        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/employees");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithSeededAdmin_ReturnsTokenAndRole()
    {
        var client = factory.CreateClient();
        var response = await client.LoginAsync("admin@company.com", ErpApiFactory.DefaultAdminPassword);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.GetProperty("success").GetBoolean());

        var data = json.GetProperty("data");
        Assert.False(string.IsNullOrEmpty(data.GetProperty("accessToken").GetString()));
        Assert.Equal("admin@company.com", data.GetProperty("user").GetProperty("email").GetString());
        Assert.Equal("Admin", data.GetProperty("user").GetProperty("role").GetString());
    }

    [Fact]
    public async Task Login_WithWrongPassword_Returns400()
    {
        var client = factory.CreateClient();
        var response = await client.LoginAsync("admin@company.com", "WrongPass!999");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithUnknownEmail_Returns400()
    {
        var client = factory.CreateClient();
        var response = await client.LoginAsync("ghost@nowhere.com", "Whatever!123");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task RefreshToken_RotatesAccessToken()
    {
        var client = factory.CreateClient();
        var login = await client.LoginAsync("hr@company.com", ErpApiFactory.HrPassword);
        var loginBody = await login.Content.ReadAsStringAsync();
        Assert.True(login.IsSuccessStatusCode, $"login failed: {loginBody}");

        var json = JsonDocument.Parse(loginBody).RootElement;
        var refresh = json.GetProperty("data").GetProperty("refreshToken").GetString()!;

        var response = await client.PostAsJsonAsync("/api/auth/refresh-token", new { refreshToken = refresh });
        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.IsSuccessStatusCode, $"refresh failed: {(int)response.StatusCode} {body}");
    }
}
