const vscode = require("vscode");
const axios = require("axios").default;
const fs = require("fs");
const path = require("path");

const AutoCompleteProviderModule = require("./modules/AutoCompleteProvider");
const MakeCommentDisposableModule = require("./modules/MakeComment");

/** 처음 폴더를 열었을 때 실행되는 함수 */
const initExtension = async (context) => {
  let username = await context.globalState.get("username");
  let branches = await context.globalState.get("branches");
  let isExist = false;

  // await context.globalState.update("username", undefined);
  // await context.globalState.update("branches", undefined);
  // await context.workspaceState.update("organization", undefined);

  const currentPath = vscode.workspace.workspaceFolders[0].uri.fsPath;

  if (!username) {
    console.log("no user name");
    await vscode.window
      .showInputBox({ placeHolder: "Type Your Github ID" })
      .then(async (input) => {
        vscode.window.showInformationMessage("your github id is " + input);
        username = input;
        await context.globalState.update("username", username);
      });
  }
  if (!branches) {
    console.log("no branches info");
    await vscode.window
      .showInputBox({ placeHolder: "Type Your Organization Name" })
      .then(async (input) => {
        vscode.window.showInformationMessage("your organization is " + input);
        if (input) {
          console.log("input is true");
          const newBranch = [];
          newBranch.push({
            organization: input,
            directory: currentPath,
          });

          await context.workspaceState.update("organization", input);
          await context.globalState.update("branches", newBranch);
          isExist = !isExist;
        }
      });
  } else {
    for (const elem of branches) {
      if (elem.directory === currentPath) {
        isExist = !isExist;
        const organizationName = await context.workspaceState.get(
          "organization"
        );
        if (!organizationName) {
          await context.workspaceState.update(
            "organization",
            elem.organization
          );
        }
        break;
      }
    }
  }
  console.log(isExist);

  if (!isExist) {
    await vscode.window
      .showInputBox({ placeHolder: "Type Your Organization Name" })
      .then(async (input) => {
        vscode.window.showInformationMessage("your organization is " + input);
        if (input) {
          const branch = {
            organization: input,
            directory: currentPath,
          };
          const newBranches = [...branches, branch];

          await context.workspaceState.update("organization", input);
          await context.globalState.update("branches", newBranches);
        }
      });
  }
};

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Congratulations, your extension "minority-code" is now active!');

  initExtension(context);

  // 아래의 두 개 객체는 주석 생성 모듈과 깃허브 연동 자동완성 기능 모듈입니다.
  // 해당 두 개의 객체를 context.subscriptions에 push해야 기능이 작동합니다.
  const MakeCommentDisposable = MakeCommentDisposableModule(context);
  const AutoCompleteProvider = AutoCompleteProviderModule(context);

  context.subscriptions.push(MakeCommentDisposable, AutoCompleteProvider);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
