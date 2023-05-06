const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const axios = require("axios").default;

const envPath = path.join(__dirname, "../", ".env");
const dotenv = require("dotenv").config({ path: envPath });
const KEY = process.env.GITHUB_API_KEY;

module.exports = function (parentContext) {
  const AutoCompleteProvider = vscode.languages.registerCompletionItemProvider(
    ["c", "cpp", "java", "javascript", "kotlin"],
    {
      async provideCompletionItems(document, position, token, context) {
        const linePrefix = document
          .lineAt(position)
          .text.substring(0, position.character);
        if (
          !linePrefix.endsWith(" * BY @") &&
          !linePrefix.endsWith("/* TO @")
        ) {
          return undefined;
        }

        const organizationName = await parentContext.workspaceState.get(
          "organization"
        );
        console.log(organizationName);

        const response = await axios.get(
          `https://api.github.com/orgs/${organizationName}/members`,
          {
            headers: {
              Accept: "application/vnd.github+json",
              Authorization: KEY,
            },
          }
        );

        const completionItems = response.data.map((elem) => {
          return new vscode.CompletionItem(
            elem.login,
            vscode.CompletionItemKind.User
          );
        });

        return completionItems;
      },
    },
    "@"
  );
  return AutoCompleteProvider;
};
