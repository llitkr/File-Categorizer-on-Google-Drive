function categorizeFiles(config, option){
  var configFolders = config.getParents();
  if(!configFolders.hasNext())
    console.log('config 파일에 연결된 부모 폴더가 없음. 앱 종료');
  var folder = configFolders.next();
  var folderID = folder.getId();
  var targetFolder;
  var targetFolderID;
  var result = 0;
  var configID = config.getId();
  var i = 0;
  
  var configSpread = SpreadsheetApp.openById(config.getId());
  var fileList;
  var folderList;
  var isEtcFolder = 0;
  var configSheet = configSpread.getSheets();
  configSheet = configSheet[0];
  var categoryData = configSheet.getRange(2, 1, configSheet.getLastRow()-1, 3).getValues();    // [0]은 파일 검색어, [1]은 목적지 폴더 아이디, [3]은 기타
  var lengthOfCategoryData = categoryData.length;
  for(i=0; i<lengthOfCategoryData; i++)
  {
    currentTime = (new Date()).getTime();
    console.log(`현재 실행으로부터 ${(currTime - startTime) / 1000}초 지남.`);
    if(categoryData[i][0] == 'etc')
    {
      isEtcFolder = i+1;
      continue;
    }
    console.log(`(${i}/${lengthOfCategoryData})키워드 "${categoryData[i][0]}" 처리 시작`);
    targetFolder = DriveApp.getFolderById(categoryData[i][1]);
    targetFolderID = targetFolder.getId();
    if(targetFolderID == null || targetFolderID == undefined)       // 검색어에 해당하는 폴더 ID가 없으면 직접 만듦. 스프레드시트는 변경 불가하지만 폴더명은 임의로 변경 가능하고 폴더 이동 역시 가능
    {
      var range = configSheet.getRange(i+2, 2);
      targetFolder = folder.createFolder(`${categoryData[i][0]}${suffixForCreatingFolders}`);
      targetFolderID = targetFolder.getId();
      range.setValue(targetFolderID);
      categoryData[i][1] = targetFolderID;
    }
    if(option.moveFile)
      categorizeFileList(`title contains "${categoryData[i][0]}" and title != "${nameOfConfigFile}" and parents in "${folderID}"`, targetFolder, folder);  // 검색 시 붙어있는 단어일 경우 앞부분(접두어)만을 검색함에 유의.(예: "2일" 키워드로 검색 시 "1박2일" 파일은 검색되지 않음)
    if(option.moveFolder)
      categorizeFolderList(`title contains "${categoryData[i][0]}" and parents in "${folderID}"`, targetFolder, folder, categoryData, lengthOfCategoryData)  // 검색 시 붙어있는 단어일 경우 앞부분(접두어)만을 검색함에 유의.(예: "2일" 키워드로 검색 시 "1박2일" 폴더는 검색되지 않음)
  }
  if(option.moveEtc)
  {
    var etcFolder;
    if(isEtcFolder == 0)
    {
      try
      {
        etcFolder = DriveApp.searchFolders(`title contains "${option.etcName}" and parents in "${folderID}"`);
        etcFolder = etcFolder.next();
        var lastRowOfConfigSheet = configSheet.getLastRow() + 1;
        configSheet.getRange(lastRowOfConfigSheet, 1).setValue('etc');
        configSheet.getRange(lastRowOfConfigSheet, 2).setValue(etcFolder.getId());
      }
      catch(err)
      {
        console.log('에러 발생, 에러 : ' + err);
        etcFolder = folder.createFolder(option.etcName);
        var lastRowOfConfigSheet = configSheet.getLastRow() + 1;
        configSheet.getRange(lastRowOfConfigSheet, 1).setValue('etc');
        configSheet.getRange(lastRowOfConfigSheet, 2).setValue(etcFolder.getId());
      }
    }
    else
      etcFolder = DriveApp.getFolderById(categoryData[isEtcFolder-1][1]);
    
    if(option.moveFile)
    {
      fileList = DriveApp.searchFiles(`title != "${nameOfConfigFile}" and parents in "${folderID}"`);
      while(fileList.hasNext())
      {
        var fileToMove = fileList.next();
        console.log(`(기타)선택된 파일 : ${fileToMove.getName()}`);
        moveFile(fileToMove, etcFolder, folder);
      }
    }
    if(option.moveFolder)
    {
      folderList = folder.getFolders();
      while(folderList.hasNext())
      {
        var folderToMove = folderList.next();
        var folderIDToMove = folderToMove.getId();
        if(isFolderInCategoryData(categoryData, lengthOfCategoryData, folderIDToMove))
           continue;
        else
        {
          console.log(`(기타)선택된 폴더 : ${folderToMove.getName()}`);
          moveFolder(folderToMove, etcFolder, folder);
        }
      }
    }
  }
}

async function categorizeFileList(query, targetFolder, originalFolder)
{
  fileList = DriveApp.searchFiles(query);
  while(fileList.hasNext())
  {
    var fileToMove = fileList.next();
    console.log(`파일:"${fileToMove.getName()}" 선택 및 이동`);
    moveFile(fileToMove, targetFolder, originalFolder);
  }
}

async function categorizeFolderList(query, targetFolder, originalFolder, categoryData, lengthOfCategoryData)
{
  folderList = DriveApp.searchFolders(query);
  while(folderList.hasNext())
  {
    var folderToMove = folderList.next();
    var folderIDToMove = folderToMove.getId();
    if(isFolderInCategoryData(categoryData, lengthOfCategoryData, folderIDToMove))
       continue;
    else
    {
      console.log(`폴더:"${folderToMove.getName()}" 선택 및 이동`);
      moveFolder(folderToMove, targetFolder, originalFolder);
    }
  }
}

async function moveFile(file, targetFolder, originalFolder)
{
  targetFolder.addFile(file);
  originalFolder.removeFile(file);
}

async function moveFolder(folder, targetFolder, originalFolder)
{
  targetFolder.addFolder(folder);
  originalFolder.removeFolder(folder);
}

function isFolderInCategoryData(categoryData, lengthOfCategoryData, folderID)
{
  for(var i=0; i<lengthOfCategoryData; i++)
    if(folderID == categoryData[i][1])
      return 1;
  
  return 0;
}

function removeFiles(removeFileList, fileNameToRemove){
  while(removeFileList.hasNext())
  {
    var fileToRemove = removeFileList.next();
    if(fileToRemove.getName() != fileNameToRemove)
      continue;
    var parentFolder = fileToRemove.getParents();
    if(parentFolder.hasNext())
    {
      console.log(`${getDirectory(fileToRemove)} 파일 삭제 중`);
      parentFolder = parentFolder.next();
      fileToRemove.setTrashed(true);
      var dirFiles = parentFolder.getFiles();
      var dirFile;
      var i=0;
      while(dirFiles.hasNext())
      {
        i++;
        dirFile = dirFiles.next();
      }
      if(i==1)
      {
        moveFile(dirFile, parentFolder.getParents().next(), parentFolder);
        parentFolder.setTrashed(true);
        console.log(`${dirFile.getName()}파일이 하나만 있기 때문에 바깥 폴더로 빼내고 폴더 삭제`);
      }
      else
      {
        console.log(`${dirFile.getName()}파일이 하나 이상이기 때문에 폴더는 삭제하지 않음`);
      }
    }
    else
    {
      console.log(`미아 파일. 파일만 삭제함.`);
      fileToRemove.setTrashed(true);
    }
  currentTime = (new Date()).getTime() / 1000;
  if(currentTime - startTime > MAXIMUM_EXE_TIME)
  {
    console.log('실행시간 초과로 다음 실행으로 넘겨줌');
    return removeFileList;
  }
  }
  return removeFileList;
}

function getDirectory(file){
  var directory = '';
  var parent = file.getParents();
  if(parent.hasNext())
    return getDirectory(parent.next()) + '/' + file.getName();
  else
    return file.getName();
}
