module.exports = {
    silent: true,
    setupFilesAfterEnv: ["/Users/miafelipe/Desktop/coding/RIVAL/src/setupTest.js"],
    testEnvironment: "jsdom", // Change to "jsdom" if you previously set it to "node" for other solutions
    transform: {
      "^.+\\.[t|j]sx?$": "babel-jest",
    },
    moduleNameMapper: {
      "\\.(css|less|scss|sass)$": "identity-obj-proxy",
      '^src/(.*)$': '<rootDir>/src/$1',
    },
    moduleDirectories: ["node_modules", "src"],
    roots: ['<rootDir>/src/__tests__'],
    reporters: [ "default",
      ["jest-silent-reporter", { "showWarnings": true }]
  ]
  };