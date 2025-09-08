# CI environments with Allure 3

This repository demonstrates how to create an Allure 3 report for tests executed across multiple environments. Check out the final report at [https://delatrie.github.io/allure3-ci-envs/](https://delatrie.github.io/allure3-ci-envs/).

> [!NOTE]
> If you need a solution for Allure 2, check out the demo at [https://github.com/delatrie/allure2-ci-envs/](https://github.com/delatrie/allure2-ci-envs/).

## The problem

Suppose we have a CI job with a matrix strategy that runs the same set of tests in its instances:

```yml
jobs:
  build and test:
    strategy:
      matrix:
        os: ['windows-latest', 'ubuntu-latest', 'macos-latest']
    runs-on: ${{ matrix.os }}
    steps:
      # ...

      - name: Run tests
        run: dotnet test --logger trx --results-directory 'TestResults-${{ matrix.os }}'

      # ...
```

If we then gather all test results together and try to build an Allure 3 report, we'll only see one set of test results instead of three.

The rest of the results will be shown as retries, even though these are all independent test results that come from different environments.

## Allure 3 environments

Allure 3 has a feature called "Allure Environments" that directly targets scenarios like that. It allows viewing:

  - test results from all environments
  - test results from a selected environment
  - results of a particular test from other environments

Currently, there are some limitations to the feature:

1. It only works if test results are in [Allure JSON format](https://allurereport.org/docs/how-it-works-test-result-file/). Other formats, such as TRX or JUnit XML, are insufficient.
2. Each test result must have a [label](https://allurereport.org/docs/how-it-works-test-result-file/#labels-array) that uniquely identifies the environment.
3. All the environments must be pre-defined in the configuration file of Allure 3.

We're working on lifting all those limitations for multijob pipelines. Ideally, setting up Allure Environments should be a matter of just adding a line to the workflow definition file. But since we're not here yet, this demo walks you through all the steps required by Allure as of 3.0.0-beta.18.

## Walkthrough

Let's do a quick overview of all the steps taken. Click the title of the section to view the diff of the step.

> [!NOTE]
> Follow [the commit history](https://github.com/delatrie/allure3-ci-envs/commits/main/) to get a better understanding of each step.

### [Step 1 - Install Allure.NUnit](https://github.com/delatrie/allure3-ci-envs/compare/init...step1)

In order to get test results in Allure format, we need to use an integration that suits our test frameworks. The official integration for NUnit is [`Allure.NUnit`](https://www.nuget.org/packages/Allure.NUnit).

`Allure.NUnit` requires applying the `[AllureNUnit]` attribute to all test classes. It doesn't generate test results for classes without it. The easiest way to do this is by introducing a common base test class and applying the attribute to it.

Once this is done, each `dotnet test` will create a bunch of files in the `<build-output>/allure-results` directory.

> [!NOTE]
> The documentation for `Allure.NUnit` is available [here](https://allurereport.org/docs/nunit/).

### [Step 2 - Add the env info to the test results](https://github.com/delatrie/allure3-ci-envs/compare/step1...step2)

In step 2, we use an environment variable to label each test result with the environment, in which the test was run. The easiest way to do that is to define a teardown in the base test class:

```csharp
[AllureNUnit]
class BaseTestClass
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
```

The variable is set by the workflow:

```yml
- run: dotnet test
  env:
    ALLURE_ENVIRONMENT: '${{ matrix.os-title }}, ${{ matrix.framework }}, ${{ matrix.configuration }}'
```

Now, each test result (a `*-result.json` file) will have an `env` label that points to the correct environment. But labels alone are not enough: the environments must be properly configured.

### [Step 3 - Configure Allure 3](https://github.com/delatrie/allure3-ci-envs/compare/step2...step3)

In step 3, we create the `allurerc.mjs` file. It must export an object that contains a configuration for Allure 3.

In the configuration file, we define the `Allure Awesome` plugin that generates test reports in our new format:

```js
export default {
  plugins: {
    awesome: {
      options: {
        groupBy: ["package", "testClass"],
      },
    },
  },
};
```

We group results by the `package` and `testClass` labels that `Allure.NUnit` adds to each test result automatically. That improves the report's structure slightly.

Now, it's time to add a configuration for the environments. Each environment must define a matcher function that takes test results metadata and returns a boolean value indicating if the test result is associated with this environment:

```js
export default {
  // plugins: ...

  environments: {
    "Linux, net8.0, Debug": {
      matcher: ({ labels }) => labels.some(({ name, value }) => name === "env" && value === "Linux, net8.0, Debug"),
    },

    // the rest of the environments ...
  },
};
```

> [!NOTE]
> `allurerc.mjs` is a full-featured JavaScript file, which means you can write helper functions to reduce the boilerplate code. We've defined one such helper: the `hasEnv` function. You may explore it in this [diff](https://github.com/delatrie/allure3-ci-envs/compare/step2...step3#diff-e4f3e9cb004c4b06942237c07f5df14f49112dcc60945e7520deda5be4b22d5a).

### [Step 4 - Publish Allure 3 reports on GitHub Pages](https://github.com/delatrie/allure3-ci-envs/compare/step3...step4)

Now that our test results have all the required data and Allure 3 is configured, it's time to add a workflow job that creates and publishes the report.

Allure 3 is a Node.js application that is distributed via [npmjs.com](https://www.npmjs.com/). The easiest way of running it is to use the `npx` command that is available on all GitHub runners. Therefore, to generate the report, we should merge all test results into a single directory and run `npx allure generate` against it.

The output directory (`allure-report` by default) will then contain the static files of the report. We publish this directory using a combination of `actions/upload-pages-artifact` and `actions/deploy-pages`.

Now, after the workflow is run, the report can be accessed at the GitHub Pages URL associated with the repository.

### [(Bonus) Step 5 - Enable the history](https://github.com/delatrie/allure3-ci-envs/compare/step4...step5)

To enable the historical data, we put the following in the Allure 3 configuration:

```js
export default {
  // plugins: ...
  // environments ...

  historyPath: "./.allure/history.jsonl",
};
```

Now, Allure 3 will read the history from this file and update it with new data. The file has the [JSON Lines](https://jsonlines.org/) format, where each line corresponds to an `npx allure generate` run. The lines are stored chronologically. All we need now is to store the file in the repository.

Allure 3 doesn't limit the history, which means the file may become quite large. A couple of countermeasures for that include:

  - Using Git LFS
  - Using a dedicated branch
  - Limiting the number of entries in the file. E.g.:

    ```bash
    tail -100 ./.allure/history.jsonl > ./.allure/history-copy.jsonl
    mv -f ./.allure/history-copy.jsonl ./.allure/history.jsonl
    ```

In this demo, we store the history file in a dedicated branch using git LFS. You can set it up like this:

```shell
git switch --orphan allure-history
touch history.jsonl
git lfs track --filename history.jsonl
git add .
git commit -m "Init Allure 3 history"
git push -u origin allure-history
```

Now, check this file in to `.allure` before `npx allure generate` and commit it back after.

The final version of the report can be accessed [here](https://delatrie.github.io/allure3-ci-envs/).
