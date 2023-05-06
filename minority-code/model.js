const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { activate } = require('./extension');

class Comments {
   constructor(name) {
      this.name = name;
      this.REQUIRE = {list : []};
      this.REVIEW = {list : []};
   }
}

class Data {
   constructor(to, message, path, line) {
      this.TO = to;
      this.BY = "";
      this.message = message;
      this.path = path;
      this.line = line;
   }
}

function collectComments(username) {
   const folderPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
   const programFiles = getProgramFiles(folderPath);
   const comments = getComments(programFiles, username);
   console.log(comments);
   return comments;
  }
  
function getProgramFiles(folderPath) {
   let files = fs.readdirSync(folderPath);
   let programFiles = [];
   for (let i = 0; i < files.length; i++) {
     const filename = path.join(folderPath, files[i]);
     const stat = fs.statSync(filename);
     if (stat.isDirectory()) {
      const subProgramFiles = getProgramFiles(filename);
      programFiles = programFiles.concat(subProgramFiles);
     } else if (filename.endsWith('.c') || filename.endsWith('.cpp') || filename.endsWith('.java')|| filename.endsWith('.js')) {
      programFiles.push(filename);
     }
   }
   return programFiles;
  }
  
function getComments(programFiles, username) {
   let comments = '';
   const everyComments = new Comments(username);
   for (let i = 0; i < programFiles.length; i++) {
     const content = fs.readFileSync(programFiles[i], 'utf-8');
     const lines = content.split('\n');
     const lineLength = lines.length;

     // 파일 내의 모든 line에 대해서 검사
     let j = 0;
     while(j < lineLength) {
      // 하나의 line 읽기
      const line = lines[j].trim();

      // 만약 "/*"로 시작한다면
      if (line.startsWith('/*')) {
        let lineNum = j;
        // 그 라인에서 "/*"을 지우고 " " 기준으로 split!
        const startTokens = line.substring(2).trim().split(' ');
        // 첫 번째 라인이 "TO @" 패턴이라면
        if(startTokens[0] == "TO" && startTokens[1].startsWith("@")){
         
         // reciver 받아오기
         const reciver = startTokens[1].substring(1).trim();
         // 첫 라인 이후부터 계속 메세지 읽기
         j += 1;
         let message = "";
         let state = "";
         const dataList = [];
         while(j < lineLength && lines[j].trim().startsWith("*")){
            let line = lines[j].trim();
            const tokens = line.split(" ");
            if(tokens[0].length == 1){ // * 안녕하세요 -> 안녕하세요
               tokens.shift();
            }
            else{ // *안녕하세요 -> 안녕하세요
               tokens[0] = tokens[0].substring(1);
            }
            
            // 처음인 경우
            if(state == ""){
               if(tokens[0] == "REQUIRE:" || tokens[0] == "REVIEW:"){
                  state = tokens[0];
               }
            }
            // 새로운 state를 만난다면
            else if((tokens[0] == "REQUIRE:" || tokens[0] == "REVIEW:" || tokens[0] == "BY") && (tokens[0] != state)){
               if(tokens[0] == "BY"){
                  dataList.push({state : state, data : new Data(reciver, message, programFiles[i], lineNum)});
                  let sender = tokens[1].substring(1).trim();
                  if(sender.endsWith("/")){
                     sender.substring(0, sender.length-2);
                  }
                  for(let k = 0; k < dataList.length; k++){
                     dataList[k].data.BY = sender;

                     if(reciver === username || username === undefined){
                        if(dataList[k].state == "REQUIRE:"){
                           everyComments.REQUIRE.list.push(dataList[k].data);
                        }
                        else{
                           everyComments.REVIEW.list.push(dataList[k].data);
                        }
                     }
                  }
                  break;
               }
               dataList.push({state : state, data : new Data(reciver, message, programFiles[i], lineNum)});
               state = tokens[0];
               message = "";
            }
            else if(state == "REQUIRE:" || state == "REVIEW:"){
               line = line.substring(1).trim();
               message += (line + " ");
            }
            j += 1;
         }
        }
      }
      j += 1;
     }
   }
   return everyComments;
  }

  module.exports = {
   getComments,
   collectComments,
    getProgramFiles,
    Comments,
    Data
}