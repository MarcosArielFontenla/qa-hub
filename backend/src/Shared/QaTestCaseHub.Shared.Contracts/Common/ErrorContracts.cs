namespace QaTestCaseHub.Shared.Contracts.Common;

public sealed record ErrorEnvelope(ErrorBody Error);

public sealed record ErrorBody(string Code, string Message, object? Details = null);

public sealed record ValidationFailure(string Field, string Message);
