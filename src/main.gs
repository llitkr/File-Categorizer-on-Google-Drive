function trigger(option) {
  var configList = DriveApp.getFilesByName(nameOfConfigFile);
  
  while(configList.hasNext())
  {
    var config = configList.next();
    categorizeFiles(config, option);
  }
}

function main(){
  var option = {
    moveFile: true,
    moveFolder: true,
    moveEtc : false,
    etcName : 'ETC'
  }
  
  trigger(option);
}
