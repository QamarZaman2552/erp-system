using System.Text;
using ERP.API.Filters;
using ERP.Application.Validators;
using ERP.Infrastructure.Data.Seeders;
using FluentValidation;
using ERP.Infrastructure.Extensions;
using ERP.Infrastructure.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// â”€â”€â”€ Services â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidationActionFilter>();
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
})
.ConfigureApiBehaviorOptions(options =>
{
    // Our ValidationActionFilter produces the unified 400 format
    options.SuppressModelStateInvalidFilter = true;
});
builder.Services.AddEndpointsApiExplorer();

// Infrastructure (DbContext, Identity, services)
builder.Services.AddInfrastructure(builder.Configuration);

// FluentValidation validators
builder.Services.AddValidatorsFromAssemblyContaining<LoginDtoValidator>();

// JWT Authentication
var jwtKey = builder.Configuration["JwtSettings:SecretKey"]!;
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidAudience = builder.Configuration["JwtSettings:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
    // Support SignalR JWT
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = ctx =>
        {
            var token = ctx.Request.Query["access_token"];
            if (!string.IsNullOrEmpty(token) && ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                ctx.Token = token;
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", p => p.RequireRole("Admin"));
    options.AddPolicy("HROrAdmin", p => p.RequireRole("Admin", "HR"));
    options.AddPolicy("ManagerOrAbove", p => p.RequireRole("Admin", "HR", "Manager"));
    options.AddPolicy("AllRoles", p => p.RequireRole("Admin", "HR", "Manager", "Employee"));
});

// SignalR
builder.Services.AddSignalR();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy
            .WithOrigins("http://localhost:4200", "https://localhost:4200", "http://localhost:5173", "https://localhost:5173")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()
    );
});

// Swagger with JWT support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Enterprise ERP API",
        Version = "v1",
        Description = "Complete Enterprise ERP & Business Management System API",
        Contact = new OpenApiContact { Name = "ERP Team", Email = "admin@company.com" }
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header. Example: 'Bearer {token}'"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// â”€â”€â”€ Middleware Pipeline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Enterprise ERP API v1");
        c.RoutePrefix = "swagger";
        c.DisplayRequestDuration();
        c.EnableFilter();
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

// Global unhandled exception handler (catches silent crashes)
AppDomain.CurrentDomain.UnhandledException += (sender, e) =>
{
    var ex = e.ExceptionObject as Exception;
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine("=== FATAL UNHANDLED EXCEPTION ===");
    Console.WriteLine(ex?.ToString() ?? e.ExceptionObject?.ToString());
    Console.ResetColor();
    File.AppendAllText("fatal_error.log", $"{DateTime.Now}: {ex}\n");
};

// Seed database
await DataSeeder.SeedAsync(app.Services);

try
{
    Console.ForegroundColor = ConsoleColor.Green;
    Console.WriteLine("=== Backend running. Press Ctrl+C to stop. ===");
    Console.ResetColor();
    app.Run();
}
catch (Exception ex)
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine($"=== app.Run() CRASHED: {ex.Message}");
    Console.WriteLine(ex.ToString());
    Console.ResetColor();
    File.AppendAllText("fatal_error.log", $"{DateTime.Now}: {ex}\n");
    throw;
}

public partial class Program { }
