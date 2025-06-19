module.exports = {
    setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],

    testEnvironment: "jest-environment-jsdom",

    transform: {
        "^.+\\.[jt]sx?$": "babel-jest"
    },

    moduleNameMapper: {
        "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js"
    },

    transformIgnorePatterns: [
        "/node_modules/(?!(@?preact|@fullcalendar)/)" // 👈 aggiunto preact per essere trasformato
    ]
};
