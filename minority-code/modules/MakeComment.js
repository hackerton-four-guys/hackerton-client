const vscode = require("vscode");

/** 주석 생성 커맨드 */

module.exports = function (parentContext) {
  const MakeCommentDisposable = vscode.commands.registerCommand(
    "minority-code.makeComment",
    async function () {
      let editor = vscode.window.activeTextEditor;
      if (!editor) {
        return; // No open text editor
      }
      const username = parentContext.globalState.get("username");
      const tailComment = ` * BY @${username} */`;
      const comment =
        "/* TO \n" +
        " * REVIEW: \n" +
        " * \n" +
        " * REQUIRE: \n" +
        " * \n" +
        tailComment;

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
  return MakeCommentDisposable;
};
