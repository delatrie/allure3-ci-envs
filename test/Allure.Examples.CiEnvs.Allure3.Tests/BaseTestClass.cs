using System;
using Allure.Net.Commons;
using Allure.NUnit;
using NUnit.Framework;

namespace Allure.Examples.CiEnvs.Allure3.Tests;

[AllureNUnit]
abstract class BaseTestClass
{
    [TearDown]
    public void AddEnvLabel()
    {
        var value = Environment.GetEnvironmentVariable($"ALLURE_ENVIRONMENT");
        if (!string.IsNullOrEmpty(value))
        {
            AllureApi.AddLabel("env", value);
        }
    }
}
