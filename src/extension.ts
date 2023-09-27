import * as vscode from "vscode";

function isEnum(text: string): boolean {
  // This is a naive check. In real-world scenarios, you might want to use a parser like TypeScript's AST.
  return text.startsWith("enum");
}

function convertEnumToSwitch(text: string): string {
  const lines = text.split("\n");
  const enumName = lines[0].trim().split(/\s+/)[1];
  const cases = [];

  for (let i = 1; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (line.endsWith(",")) {
      cases.push(line.split(",")[0].split("=")[0].trim());
    } else {
      cases.push(line.split("=")[0].trim());
    }
  }

  const switchTemplate = vscode.workspace
    .getConfiguration("enum-switch")
    .get("switchTemplate", "case ${enumName}.${caseName}:\n  return '';\n");
  let switchStatement = `switch(value) {\n`;

  for (const c of cases) {
    let caseStatement = switchTemplate;
    caseStatement = caseStatement.replace(/\$\{enumName\}/g, enumName);
    caseStatement = caseStatement.replace(/\$\{caseName\}/g, c);
    switchStatement += `  ${caseStatement}`;
  }

  switchStatement += "}\n";
  return switchStatement;
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "enum-switch.convertEnum",
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        const document = editor.document;
        const selection = editor.selection;
        const text = document.getText(selection);

        if (isEnum(text)) {
          const switchStatement = convertEnumToSwitch(text);

          await vscode.env.clipboard.writeText(switchStatement);
          vscode.window.showInformationMessage(
            "Switch statement copied to clipboard."
          );
        } else {
          vscode.window.showInformationMessage("Not a valid TypeScript enum.");
        }
      }
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
