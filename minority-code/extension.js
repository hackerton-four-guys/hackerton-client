// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const axios = require("axios").default;
const fs = require("fs");
const path = require("path");
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "minority-code" is now active!');

  /** 기본 커맨드 */
  const disposable = vscode.commands.registerCommand(
    "minority-code.helloWorld",
    function () {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from Minority Code!");
    }
  );

  /** 주석 생성 커맨드 */
  const makeCommentDisposable = vscode.commands.registerCommand(
    "minority-code.makeComment",
    function () {
      let editor = vscode.window.activeTextEditor;
      if (!editor) {
        return; // No open text editor
      }

      const comment =
        "/* TO \n" +
        " * REVIEW: \n" +
        " * \n" +
        " * REQUIRE: \n" +
        " * \n" +
        " * BY @ */";

      let position = editor.selection.active;
      editor
        .edit((edit) => {
          edit.insert(position, comment);
        })
        .then(() => {
          const newPosition = position.with(
            position.line,
            comment.indexOf("TO ") + 3
          );
          const newSelection = new vscode.Selection(newPosition, newPosition);
          editor.selection = newSelection;
        });
    }
  );

  /** 자동완성 Provider */
  const provider = vscode.languages.registerCompletionItemProvider(
    ["c", "cpp", "java", "javascript"],
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

        // 현재 열려있는 파일의 URI를 가져옵니다.
        console.log(vscode.workspace.workspaceFolders[0].uri.fsPath);

        const configPath = path.join(__dirname, "user-config", "user.json");
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
              Authorization: "Bearer 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",
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

  context.subscriptions.push(disposable, makeCommentDisposable, provider);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
