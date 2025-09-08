const hasEnv = (labels, expectedEnv) =>
  labels.some(({ name, value }) => name === "env" && value === expectedEnv);

export default {
  plugins: {
    awesome: {
      options: {
        groupBy: ["package", "testClass"],
      },
    },
  },
  environments: {
    "Linux, net8.0, Debug": {
      matcher: ({ labels }) => hasEnv(labels, "Linux, net8.0, Debug"),
    },
    "Linux, net8.0, Release": {
      matcher: ({ labels }) => hasEnv(labels, "Linux, net8.0, Release"),
    },
    "Linux, net9.0, Debug": {
      matcher: ({ labels }) => hasEnv(labels, "Linux, net9.0, Debug"),
    },
    "Linux, net9.0, Release": {
      matcher: ({ labels }) => hasEnv(labels, "Linux, net9.0, Release"),
    },
    "MacOS, net8.0, Debug": {
      matcher: ({ labels }) => hasEnv(labels, "MacOS, net8.0, Debug"),
    },
    "MacOS, net8.0, Release": {
      matcher: ({ labels }) => hasEnv(labels, "MacOS, net8.0, Release"),
    },
    "MacOS, net9.0, Debug": {
      matcher: ({ labels }) => hasEnv(labels, "MacOS, net9.0, Debug"),
    },
    "MacOS, net9.0, Release": {
      matcher: ({ labels }) => hasEnv(labels, "MacOS, net9.0, Release"),
    },
    "Windows, net8.0, Debug": {
      matcher: ({ labels }) => hasEnv(labels, "Windows, net8.0, Debug"),
    },
    "Windows, net8.0, Release": {
      matcher: ({ labels }) => hasEnv(labels, "Windows, net8.0, Release"),
    },
    "Windows, net9.0, Debug": {
      matcher: ({ labels }) => hasEnv(labels, "Windows, net9.0, Debug"),
    },
    "Windows, net9.0, Release": {
      matcher: ({ labels }) => hasEnv(labels, "Windows, net9.0, Release"),
    },
  },
};