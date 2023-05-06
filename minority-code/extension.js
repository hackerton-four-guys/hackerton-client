const vscode = require("vscode");
const axios = require("axios").default;
const fs = require("fs");
const path = require("path");

const MakeCommentDisposable = require("./modules/MakeComment");
const AutoCompleteProvider = require("./modules/AutoCompleteProvider");

/** 기본 커맨드 */
const disposable = vscode.commands.registerCommand(
  "minority-code.helloWorld",
  function () {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    vscode.window.showInformationMessage("Hello World from Minority Code!");
  }
);

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "minority-code" is now active!');

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
