function trigger(option) {
  var configList = DriveApp.getFilesByName(nameOfConfigFile);
  
  while(configList.hasNext())
  {
    var config = configList.next();
    if(config.getName() == nameOfConfigFile)
      categorizeFiles(config, option);
  }
}

function main(){
  startTime = (new Date()).getTime();
  var option = {
    moveFile: true,
    moveFolder: true,
    moveEtc : false,
    etcName : '그 외 기타'
  }
  
  trigger(option);
}

function removeAds(){  // 특정 이름을 가진 파일들을 모두 탐색해 지우고, 그 파일 삭제 후 해당 parent 폴더에 남는 파일이 하나밖에 없으면 그 파일을 상위 폴더로 끌어올림
  startTime = (new Date()).getTime() / 1000;
  var remProp = PropertiesService.getScriptProperties();
  var remRun = remProp.getProperty('remRun');
  var token = 0;
  var i;
  
  switch(remRun)
  {
    case 'running':
      console.log('이미 다른 프로세스에서 진행중이므로 종료');
      return;
    case 'continue':    // 이전 작업에서 이어서 해야할 때
      remProp.setProperty('remRun', 'running');
      console.log('remRun의 상태를 running으로 변경 후 이전 작업에 이어서 시작');
      i = parseInt(remProp.getProperty('remI'));
      console.log(`프로퍼티에서 받아온 i값 : ${i}`);
      token = remProp.getProperty('remToken');
      break;
    default:
      remProp.setProperty('remRun', 'running');
      i = 0;
      console.log('remRun의 상태를 running으로 변경 후 새 작업 시작');
  }
  while(i<fileNameToRemove.length)
  {
    remProp.setProperty('remI', i);
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
    if(currentTime > MAXIMUM_EXE_TIME)
    {
      remProp.setProperties({
        remRun: 'continue',
        remToken: removeFileList.getContinuationToken()});
      ScriptApp.newTrigger("removeAds")
      .timeBased()
      .after(EXE_TERM*1000)
      .create();
      console.log(`다음 실행 시간 : ${EXE_TERM}초 뒤`);
      return;
    }
    i++;
  }
  remProp.setProperties({
        remRun: 'stop',
        remToken: 0});
  return;
}
