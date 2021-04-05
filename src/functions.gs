function categorizeFiles(config, option, filI, filProp, userMail){
  var date = new Date();
  date = `${date.getFullYear()}. ${(date.getMonth()+1)}. ${date.getDate()}`;
  var configFolders = config.getParents();
  if(!hasNext(configFolders))
  {
    console.log('config 파일에 연결된 부모 폴더가 없음. 다음 config 파일 탐색');
    return;
  }
  var folder = configFolders.next();
  console.log(`${getDirectory(config)} 파일 처리 시작`);
  var folderID = folder.getId();
  var targetFolder;
  var targetFolderID;

  var testLog = [[`${date}에 시행한 테스트 로그`]];
  
  var configSpread = SpreadsheetApp.openById(config.getId());
  var fileList;
  var folderList;
  var isEtcFolder = 0;
  var configSheet = configSpread.getSheets();
  var optionSheet = configSpread.getSheetByName('option');
  if(optionSheet)
  {
    var optionArr = optionSheet.getDataRange().getValues();
    
    for(var i=0; i<optionArr.length; i++)
      option[optionArr[i][0].replace(` : `, '')] = optionArr[i][1];
    
    console.log(`옵션 내용 요약 : 
파일 이동 : ${option.moveFile}
폴더 이동 : ${option.moveFolder}
기타 파일 이동 : ${option.moveEtc}
기타 파일 폴더 : ${option.etcName}
테스트 모드 : ${option.testMode}
폴더 접두사 : ${option.suffix}`);
  }

  if(option.suffix == undefined)
    option.suffix = suffixForCreatingFolders;

  configSheet = configSheet[0];
  var rowNumOfConfigSheet = configSheet.getLastRow();
  if(rowNumOfConfigSheet < 2)
    return;
  var categoryData = configSheet.getRange(2, 1, rowNumOfConfigSheet-1, 3).getValues();    // [0]은 파일 검색어, [1]은 목적지 폴더 아이디, [3]은 기타
  var lengthOfCategoryData = categoryData.length;
  for(i=filI; i<lengthOfCategoryData; i++)
  {
    var qr = '';     // 검색 시 활용할 쿼리
    if(categoryData[i][0].includes('"'))    // 키워드가 여러 개일 때
    {
      qr = '(';
      var qrs = categoryData[i][0].split('"');
      for(var k=0; k<qrs.length; k++)
      {
        if(!k)
        {
          var qrsm = qrs[k].split(' ');
          for(var l=0; l<qrsm.length; l++)
          {
            if(!l)
              qr += '(title contains "' + qrsm[l] + '"';
            else
            {
              qr += ` and title contains "${qrsm[l]}"`;
            }
          }
        }
        else
        {
          var qrsm = qrs[k].split(' ');
          for(var l=0; l<qrsm.length; l++)
          {
            if(!l)
              qr += ` or (title contains "${qrsm[l]}"`;
            else
            {
              qr += ` and title contains "${qrsm[l]}"`;
            }
          }
        }
        qr += ')';
      }
      qr += ')';
    }
    else      // 키워드가 하나일 때
    {
      var qrsm = categoryData[i][0].split(' ');
      qr = '(';
        for(var l=0; l<qrsm.length; l++)
        {
          if(!l)
            qr += `title contains "${qrsm[l]}"`;
          else
          {
            qr += ` and title contains "${qrsm[l]}"`;
          }
        }
      qr += ')';
    }
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
    try
    {
      targetFolder = DriveApp.getFolderById(categoryData[i][1]);
      targetFolderID = targetFolder.getId();
    }
    catch(err)
    {
      targetFolder = folder.createFolder(`${categoryData[i][0]}${option.suffix}`);
      targetFolderID = targetFolder.getId();
      categoryData[i][1] = targetFolderID;
      if(option.testMode)
      {
        testLog[testLog.length] = new Array();
        testLog[testLog.length-1][0] = `키워드 "${categoryData[i][0]}"에 대한 폴더가 없거나 ID가 잘못되어 새 폴더를 만듦.(새 폴더명 : ${categoryData[i][0]}${option.suffix})`;
      }
      console.log(`${categoryData[i][1]} 아이디로 새 폴더를 만듦.(새 폴더명 : ${categoryData[i][0]}${option.suffix}`);
    }
    if(targetFolderID == null || targetFolderID == undefined)       // 검색어에 해당하는 폴더 ID가 없으면 직접 만듦. 스프레드시트는 변경 불가하지만 폴더명은 임의로 변경 가능하고 폴더 이동 역시 가능
    {
      targetFolder = folder.createFolder(`${categoryData[i][0]}${option.suffix}`);
      targetFolderID = targetFolder.getId();
      categoryData[i][1] = targetFolderID;
      if(option.testMode)
      {
        testLog[testLog.length] = new Array();
        testLog[testLog.length-1][0] = `키워드 "${categoryData[i][0]}"에 대한 폴더가 없거나 ID가 잘못되어 새 폴더를 만듦.(새 폴더명 : ${categoryData[i][0]}${option.suffix})`;
      }
    }
    if(option.moveFile)
      if(option.testMode)
        testLog = categorizeFileListTest(`${qr} and title != "${nameOfConfigFile}" and parents in "${folderID}"`, targetFolder, folder, testLog);
      else
        fileCount = categorizeFileList(`${qr} and title != "${nameOfConfigFile}" and parents in "${folderID}"`, targetFolder, folder, filProp, userMail);  // 검색 시 붙어있는 단어일 경우 앞부분(접두어)만을 검색함에 유의.(예: "2일" 키워드로 검색 시 "1박2일" 파일은 검색되지 않음)
    if(option.moveFolder)
      if(option.testMode)
        testLog = categorizeFolderListTest(`${qr} and parents in "${folderID}"`, targetFolder, folder, categoryData, lengthOfCategoryData, testLog);
      else
        folderCount = categorizeFolderList(`${qr} and parents in "${folderID}"`, targetFolder, folder, categoryData, lengthOfCategoryData, filProp, userMail)  // 검색 시 붙어있는 단어일 경우 앞부분(접두어)만을 검색함에 유의.(예: "2일" 키워드로 검색 시 "1박2일" 폴더는 검색되지 않음)
    if((fileCount || folderCount) && option.testMode != true)
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
    console.log(`키워드 외 기타 파일 처리 시작.(폴더:${option.etcName})`);
    if(isEtcFolder == 0)
      for(i=0; i<categoryData.length; i++)
        if(categoryData[i][0] == 'etc')
        {
          isEtcFolder = i+1;
          break;
        }
    var fileCount = 0;
    var folderCount = 0;
    var etcFolder;
    if(isEtcFolder == 0)
    {
      try
      {
        etcFolder = DriveApp.searchFolders(`title contains "${option.etcName}" and parents in "${folderID}"`);
        if(hasNext(etcFolder))
        {
          etcFolder = etcFolder.next();
          categoryData[categoryData.length] = new Array(3);
          categoryData[categoryData.length-1][0] = 'etc';
          categoryData[categoryData.length-1][1] = etcFolder.getId();
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
    {
      etcFolder = DriveApp.getFolderById(categoryData[isEtcFolder-1][1]);
    }
    
    if(option.moveFile)
    {
      fileList = DriveApp.searchFiles(`title != "${nameOfConfigFile}" and parents in "${folderID}"`);
      if(option.testMode)
      {
        while(hasNext(fileList))
        {
          var fileToMove = fileList.next();
          var isSelected = 0;
          for(var k=0; k<testLog.length; k++)
            if(testLog[k][0].includes(`파일 "${fileToMove.getName()}"를`))
            {
              isSelected = 1;
              break;
            }
          if(!isSelected)
          {
            testLog[testLog.length] = new Array();
            testLog[testLog.length-1][0] = `파일 "${fileToMove.getName()}"를 "${folder.getName()}" 폴더에서 "${etcFolder.getName()}" 폴더로 이동`;
          }
        }
      }
      else
      {
        while(hasNext(fileList))
        {
          var fileToMove = fileList.next();
          console.log(`(기타)선택된 파일 : ${fileToMove.getName()}`);
          moveFile(fileToMove, etcFolder, filProp, userMail);
          fileCount++;
          currentTime = (new Date()).getTime() / 1000;
          if(currentTime - startTime > MAXIMUM_EXE_TIME)
          {
            configSheet.getRange(2, 1, categoryData.length, 3).setValues(categoryData);
            return;
          }
        }
      }
    }
    if(option.moveFolder)
    {
      folderList = folder.getFolders();
      if(option.testMode)
      {
        while(hasNext(folderList))
        {
          var folderToMove = folderList.next();
          if(isFolderInCategoryData(categoryData, lengthOfCategoryData, folderIDToMove))
             continue;
          else
          {
            var isSelected = 0;
            for(var k=0; k<testLog.length; k++)
              if(testLog[k][0].includes(`폴더 "${folderToMove.getName()}"를`))
              {
                isSelected = 1;
                break;
              }
            if(!isSelected)
            {
              testLog[testLog.length] = new Array();
              testLog[testLog.length-1][0] = `폴더 "${folderToMove.getName()}"를 "${folder.getName()}" 폴더에서 "${etcFolder.getName()}" 폴더로 이동`;
            }
          }
        }
      }
      else
      {
        while(hasNext(folderList))
        {
          var folderToMove = folderList.next();
          var folderIDToMove = folderToMove.getId();
          if(isFolderInCategoryData(categoryData, lengthOfCategoryData, folderIDToMove))
             continue;
          else
          {
            console.log(`(기타)선택된 폴더 : ${folderToMove.getName()}`);
            moveFolder(folderToMove, etcFolder, filProp, userMail);
            folderCount++;
          }
          if(currentTime - startTime > MAXIMUM_EXE_TIME)
          {
            configSheet.getRange(2, 1, categoryData.length, 3).setValues(categoryData);
            return;
          }
        }
      }
    }
    if((fileCount || folderCount) && option.testMode != true)
      categoryData[isEtcFolder-1][2] = `${date}에 마지막으로 ${fileCount}개의 파일과 ${folderCount}개의 폴더를 이동`;

  }
  filProp.setProperty(`${userMail}filI`, i);

  configSheet.getRange(2, 1, categoryData.length, 3).setValues(categoryData);

  if(option.testMode)
  {
    var testLogSheet = configSpread.getSheetByName('testLog');
    if(!testLogSheet)
      testLogSheet = configSpread.insertSheet('testLog', configSpread.getSheets().length);
    
    testLogSheet.getDataRange().clear();
    
    if(testLog.length == 1)
      testLog[0][0] = '동작 없음';

    testLogSheet.getRange(1, 1, testLog.length, testLog[0].length).setValues(testLog);
    var indexRange = testLogSheet.getRange(1, 1, 1, testLog[0].length);
    indexRange.setBackground('yellow');
    indexRange.setFontWeight("bold");
    indexRange.setHorizontalAlignment("center")
    if(testLog.length > 1)
      testLogSheet.autoResizeColumn(1);
  }
  
  return;
}

function categorizeFileListTest(query, targetFolder, originalFolder, testLog)
{
  var targetFolderName = targetFolder.getName();
  var originalFolderName = originalFolder.getName();
  fileList = DriveApp.searchFiles(query);

  while(hasNext(fileList))
  {
    var fileToMove = fileList.next();
    testLog[testLog.length] = new Array();
    testLog[testLog.length-1][0] = `파일 "${fileToMove.getName()}"를 "${originalFolderName}" 폴더에서 "${targetFolderName}" 폴더로 이동`;
    }
  
  return testLog;
}

function categorizeFileList(query, targetFolder, originalFolder, filProp, userMail)
{
  var count = 0;
  fileList = DriveApp.searchFiles(query);
  while(hasNext(fileList))
  {
    count++;
    var fileToMove = fileList.next();
    console.log(`파일:"${fileToMove.getName()}" 선택 및 "${targetFolder.getName()}(${targetFolder.getId()})" 폴더로 이동`);
    moveFile(fileToMove, targetFolder, filProp, userMail);
    currentTime = (new Date()).getTime() / 1000;
    if(currentTime - startTime > MAXIMUM_EXE_TIME)
      return count;
  }
  return count;
}

function categorizeFolderListTest(query, targetFolder, originalFolder, categoryData, lengthOfCategoryData, testLog)
{
  var targetFolderName = targetFolder.getName();
  var originalFolderName = originalFolder.getName();

  folderList = DriveApp.searchFolders(query);
  while(hasNext(folderList))
  {
    var folderToMove = folderList.next();
    var folderIDToMove = folderToMove.getId();
    if(isFolderInCategoryData(categoryData, lengthOfCategoryData, folderIDToMove))
       continue;
    else
    {
      testLog[testLog.length] = new Array();
      testLog[testLog.length-1][0] = `폴더 "${folderToMove.getName()}"를 "${originalFolderName}" 폴더에서 "${targetFolderName}" 폴더로 이동`;
    }
  }
  return testLog;
}

function categorizeFolderList(query, targetFolder, originalFolder, categoryData, lengthOfCategoryData, filProp, userMail)
{
  var count = 0;
  folderList = DriveApp.searchFolders(query);
  while(hasNext(folderList))
  {
    var folderToMove = folderList.next();
    var folderIDToMove = folderToMove.getId();
    if(isFolderInCategoryData(categoryData, lengthOfCategoryData, folderIDToMove))
       continue;
    else
    {
      console.log(`폴더:"${folderToMove.getName()}" 선택 및 "${targetFolder.getName()}(${targetFolder.getId()})" 폴더로 이동`);
      moveFolder(folderToMove, targetFolder, filProp, userMail);
    }
    count++;
    currentTime = (new Date()).getTime() / 1000;
    if(currentTime - startTime > MAXIMUM_EXE_TIME)
      return count;
  }
  return count;
}

function moveFile(file, targetFolder, filProp, userMail)
{
  filProp.setProperty(`${userMail}lastFileId`, file.getId());
  var errCount = 0;
  while(errCount<3)
  {
    try{
      file.moveTo(targetFolder);
      return 0;
    }
    catch(err)
    {
      errCount++;
      console.log(`에러 ${err} 발생으로 다시 시도`);
    }
  }
  console.log(`에러 3회 발생으로 최종 실패`);
  return 1;    // 에러 발생 시 1 반환
}

function moveFileR(file, targetFolder)
{
  var errCount = 0;
  while(errCount<3)
  {
    try{
      file.moveTo(targetFolder);
      return 0;
    }
    catch(err)
    {
      errCount++;
      console.log(`에러 ${err} 발생으로 다시 시도`);
    }
  }
  console.log(`에러 3회 발생으로 최종 실패`);
  return 1;    // 에러 발생 시 1 반환
}

function moveFolder(folder, targetFolder, filProp, userMail)
{
  if(folder == targetFolder)
    return;
  var errCount = 0;
  filProp.setProperty(`${userMail}lastFolderId`, folder.getId());
  while(errCount<3)
  {
    try{
      folder.moveTo(targetFolder);
      return 0;
    }
    catch(err)
    {
      errCount++;
      console.log(`에러 ${err} 발생으로 다시 시도`);
    }
  }
  console.log(`에러 3회 발생으로 최종 실패`);
  return 1;    // 에러 발생 시 1 반환
}

function hasNext(item)
{
  var result = 1;
  var errCount = 0;
  while(errCount<3)
  {
    try{
      result = item.hasNext();
      return result;
    }
    catch(err)
    {
      errCount++;
      console.log(`에러 ${err} 발생으로 다시 시도`);
    }
  }
  console.log(`에러 3회 발생으로 최종 실패`);
  return 0;    // 에러 발생 시 0 반환
}

function isFolderInCategoryData(categoryData, lengthOfCategoryData, folderID)
{
  for(var i=0; i<lengthOfCategoryData; i++)
    if(folderID == categoryData[i][1])
      return 1;
  
  return 0;
}

function removeFiles(removeFileList, fileNameToRemove){
  while(hasNext(removeFileList))
  {
    var fileToRemove = removeFileList.next();
    if(fileToRemove.getName() != fileNameToRemove)
      continue;
    var parentFolder = fileToRemove.getParents();
    if(hasNext(parentFolder))
    {
      console.log(`${getDirectory(fileToRemove)} 파일 삭제 중`);
      parentFolder = parentFolder.next();
      fileToRemove.setTrashed(true);
      var dirFiles = parentFolder.getFiles();
      var dirFolders = parentFolder.getFolders();
      var dirFile;
      var dirFolder;
      var i=0;
      var j=0;
      while(hasNext(dirFiles) && i<2)
      {
        i++;
        dirFile = dirFiles.next();
      }
      while(hasNext(dirFolders) && j == 0)
      {
        j++;
        dirFolder = dirFolders.next();
      }
      if(i==1 && j==0)
      {
        moveFileR(dirFile, parentFolder.getParents().next());
        parentFolder.setTrashed(true);
        console.log(`${dirFile.getName()}파일이 하나만 있기 때문에 바깥 폴더로 빼내고 폴더 삭제`);
      }
      else if(i)
      {
        console.log(`${dirFile.getName()}파일이 하나 이상이기 때문에 폴더는 삭제하지 않음`);
      }
      else
      {
        console.log('파일을 찾을 수 없으므로 스킵');
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
  if(hasNext(parent))
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
