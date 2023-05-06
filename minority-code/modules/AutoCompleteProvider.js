const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const axios = require("axios").default;

const envPath = path.join(__dirname, "../", ".env");
const dotenv = require("dotenv").config({ path: envPath });
const KEY = process.env.GITHUB_API_KEY;

/** 자동완성 Provider */
const AutoCompleteProvider = vscode.languages.registerCompletionItemProvider(
  ["c", "cpp", "java", "javascript"],
  {
    async provideCompletionItems(document, position, token, context) {
      const linePrefix = document
        .lineAt(position)
        .text.substring(0, position.character);
      if (!linePrefix.endsWith(" * BY @") && !linePrefix.endsWith("/* TO @")) {
        return undefined;
      }

      // 현재 열려있는 파일의 URI를 가져옵니다.
      console.log(vscode.workspace.workspaceFolders[0].uri.fsPath);

      const configPath = path.join(__dirname, "../user-config", "user.json");
      const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const username = data.username;

      if (username) {
        console.log("Username is here!");
      } else console.log("Username is not here!");

      const response = await axios.get(
        "https://api.github.com/orgs/Cooperative-Projects/members",
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

module.exports = AutoCompleteProvider;
