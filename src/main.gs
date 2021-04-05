function trigger(option) {
  var filProp = PropertiesService.getScriptProperties();
  var userMail = `${Session.getActiveUser().getEmail()}-`;
  var filRun = filProp.getProperty(`${userMail}filRun`);
  var configToken = 0;
  var i;
  
  switch(filRun)
  {
    case 'running':
      var lastFileProp = filProp.getProperty(`${userMail}lastFileId`);
      var lastFolderProp = filProp.getProperty(`${userMail}lastFolderId`);
      var runStack = filProp.getProperty(`${userMail}runStack`);
      var runStackFile = filProp.getProperty(`${userMail}runStackFile`);
      var runStackFolder = filProp.getProperty(`${userMail}runStackFolder`);
      if(runStackFile == lastFileProp && runStackFolder == lastFolderProp)
        if(!runStack)
        {
          runStack = 1;
          filProp.setProperty(`${userMail}runStack`, runStack);
          return;
        }
        else if(runStack == 3)
        {
          console.log('지난 실행이 오류로 인해 실패한 것으로 보임. 모든 속성값을 지우고 초기화');
          filProp.deleteAllProperties();
          return;
        }
        else
        {
          runStack++;
          filProp.setProperty(`${userMail}runStack`, runStack);
          return;
        }
      else
      {
        if(lastFileProp)
          filProp.setProperty(`${userMail}runStackFile`, lastFileProp);
        if(lastFolderProp)
          filProp.setProperty(`${userMail}runStackFolder`, lastFolderProp);
      }
      console.log('스크립트를 이미 다른 프로세스에서 진행중이므로 종료(script.google.com - 내 실행에서 실행 중인 스크립트가 없음에도 이 메세지가 나타난다면 portal.llit.kr/support 로 문의)');
      return;
    case 'continue':    // 이전 작업에서 이어서 해야할 때
      filProp.deleteProperty('runStack');
      filProp.setProperty(`${userMail}filRun`, 'running');
      console.log('스크립트 실행 상태를 running으로 변경 후 이전 작업에 이어서 시작');
      i = parseInt(filProp.getProperty(`${userMail}filI`));
      configToken = filProp.getProperty(`${userMail}filConfigToken`);
      console.log(`토큰값 ${configToken}을 받아와 이어 시작`);
      break;
    default:
      filProp.setProperty(`${userMail}filRun`, 'running');
      i = 0;
      console.log('스크립트 실행 상태를 running으로 변경 후 새 작업 시작');
  }
  
  var configList;
  
  if(configToken)
  {
    configList = DriveApp.continueFileIterator(configToken);
    configToken = 0;
  }
  else
  {
    configList = DriveApp.getFilesByName(nameOfConfigFile);
    filProp.setProperty(`${userMail}filConfigToken`, configList.getContinuationToken());
  }
  
  while(hasNext(configList))
  {
    var config = configList.next();
    if(config.getName() == nameOfConfigFile && config.getMimeType() == 'application/vnd.google-apps.spreadsheet')
      categorizeFiles(config, option, i, filProp, userMail);
    if(currentTime - startTime > MAXIMUM_EXE_TIME)
    {
      filProp.setProperty(`${userMail}filRun`, 'continue');
      deleteTriggers('main');
      ScriptApp.newTrigger("main")
      .timeBased()
      .after(EXE_TERM*1000)
      .create();
      console.log(`다음 실행 시간 : ${EXE_TERM}초 뒤`);
      return;
    }
    filProp.setProperty(`${userMail}filConfigToken`, configList.getContinuationToken());
    console.log(`토큰값 ${configList.getContinuationToken()}으로 변경`);
    filProp.setProperty(`${userMail}filI`, 0);
    i=0;
  }
  
  console.log('모든 파일 분류 끝. 스크립트 종료.');
  filProp.deleteProperty(`${userMail}filRun`);
  filProp.deleteProperty(`${userMail}filConfigToken`);
  filProp.deleteProperty(`${userMail}filI`);
  deleteTriggers('main');
  
  return;
}

function mainTrigger(){
  main();
}

function onetime(option) {
  var config = DriveApp.getFileById(option.configID);
  
  categorizeFiles(config, option);
}

function main(){
  startTime = (new Date()).getTime() / 1000;
  currentTime = startTime;
  
  var option = {
    moveFile: true,
    moveFolder: true,
    moveEtc : true,
    etcName : '그 외 기타',
    testMode : false
  }
  
  trigger(option);
  
  return;
}

function run(option){
  startTime = (new Date()).getTime() / 1000;
  currentTime = startTime;
  
  trigger(option);
  
  return;
}

function onetimeMain(){
  var option = {
    configID: '12cXnxjx7qO2NBdbU5WB1v0l4WFkYLH_8_zSrnftBCvY',
    moveFile: true,
    moveFolder: true,
    moveEtc : false,
    etcName : '그 외 기타'
  }
  
  onetime(option);
}

function removeAdsTrigger(){
 removeAds(); 
}

function removeAds(){  // 특정 이름을 가진 파일들을 모두 탐색해 지우고, 그 파일 삭제 후 해당 parent 폴더에 남는 파일이 하나밖에 없으면 그 파일을 상위 폴더로 끌어올림
  startTime = (new Date()).getTime() / 1000;
  
  var userMail = `${Session.getActiveUser().getEmail()}-`;
  var remProp = PropertiesService.getScriptProperties();
  var remRun = remProp.getProperty(`${userMail}remRun`);
  var token = 0;
  var i;
  
  switch(remRun)
  {
    case 'running':
      console.log('이미 다른 프로세스에서 진행중이므로 종료');
      return;
    case 'continue':    // 이전 작업에서 이어서 해야할 때
      remProp.setProperty(`${userMail}remRun`, 'running');
      console.log('remRun의 상태를 running으로 변경 후 이전 작업에 이어서 시작');
      i = parseInt(remProp.getProperty(`${userMail}remI`));
      token = remProp.getProperty(`${userMail}remToken`);
      break;
    default:
      remProp.setProperty(`${userMail}remRun`, 'running');
      i = 0;
      console.log('remRun의 상태를 running으로 변경 후 새 작업 시작');
  }
  while(i<fileNameToRemove.length)
  {
    remProp.setProperty(`${userMail}remI`, i);
    console.log(`${i+1}번째 삭제할 파일 : ${fileNameToRemove[i]}`);
    var removeFileList;
    if(token)
    {
      removeFileList = DriveApp.continueFolderIterator(token);
      token = 0;
    }
    else
      removeFileList = DriveApp.getFilesByName(fileNameToRemove[i]);
    removeFileList = removeFiles(removeFileList, fileNameToRemove[i]);
    if(currentTime - startTime > MAXIMUM_EXE_TIME)
    {
      remProp.setProperty(`${userMail}remRun`, 'continue');
      remProp.setProperty(`${userMail}remToken`, removeFileList.getContinuationToken());
      
      deleteTriggers('removeAds');
      
      ScriptApp.newTrigger("removeAds")
      .timeBased()
      .after(EXE_TERM*1000)
      .create();
      console.log(`다음 실행 시간 : ${EXE_TERM}초 뒤`);
      
      return;
    }
    i++;
  }
  console.log('모든 파일 삭제 및 후속조치 완료. 스크립트 종료.');
  remProp.deleteProperty(`${userMail}remRun`);
  remProp.deleteProperty(`${userMail}remToken`);
  remProp.deleteProperty(`${userMail}remI`);
  deleteTriggers('removeAds');
  return;
}

function moveAllFiles() {
  startTime = (new Date()).getTime() / 1000;
  currentTime = startTime;
  
  var option = {
    moveFile: true,
    moveFolder: true
  };
  
  const oFolderId = '0BzQP6-UNiaNWcm9zZ1pKR08yTE0';
  const nFolderId = '16jFPhhe_lNaRzN9ftOougoUCWh_3_T45';
  
  var movProp = PropertiesService.getScriptProperties();
  
  var userMail = `${Session.getActiveUser().getEmail()}-`;
  var movRun = movProp.getProperty(`${userMail}movRun`);
  
  switch(movRun)
  {
    case 'running':
      console.log('스크립트를 이미 다른 프로세스에서 진행중이므로 종료(script.google.com - 내 실행에서 실행 중인 스크립트가 없음에도 이 메세지가 나타난다면 portal.llit.kr/support 로 문의)');
      return;
    case 'continue':    // 이전 작업에서 이어서 해야할 때
      movProp.setProperty(`${userMail}movRun`, 'running');
      console.log('스크립트 실행 상태를 running으로 변경 후 이전 작업에 이어서 시작');
      break;
    default:
      movProp.setProperty(`${userMail}movRun`, 'running');
      console.log('스크립트 실행 상태를 running으로 변경 후 새 작업 시작');
  }
  var oFolder = DriveApp.getFolderById(oFolderId);
  var nFolder = DriveApp.getFolderById(nFolderId);
  
  if(option.moveFile)
  {
    var fileListToMove = oFolder.getFiles();
    while(hasNext(fileListToMove))
    {
      moveFile(fileListToMove.next(), nFolder, oFolder);
      currentTime = (new Date()).getTime() / 1000;
      if(currentTime - startTime > MAXIMUM_EXE_TIME)
      {
        movProp.setProperty(`${userMail}movRun`, 'continue');
      
        deleteTriggers('moveAllFiles');
      
        ScriptApp.newTrigger("moveAllFiles")
        .timeBased()
        .after(EXE_TERM*1000)
        .create();
        console.log(`다음 실행 시간 : ${EXE_TERM}초 뒤`);
      
        return;
      }
    }
  }
  if(option.moveFolder)
  {
    var folderListToMove = oFolder.getFolders();
    while(hasNext(folderListToMove))
    {
      moveFolder(folderListToMove.next(), nFolder, oFolder);
      if(currentTime - startTime > MAXIMUM_EXE_TIME)
      {
        movProp.setProperty(`${userMail}movRun`, 'continue');
      
        deleteTriggers('moveAllFiles');
      
        ScriptApp.newTrigger("moveAllFiles")
        .timeBased()
        .after(EXE_TERM*1000)
        .create();
        console.log(`다음 실행 시간 : ${EXE_TERM}초 뒤`);
      
        return;
      }
    }
  }
  
  movProp.deleteProperty(`${userMail}movRun`);
}

function copyMain()
{
  startTime = (new Date()).getTime() / 1000;
  currentTime = startTime;
  var oldFolder = DriveApp.getFolderById('16jFPhhe_lNaRzN9ftOougoUCWh_3_T45');
  var newFolder = DriveApp.getFolderById('1N_sZg1iVGEKN10wvz3Q_9GYRrsjqNwLp');
  
  copyAllFiles(oldFolder, newFolder);
  
  console.log(`************** 모든 폴더 처리 끝. 스크립트 종료 ***************`);
}

function copyAllFiles(oldFolder, newFolder)
{
  
  var prop = PropertiesService.getScriptProperties();
  var fileList;
  var folderList;
  if(prop.getProperty(newFolder.getId()) == 'finished')
  {
    prop.setProperty(newFolder.getId() + 'Token', DriveApp.continueFileIterator(prop.getProperty(newFolder.getId() + 'Token')).getContinuationToken());
    return;
  }
  else if(prop.getProperty(newFolder.getId()) == 'continue')
    if(prop.getProperty(newFolder.getId() + 'Token'))
      fileList = DriveApp.continueFileIterator(prop.getProperty(newFolder.getId() + 'Token'));
    else
      fileList = oldFolder.getFiles();
  else
  {
    prop.setProperty(newFolder.getId(), 'continue');
    fileList = oldFolder.getFiles();
  }
  
  while(hasNext(fileList))
  {
    var file = fileList.next();
    
    console.log(`${file.getName()} 파일 복사중`);
    
    try
    {
    file.makeCopy(newFolder);
    }
    catch(err)
    {
      console.log(`에러 발생 : ${err}`);
      prop.setProperty(newFolder.getId() + 'Token', fileList.getContinuationToken());
      deleteTriggers('moveMain');
      ScriptApp.newTrigger("moveMain")
      .timeBased()
      .after((1000*60*60*24))
      .create();
      console.log(`총 옮긴 파일 수는 ${totalNum}개, 총 옮긴 파일 사이즈는 ${totalSize/1024/1024/1024}GB.`);
      console.log(`다음 실행 시간 : 1일 뒤`);
      exit = 1;
      return;
    }
    currentTime = (new Date()).getTime() / 1000;
    if(currentTime - startTime > MAXIMUM_EXE_TIME)
    {
      console.log(`최대 실행 시간 초과로 다음 실행으로 넘김`);
      prop.setProperty(newFolder.getId() + 'Token', fileList.getContinuationToken());
      deleteTriggers('main');
      ScriptApp.newTrigger("main")
      .timeBased()
      .after((1000*30))
      .create();
      console.log(`총 옮긴 파일 수는 ${totalNum}개, 총 옮긴 파일 사이즈는 ${totalSize/1024/1024/1024}GB.`);
      console.log(`다음 실행 시간 : 30초 뒤`);
      return;
    }
    totalNum++;
    totalSize += file.getSize();
  }
  prop.setProperty(newFolder.getId() + 'Token', fileList.getContinuationToken());
  folderList = oldFolder.getFolders();
  while(hasNext(folderList))
  {
    var folder = folderList.next();
    var nnewFolder = DriveApp.searchFolders(`title = "${folder.getName()}" and parents in "${newFolder.getId()}"`);

    if(hasNext(nnewFolder))
      nnewFolder = nnewFolder.next();
    else
      nnewFolder = newFolder.createFolder(folder.getName());
    console.log(`**********${folder.getName()} 폴더로 들어가기*************`);
    copyAllFiles(folder, nnewFolder);
    if(currentTime - startTime > MAXIMUM_EXE_TIME || exit)
      return;
  }
  console.log(`**********${oldFolder.getName()} 폴더 처리 끝*************`);
  prop.setProperty(newFolder.getId(), 'finished');
}
