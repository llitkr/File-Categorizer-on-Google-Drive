function trigger(option) {
  var configList = DriveApp.getFilesByName(nameOfConfigFile);
  
  while(configList.hasNext())
  {
    var config = configList.next();
    categorizeFiles(config, option);
  }
}

function main(){
  startTime = (new Date()).getTime();
  var option = {
    moveFile: true,
    moveFolder: true,
    moveEtc : true,
    etcName : '그 외 기타'
  }
  
  trigger(option);
}
