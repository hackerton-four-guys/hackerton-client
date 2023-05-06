const vscode = require("vscode");
const axios = require("axios").default;
const fs = require("fs");
const path = require("path");

const MakeCommentDisposable = require("./modules/MakeComment");
// const AutoCompleteProvider = require("./modules/AutoCompleteProvider");
const myModule = require("./modules/AutoCompleteProvider");

/** 기본 커맨드 */
const disposable = vscode.commands.registerCommand(
  "minority-code.helloWorld",
  function () {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    vscode.window.showInformationMessage("Hello World from Minority Code!");
  }
);

const initExtension = async (context) => {
  // const configPath = path.join(__dirname);
  // let data = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  let username = await context.globalState.get("username");
  let branches = await context.globalState.get("branches");

  const currentPath = vscode.workspace.workspaceFolders[0].uri.fsPath;

  if (!username) {
    console.log("no user name");
    await vscode.window.showInputBox().then(async (input) => {
      vscode.window.showInformationMessage("your github id is" + input);
      username = input;
      await context.globalState.update("username", username);
    });
  }
  if (!branches) {
    console.log("no branches info");
    vscode.window.showInputBox().then(async (input) => {
      vscode.window.showInformationMessage("your organization is" + input);
      const newBranch = [];
      newBranch.push({
        organization: input,
        directory: currentPath,
      });

      await context.globalState.update("branches", newBranch);
    });
  } else {
    let isExist = false;
    for (const elem of branches) {
      if (elem.directory === currentPath) {
        isExist = !isExist;
        break;
      }
    }

    if (!isExist) {
      vscode.window.showInputBox().then(async (input) => {
        vscode.window.showInformationMessage("your organization is" + input);
        const branch = {
          organization: input,
          directory: currentPath,
        };
        const newBranches = [...branches, branch];
        await context.globalState.update("branches", newBranches);
        const result = await context.globalState.get("branches");
        console.log(result);
      });
    }
    console.log(branches);
  }
};

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "minority-code" is now active!');

  initExtension(context);

  const AutoCompleteProvider = myModule(context);

  context.subscriptions.push(
    disposable,
    MakeCommentDisposable,
    AutoCompleteProvider
  );
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
