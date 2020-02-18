function categorizeFiles(config, option){
  var configFolders = config.getParents();
  if(!configFolders.hasNext())
    console.log('예외 발생. 앱 종료');
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
  var categoryData = configSheet.getRange(2, 1, configSheet.getLastRow()-1, 3).getValues();    // [0]은 파일 검색어, [1]은 목적지 폴더 아이디, [3]은 기타
  var lengthOfCategoryData = categoryData.length;
  for(i=0; i<lengthOfCategoryData; i++)
  {
    if(categoryData[i][0] == 'etc')
      isEtcFolder = i+1;
    try
    {
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
    }
    catch(err)       // 검색어에 해당하는 폴더 ID가 없으면 직접 만듦. 스프레드시트는 변경 불가하지만 폴더명은 임의로 변경 가능하고 폴더 이동 역시 가능
    {
      var range = configSheet.getRange(i+2, 2);
      targetFolder = folder.createFolder(`${categoryData[i][0]}${suffixForCreatingFolders}`);
      targetFolderID = targetFolder.getId();
      range.setValue(targetFolderID);
      categoryData[i][1] = targetFolderID;
    }
    if(option.moveFile)
    {
      fileList = DriveApp.searchFiles(`title contains "${categoryData[i][0]}" and parents in "${folderID}"`);
      while(fileList.hasNext())
      {
        var fileToMove = fileList.next();
        if(fileToMove.getId() == configID)
          continue;
        console.log(`선택된 파일 : ${fileToMove.getName()}`);
        moveFile(fileToMove, targetFolder, folder);
      }
    }
    if(option.moveFolder)
    {
      folderList = DriveApp.searchFolders(`title contains "${categoryData[i][0]}" and parents in "${folderID}"`);
      while(folderList.hasNext())
      {
        var folderToMove = folderList.next();
        var folderIDToMove = folderToMove.getId();
        if(isFolderInCategoryData(categoryData, lengthOfCategoryData, folderIDToMove))
           continue;
        else
        {
          console.log(`선택된 폴더 : ${folderToMove.getName()}`);
          moveFolder(folderToMove, targetFolder, folder);
        }
      }
    }
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
      fileList = folder.getFiles();
      while(fileList.hasNext())
      {
        var fileToMove = fileList.next();
        if(fileToMove.getId() == configID)    // config 파일이 넘어가지 않도록 조치
          continue;
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
  for(i=0; i<lengthOfCategoryData; i++)
    if(folderID == categoryData[i][1])
      return 1;
  
  return 0;
}
