function categorizeFiles(config, option, filI, filProp, userMail){
  var date = new Date();
  date = `${date.getFullYear()}. ${(date.getMonth()+1)}. ${date.getDate()}`;
  var configFolders = config.getParents();
  if(!configFolders.hasNext())
  {
    console.log('config 파일에 연결된 부모 폴더가 없음. 다음 config 파일 탐색');
    return;
  }
  var folder = configFolders.next();
  var folderID = folder.getId();
  var targetFolder;
  var targetFolderID;
  var result = 0;
  var configID = config.getId();
  
  var configSpread = SpreadsheetApp.openById(config.getId());
  var fileList;
  var folderList;
  var isEtcFolder = 0;
  var configSheet = configSpread.getSheets();
  configSheet = configSheet[0];
  var rowNumOfConfigSheet = configSheet.getLastRow();
  if(rowNumOfConfigSheet < 2)
    return;
  var categoryData = configSheet.getRange(2, 1, rowNumOfConfigSheet-1, 3).getValues();    // [0]은 파일 검색어, [1]은 목적지 폴더 아이디, [3]은 기타
  var lengthOfCategoryData = categoryData.length;
  for(i=filI; i<lengthOfCategoryData; i++)
  {
    var folderCount = 0;
    var fileCount = 0;
    if(categoryData[i][0] == 'etc')
    {
      isEtcFolder = i+1;
      continue;
    }
    if(categoryData[i][0] == '')    // 해당 행에 키워드가 없는 경우
    {
      console.log(`경고 : ${folder.getName()}의 설정 파일 ${i+1}번째 행에 키워드 데이터가 없음`);
      i++;
    }
    console.log(`(${i}/${lengthOfCategoryData})키워드 "${categoryData[i][0]}" 처리 시작`);
    targetFolder = DriveApp.getFolderById(categoryData[i][1]);
    targetFolderID = targetFolder.getId();
    if(targetFolderID == null || targetFolderID == undefined)       // 검색어에 해당하는 폴더 ID가 없으면 직접 만듦. 스프레드시트는 변경 불가하지만 폴더명은 임의로 변경 가능하고 폴더 이동 역시 가능
    {
      targetFolder = folder.createFolder(`${categoryData[i][0]}${suffixForCreatingFolders}`);
      targetFolderID = targetFolder.getId();
      categoryData[i][1] = targetFolderID;
    }
    if(option.moveFile)
      fileCount = categorizeFileList(`title contains "${categoryData[i][0]}" and title != "${nameOfConfigFile}" and parents in "${folderID}"`, targetFolder, folder);  // 검색 시 붙어있는 단어일 경우 앞부분(접두어)만을 검색함에 유의.(예: "2일" 키워드로 검색 시 "1박2일" 파일은 검색되지 않음)
    if(option.moveFolder)
      folderCount = categorizeFolderList(`title contains "${categoryData[i][0]}" and parents in "${folderID}"`, targetFolder, folder, categoryData, lengthOfCategoryData)  // 검색 시 붙어있는 단어일 경우 앞부분(접두어)만을 검색함에 유의.(예: "2일" 키워드로 검색 시 "1박2일" 폴더는 검색되지 않음)
    if(fileCount || folderCount)
      categoryData[i][2] = `${date}에 마지막으로 ${fileCount}개의 파일과 ${folderCount}개의 폴더를 이동`;
    currentTime = (new Date()).getTime() / 1000;
    if(currentTime - startTime > MAXIMUM_EXE_TIME)
    {
      filProp.setProperty(`${userMail}filI`, i);
      configSheet.getRange(2, 1, categoryData.length, 3).setValues(categoryData);
      return;
    }
  }
  filProp.setProperty(`${userMail}filI`, i);
  if(option.moveEtc)
  {
    var fileCount = 0;
    var folderCount = 0;
    var etcFolder;
    if(isEtcFolder == 0)
    {
      try
      {
        etcFolder = DriveApp.searchFolders(`title contains "${option.etcName}" and parents in "${folderID}"`);
        if(etcFolder.hasNext())
        {
          etcFolder = etcFolder.next();
          categoryData[categoryData.length+1] = new Array(3);
          categoryData[categoryData.length][0] = 'etc';
          categoryDate[categoryData.length][1] = etcFolder.getId();
          lengthOfCategoryData = categoryData.length;
          isEtcFolder = categoryData.length;
        }
        else
        {
          console.log('etc 폴더가 존재하지 않아 새로 생성함');
          etcFolder = folder.createFolder(option.etcName);
          categoryData[categoryData.length] = new Array(3);
          categoryData[categoryData.length-1][0] = 'etc';
          categoryData[categoryData.length-1][1] = etcFolder.getId();
          lengthOfCategoryData = categoryData.length;
          isEtcFolder = categoryData.length;
        }
      }
      catch(err){
        console.log('에러 발생, 에러 : ' + err); }
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
        fileCount++;
        currentTime = (new Date()).getTime() / 1000;
        if(currentTime - startTime > MAXIMUM_EXE_TIME)
        {
          configSheet.getRange(2, 1, categoryData.length, 3).setValues(categoryData);
          return;
        }
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
          folderCount++;
        }
        if(currentTime - startTime > MAXIMUM_EXE_TIME)
        {
          configSheet.getRange(2, 1, categoryData.length, 3).setValues(categoryData);
          return;
        }
      }
    }
    
    categoryData[isEtcFolder-1][2] = `${date}에 마지막으로 ${fileCount}개의 파일과 ${folderCount}개의 폴더를 이동`;

  }
  filProp.setProperty(`${userMail}filI`, i);

  configSheet.getRange(2, 1, categoryData.length, 3).setValues(categoryData);
  return;
}

function categorizeFileList(query, targetFolder, originalFolder)
{
  var count = 0;
  fileList = DriveApp.searchFiles(query);
  while(fileList.hasNext())
  {
    count++;
    var fileToMove = fileList.next();
    console.log(`파일:"${fileToMove.getName()}" 선택 및 이동`);
    moveFile(fileToMove, targetFolder, originalFolder);
    currentTime = (new Date()).getTime() / 1000;
    if(currentTime - startTime > MAXIMUM_EXE_TIME)
      return count;
  }
  return count;
}

function categorizeFolderList(query, targetFolder, originalFolder, categoryData, lengthOfCategoryData)
{
  var count = 0;
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
    count++;
    currentTime = (new Date()).getTime() / 1000;
    if(currentTime - startTime > MAXIMUM_EXE_TIME)
      return count;
  }
  return count;
}

function moveFile(file, targetFolder, originalFolder)
{
  targetFolder.addFile(file);
  originalFolder.removeFile(file);
}

function moveFolder(folder, targetFolder, originalFolder)
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

function deleteTriggers(funcName)
{
  var triggers = ScriptApp.getProjectTriggers();
  
  for(var i=0; i<triggers.length; i++)
    if(triggers[i].getHandlerFunction() == funcName)
      ScriptApp.deleteTrigger(triggers[i]);
  
  return;
}
