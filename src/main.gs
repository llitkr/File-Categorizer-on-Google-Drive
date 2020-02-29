function trigger(option) {
  var filProp = PropertiesService.getScriptProperties();
  var userMail = `${Session.getActiveUser().getEmail()}-`;
  var filRun = filProp.getProperty(`${userMail}filRun`);
  var configToken = 0;
  var fileToken = 0;
  var i;
  
  switch(filRun)
  {
    case 'running':
      console.log('스크립트를 이미 다른 프로세스에서 진행중이므로 종료(script.google.com - 내 실행에서 실행 중인 스크립트가 없음에도 이 메세지가 나타난다면 예기치 못한 에러로 종료된 경우이므로 스크립트 파일 - 프로젝트 속성에서 run 속성을 stop으로 변경 후 재시도)');
      return;
    case 'continue':    // 이전 작업에서 이어서 해야할 때
      filProp.setProperty(`${userMail}filRun`, 'running');
      console.log('스크립트 실행 상태를 running으로 변경 후 이전 작업에 이어서 시작');
      i = parseInt(filProp.getProperty(`${userMail}filI`));
      configToken = filProp.getProperty(`${userMail}filConfigToken`);
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
    configList = DriveApp.getFilesByName(nameOfConfigFile);
  
  while(configList.hasNext())
  {
    filProp.setProperty(`${userMail}filConfigToken`, configList.getContinuationToken());
    var config = configList.next();
    if(config.getName() == nameOfConfigFile)
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
    filProp.setProperty(`${userMail}filI`, 0);
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
    etcName : '그 외 기타'
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
  remProp.deleteProperty(`${userMail}remRun`);
  remProp.deleteProperty(`${userMail}remToken`);
  remProp.deleteProperty(`${userMail}remI`);
  deleteTriggers('removeAds');
  return;
}
