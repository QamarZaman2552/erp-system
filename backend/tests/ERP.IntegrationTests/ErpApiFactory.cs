using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ERP.IntegrationTests;

public class FakeEmailService : IEmailService
{
    public List<(string To, string Subject)> Sent { get; } = [];
    public Task SendEmailAsync(string to, string subject, string htmlBody)
    {
        Sent.Add((to, subject));
        return Task.CompletedTask;
    }
    public Task SendEmailWithAttachmentAsync(string to, string subject, string htmlBody, string fileName, byte[] fileBytes, string contentType = "application/pdf")
    {
        Sent.Add((to, subject));
        return Task.CompletedTask;
    }
    public Task SendPasswordResetEmailAsync(string to, string resetLink)
    {
        Sent.Add((to, "password-reset"));
        return Task.CompletedTask;
    }
    public Task SendPayslipEmailAsync(string to, string employeeName, byte[] payslipPdf) => Task.CompletedTask;
    public Task SendLeaveApprovalEmailAsync(string to, string employeeName, bool isApproved)
    {
        Sent.Add((to, isApproved ? "leave-approved" : "leave-rejected"));
        return Task.CompletedTask;
    }
}

public class ErpApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public const string TestJwtKey = "integration-tests-signing-key-with-at-least-32-characters!!";
    public const string DefaultAdminPassword = "Admin@1234";
    public const string HrPassword = "Hr@12345";

    // One shared store for EVERY service provider / host / scope in this process
    private static readonly InMemoryDatabaseRoot SharedRoot = new();

    public string SeedReport { get; private set; } = "not-run";

    // Deterministic seeding: runs once after the test server is built,
    // guaranteed against the SAME (InMemory) database the tests will use.
    public async Task InitializeAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();

        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        foreach (var role in new[] { "Admin", "HR", "Manager", "Employee" })
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        const string adminEmail = "admin@company.com";
        if (await userManager.FindByEmailAsync(adminEmail) == null)
        {
            var admin = new ApplicationUser
            {
                UserName = adminEmail, Email = adminEmail, EmailConfirmed = true,
                FirstName = "System", LastName = "Admin", IsActive = true
            };
            var result = await userManager.CreateAsync(admin, DefaultAdminPassword);
            if (!result.Succeeded)
                throw new InvalidOperationException(
                    "Seeding admin failed: " + string.Join("; ", result.Errors.Select(e => e.Description)));
            await userManager.AddToRoleAsync(admin, "Admin");
        }

        const string hrEmail = "hr@company.com";
        if (await userManager.FindByEmailAsync(hrEmail) == null)
        {
            var hr = new ApplicationUser
            {
                UserName = hrEmail, Email = hrEmail, EmailConfirmed = true,
                FirstName = "HR", LastName = "Manager", IsActive = true
            };
            var hrResult = await userManager.CreateAsync(hr, HrPassword);
            if (!hrResult.Succeeded)
                throw new InvalidOperationException(
                    "Seeding HR failed: " + string.Join("; ", hrResult.Errors.Select(e => e.Description)));
            await userManager.AddToRoleAsync(hr, "HR");
        }

        if (!db.Departments.Any())
        {
            var engineering = new Department { Name = "Engineering", Description = "Software development team" };
            var sales = new Department { Name = "Sales & Marketing", Description = "Sales division" };
            db.Departments.AddRange(engineering, sales);
            await db.SaveChangesAsync();

            db.Designations.AddRange(
                new Designation { Title = "Software Engineer", DepartmentId = engineering.Id, MinSalary = 60000, MaxSalary = 120000 },
                new Designation { Title = "Tech Lead", DepartmentId = engineering.Id, MinSalary = 120000, MaxSalary = 200000 });
            await db.SaveChangesAsync();
        }

        SeedReport = $"provider={db.Database.ProviderName} users={userManager.Users.Count()} " +
                     $"roles={db.Roles.Count()} depts={db.Departments.Count()}";
    }

    public new Task DisposeAsync() => Task.CompletedTask;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        // UseSetting flows into WebApplicationBuilder.Configuration reliably
        // (ConfigureAppConfiguration runs too late for minimal hosting apps)
        builder.UseSetting("JwtSettings:SecretKey", TestJwtKey);
        builder.UseSetting("JwtSettings:Issuer", "EnterpriseERP-Tests");
        builder.UseSetting("JwtSettings:Audience", "EnterpriseERP-Tests");

        builder.ConfigureTestServices(services =>
        {
            // Replace SQL Server with EF InMemory database
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll(typeof(IDbContextOptionsConfiguration<AppDbContext>));
            // Fixed store name + shared root: all context instances hit ONE store
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase("erp-integration-tests", SharedRoot));

            // Never hit a real SMTP server during tests
            var emailDescriptor = services.Single(d => d.ServiceType == typeof(IEmailService));
            services.Remove(emailDescriptor);
            services.AddSingleton<FakeEmailService>();
            services.AddSingleton<IEmailService>(sp => sp.GetRequiredService<FakeEmailService>());
        });
    }

    public async Task<ApplicationUser> CreateUserAsync(string email, string password, string role)
    {
        using var scope = Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await userManager.FindByEmailAsync(email);
        if (user != null) return user;

        user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            FirstName = "Test",
            LastName = role,
            IsActive = true
        };
        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(e => e.Description)));
        await userManager.AddToRoleAsync(user, role);
        return user;
    }
}

public static class ErpApiFactoryExtensions
{
    public static async Task<HttpResponseMessage> LoginAsync(
        this HttpClient client, string email, string password)
    {
        return await client.PostAsJsonAsync("/api/auth/login", new { email, password });
    }

    public static async Task<HttpClient> LoginAndAuthorizeAsync(
        this ErpApiFactory factory, string email, string password)
    {
        var client = factory.CreateClient();
        var response = await client.LoginAsync(email, password);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var token = json.GetProperty("data").GetProperty("accessToken").GetString()
                    ?? throw new InvalidOperationException("No access token returned");
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        return client;
    }
}
