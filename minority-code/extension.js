// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const url = require("url");
const path = require("path");
const model = require("./model");

class ContentProvider {
  static scheme = 'references';
  _documents = new Map;

  provideDocumentLinks(document, token) {
		// While building the virtual document we have already created the links.
		// Those are composed from the range inside the document and a target uri
		// to which they point
		const doc = this._documents.get(document.uri.toString());
		if (doc) {
			return doc.links;
		}
	}
}

class TreeDataProvider {
  onDidChangeTreeData;

  data;

  update(comments) {
    console.log("comments", comments);

    const requireItemList = [];
    const requireList = comments.REQUIRE.list;
    console.log("requireList", requireList);
    for(let i = 0 ; i < requireList.length ; i ++ ) {
      requireItemList.push(new TreeItem(requireList[i].message, Object.assign(new model.Data(), requireList[i])));
    }

    const reviewItemList = [];
    const reviewList = comments.REVIEW.list;
    for(let i = 0 ; i < reviewList.length ; i ++ ) {
      reviewItemList.push(new TreeItem(reviewList[i].message, Object.assign(new model.Data(), reviewList[i])));
    }

    this.data = null;
    this.data = [];

    this.data.push(new TreeItem("Require", requireItemList));
    this.data.push(new TreeItem("Review", reviewItemList));

    console.log(this.data);
  }

  constructor() {
    this.data = [];
  }

  getTreeItem(element) {
    return element;
  }

  getChildren(element) {
    if (element === undefined) {
      return this.data;
    }
    return element.children;
  }
}

class TreeItem extends vscode.TreeItem {
  children;

  command = {
    "title": "require",
    "command": "minority-code.printReferences",
    "arguments": ["defalutPath", "line"]
  }

  constructor(label, children) {
    super(
      label,
      (children === undefined) || (children instanceof model.Data)
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Expanded
    );
    this.children = children;
    console.log("children", children);
    this.command.arguments[0] = children.path;
    this.command.arguments[1] = children.line;
  }
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const provider = new ContentProvider();

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "minority-code" is now active!');

  // 트리 클릭시 이벤트
  let treeProvider = new TreeDataProvider();
  let tree = vscode.window.createTreeView("require",{treeDataProvider: treeProvider, showCollapseAll: true });

   // 문서가 저장될 때마다 실행된다.
  vscode.workspace.onDidSaveTextDocument((e) => {
    const l = e.languageId;
    if((l === "c") || (l === "cpp") || (l==="java") || (l === "javascript")) {
      const comments = model.collectComments();
      treeProvider.update(comments);
      vscode.window.createTreeView("require",{treeDataProvider: treeProvider, showCollapseAll: true });
    }
  })

  //트리가 확장됐을 때 호출되는 콜백
  tree.onDidExpandElement(e => {
  })

  tree.onDidCollapseElement(e => {
  })
  
  vscode.languages.registerDocumentLinkProvider({ scheme: ContentProvider.scheme }, provider)

  const providerRegistrations = vscode.Disposable.from(
		// vscode.workspace.registerTextDocumentContentProvider(ContentProvider.scheme, provider),
		vscode.languages.registerDocumentLinkProvider({ scheme: ContentProvider.scheme }, provider)
	);

  const commandRegistration = vscode.commands.registerCommand('minority-code.printReferences', async (... args)=> {
    // 아무 에디터도 열려있지 않을 때
    console.log("args : ", args);
    const newPosition = new vscode.Position(Number(args[1]), 0); // move the cursor to the 3rd column of the 1st line
    const newSelection = new vscode.Selection(newPosition, newPosition);

    
    // // uri path로 구하기
    const new_uri = vscode.Uri.parse(args[0]);
  
    return moveCursorToUri(new_uri, newSelection);
	});


  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  //command 들의 disposable입니다. 배열 뒤에 commands를 추가하면 됩니다.
  let disposables = new Array(
    // 주석 전부 가져오기
    vscode.commands.registerCommand("minority-code.helloWorld", function() {
      const comments =  model.collectComments();
      let treeProvider = new TreeDataProvider();
      treeProvider.update(comments);
      vscode.window.createTreeView("require",{treeDataProvider: treeProvider, showCollapseAll: true });
    }),

    //refresh
    vscode.commands.registerCommand("minority-code.refresh", function () {
      vscode.window.showInformationMessage("refresh");
    })
  );

  for (const disposable of disposables) {
    context.subscriptions.push(disposable);
  }
  context.subscriptions.push(providerRegistrations, commandRegistration);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};

let seq = 0;

function encodeLocation(uri, pos) {
	const query = JSON.stringify([uri.toString(), pos.line, pos.character]);
	return vscode.Uri.parse(`${ContentProvider.scheme}:References.locations?${query}#${seq++}`);
}

function decodeLocation(uri) {
	const [target, line, character] = JSON.parse(uri.query);
	return [vscode.Uri.parse(target), new vscode.Position(line, character)];
}

async function moveCursorToUri(uri, selection) {
  // 현재 열려있는 모든 편집기 창에서 특정 URI를 가진 창을 찾음
  const targetEditor = vscode.window.visibleTextEditors.find((editor) => editor.document.uri.toString() === uri.toString());

  if (targetEditor) {
    // 특정 URI를 가진 창이 이미 열려있는 경우, 해당 창으로 포커스를 이동시킴
    return await vscode.window.showTextDocument(targetEditor.document, {
      selection: selection,
      viewColumn: targetEditor.viewColumn,
      preview: false
    });
  } else {
    // 특정 URI를 가진 창이 열려있지 않은 경우, 새로운 창을 열고 해당 창으로 포커스를 이동시킴
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document, { preview: false });
    vscode.window.activeTextEditor.selection = selection;
    return;
  }
}