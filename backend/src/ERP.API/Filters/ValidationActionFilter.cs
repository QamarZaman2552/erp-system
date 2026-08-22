using ERP.Application.Common;
using System.Reflection;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ERP.API.Filters;

public class ValidationActionFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var failures = new Dictionary<string, List<string>>();

        // Merge model-binding errors (malformed JSON, wrong types) into the same shape
        foreach (var (key, state) in context.ModelState)
        {
            var messages = state.Errors
                .Select(e => string.IsNullOrEmpty(e.ErrorMessage) ? "Invalid value." : e.ErrorMessage)
                .ToList();
            if (messages.Count > 0)
                failures[key] = messages;
        }

        foreach (var argument in context.ActionArguments.Values)
        {
            // Skip nulls, strings, and value types (route/query primitives like Guid, int)
            if (argument is null || argument.GetType().IsValueType || argument is string)
                continue;

            var errors = await ValidateAsync(argument, context.HttpContext.RequestServices, context.HttpContext.RequestAborted);
            foreach (var (property, messages) in errors)
            {
                if (!failures.TryGetValue(property, out var list))
                    failures[property] = list = [];
                list.AddRange(messages);
            }
        }

        if (failures.Count > 0)
        {
            context.Result = new BadRequestObjectResult(new
            {
                success = false,
                message = "Validation failed",
                errors = failures.ToDictionary(
                    kvp => System.Text.Json.JsonNamingPolicy.CamelCase.ConvertName(kvp.Key),
                    kvp => kvp.Value.ToArray())
            });
            return;
        }

        await next();
    }

    private static async Task<Dictionary<string, string[]>> ValidateAsync(object argument, IServiceProvider services, CancellationToken ct)
    {
        var method = typeof(ValidationActionFilter)
            .GetMethod(nameof(ValidateTyped), BindingFlags.NonPublic | BindingFlags.Static)!
            .MakeGenericMethod(argument.GetType());

        return await (Task<Dictionary<string, string[]>>)method.Invoke(null, [argument, services, ct])!;
    }

    private static async Task<Dictionary<string, string[]>> ValidateTyped<T>(T argument, IServiceProvider services, CancellationToken ct) where T : class
    {
        var validator = services.GetService<IValidator<T>>();
        if (validator is null) return [];

        var result = await validator.ValidateAsync(argument, ct);
        if (result.IsValid) return [];

        return result.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
    }
}
